'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, CheckCheck, CalendarCheck, FileText,
  DollarSign, Sparkles, User, ShieldAlert,
  Trash2, ExternalLink, BellOff, Loader2
} from 'lucide-react';
import api from '@/lib/api';

export interface NotificationItem {
  id: number;
  user_id?: number | null;
  role?: string | null;
  title: string;
  message: string;
  type: 'booking' | 'invoice' | 'payment' | 'system' | 'profile' | 'alert' | string;
  link?: string | null;
  is_read: boolean;
  data?: any;
  created_at: string;
}

interface NotificationDropdownProps {
  lang?: 'kh' | 'en';
  accentColor?: 'indigo' | 'rose' | 'slate';
}

export default function NotificationDropdown({
  lang = 'kh',
  accentColor = 'indigo'
}: NotificationDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      // Non-blocking
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 35 seconds for fresh alerts
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 35000);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications(true);
    }
  };

  const handleMarkAsRead = async (notification: NotificationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!notification.is_read) {
      try {
        await api.post(`/notifications/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        // Continue navigation anyway
      }
    }

    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      // Non-blocking
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const target = notifications.find((n) => n.id === id);
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      // Non-blocking
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return lang === 'kh' ? 'អម្បាញ់មិញ' : 'Just now';
      if (diffMin < 60) return lang === 'kh' ? `${diffMin} នាទីមុន` : `${diffMin}m ago`;
      if (diffHour < 24) return lang === 'kh' ? `${diffHour} ម៉ោងមុន` : `${diffHour}h ago`;
      if (diffDay === 1) return lang === 'kh' ? 'ម្សិលមិញ' : 'Yesterday';
      return lang === 'kh' ? `${diffDay} ថ្ងៃមុន` : `${diffDay}d ago`;
    } catch {
      return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <CalendarCheck size={16} className="text-indigo-500" />;
      case 'invoice':
        return <FileText size={16} className="text-emerald-500" />;
      case 'payment':
        return <DollarSign size={16} className="text-amber-500" />;
      case 'profile':
        return <User size={16} className="text-violet-500" />;
      case 'alert':
        return <ShieldAlert size={16} className="text-rose-500" />;
      default:
        return <Sparkles size={16} className="text-indigo-500" />;
    }
  };

  const getBadgeBg = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'invoice':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'payment':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'profile':
        return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      case 'alert':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const badgeColorClass = accentColor === 'rose'
    ? 'bg-rose-600'
    : 'bg-indigo-600';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition relative outline-none"
        title={lang === 'kh' ? 'ការជូនដំណឹង' : 'Notifications'}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white ${badgeColorClass} rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-pulse`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Modal/Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-150 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-900 dark:text-white">
                {lang === 'kh' ? 'ការជូនដំណឹង' : 'Notifications'}
              </span>
              {unreadCount > 0 && (
                <span className={`px-2 py-0.5 text-[10px] font-black text-white ${badgeColorClass} rounded-full`}>
                  {unreadCount} {lang === 'kh' ? 'ថ្មី' : 'New'}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
              >
                {markingAll ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={13} />}
                <span>{lang === 'kh' ? 'អានទាំងអស់' : 'Mark all read'}</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={24} className="animate-spin text-indigo-500 mb-2" />
                <p className="text-xs">{lang === 'kh' ? 'កំពុងផ្ទុក...' : 'Loading...'}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <BellOff size={22} />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'kh' ? 'គ្មានការជូនដំណឹងទេ' : 'No notifications'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'kh' ? 'លោកអ្នកបានអានព័ត៌មានគ្រប់យ៉ាងរួចរាល់ហើយ' : 'You are all caught up!'}
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n)}
                  className={`p-3.5 transition-colors cursor-pointer relative group flex items-start gap-3 ${
                    !n.is_read
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {/* Icon Box */}
                  <div className={`p-2 rounded-xl border flex-shrink-0 mt-0.5 ${getBadgeBg(n.type)}`}>
                    {getTypeIcon(n.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs font-bold truncate ${!n.is_read ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-700 dark:text-slate-300'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {formatTime(n.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    {n.link && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1.5 hover:underline">
                        <span>{lang === 'kh' ? 'មើលព័ត៌មានលម្អិត' : 'View details'}</span>
                        <ExternalLink size={10} />
                      </span>
                    )}
                  </div>

                  {/* Unread Indicator & Delete Button */}
                  <div className="flex flex-col items-center justify-between self-stretch flex-shrink-0">
                    {!n.is_read ? (
                      <span className={`w-2 h-2 rounded-full ${badgeColorClass} mt-1`} />
                    ) : (
                      <span className="w-2 h-2" />
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDelete(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-500 rounded-md"
                      title={lang === 'kh' ? 'លុប' : 'Delete'}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
