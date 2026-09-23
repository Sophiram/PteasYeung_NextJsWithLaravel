'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, Info, Search, RefreshCw, 
  Filter, Clock, Globe, Laptop, ArrowUpDown, ChevronLeft, ChevronRight,
  Eye, CheckCircle2, XCircle, KeyRound, Activity, User as UserIcon,
  Copy, Check
} from 'lucide-react';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';
import toast from 'react-hot-toast';

interface AuditLogItem {
  id: number;
  user_id: number | null;
  user_email: string | null;
  user_role: string | null;
  event: string;
  category: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  route: string | null;
  method: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    profile_picture?: string | null;
  } | null;
}

interface TelemetryStats {
  total_events: number;
  failed_logins_24h: number;
  security_alerts_7d: number;
  unauthorized_blocked_7d: number;
  system_health: 'healthy' | 'warning' | 'danger';
  severity_breakdown: {
    info: number;
    warning: number;
    danger: number;
    critical: number;
  };
  suspicious_ips: Array<{
    ip_address: string;
    incident_count: number;
  }>;
}

export default function AdminAuditLogsPage() {
  const { language } = useLanguage();
  const isKh = language === 'kh';

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal Detail
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/admin/audit-logs/stats');
      if (res.data?.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load audit stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        per_page: 20,
      };
      if (search.trim()) params.search = search.trim();
      if (severityFilter !== 'all') params.severity = severityFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const res = await api.get('/admin/audit-logs', { params });
      if (res.data?.success) {
        setLogs(res.data.data || []);
        setTotalPages(res.data.pagination?.last_page || 1);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, severityFilter, categoryFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCopyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    toast.success(isKh ? 'បានចម្លងទិន្នន័យ JSON!' : 'Copied JSON to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'danger':
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
            <ShieldAlert size={12} />
            <span className="uppercase">{severity}</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
            <AlertTriangle size={12} />
            <span className="uppercase">{severity}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Info size={12} />
            <span className="uppercase">INFO</span>
          </span>
        );
    }
  };

  const formatBrowser = (userAgent?: string | null) => {
    if (!userAgent) return isKh ? 'មិនស្គាល់' : 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return isKh ? 'កម្មវិធីរុករក' : 'Browser';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {isKh ? 'កំណត់ហេតុសុវត្ថិភាព & សកម្មភាពប្រព័ន្ធ' : 'Security & Audit Logs'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
              Audit Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isKh 
              ? 'តាមដានសកម្មភាពសំខាន់ៗ ការប៉ុនប៉ងចូលប្រើប្រាស់ខុសច្បាប់ និងការផ្លាស់ប្តូរទិន្នន័យរដ្ឋបាលក្នុងប្រព័ន្ធ។'
              : 'Track critical system events, monitor failed authentication attempts, and audit administrator actions.'}
          </p>
        </div>

        <button
          onClick={() => {
            fetchStats();
            fetchLogs();
            toast.success(isKh ? 'បានផ្ទុកទិន្នន័យឡើងវិញជោគជ័យ' : 'Audit logs refreshed');
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{isKh ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      {/* Security Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Health */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {isKh ? 'សុវត្ថិភាពល្អ' : 'System Secure'}
              </span>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {isKh ? 'ត្រួតពិនិត្យ 24/7' : 'Monitored'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {isKh ? 'គ្មានការគំរាមកំហែងធ្ងន់ធ្ងរ' : 'Active defense enabled'}
            </p>
          </div>
        </div>

        {/* Failed Logins (24h) */}
        <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs flex items-center gap-4 ${
          stats && stats.failed_logins_24h > 5 
            ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20' 
            : 'border-slate-200/80 dark:border-slate-800'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            stats && stats.failed_logins_24h > 0
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            <KeyRound size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isKh ? 'ចូលប្រើបរាជ័យ (២៤ម៉ោង)' : 'Failed Logins (24h)'}
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {statsLoading ? '...' : stats?.failed_logins_24h ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {stats && stats.failed_logins_24h > 0 
                ? (isKh ? 'គួរតាមដាន IP សង្ស័យ' : 'Watch suspicious IPs')
                : (isKh ? 'គ្មានការប៉ុនប៉ងសង្ស័យ' : 'Zero auth threats')}
            </p>
          </div>
        </div>

        {/* Security Alerts (7d) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isKh ? 'សញ្ញាព្រមាន (៧ថ្ងៃ)' : 'Security Alerts (7d)'}
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {statsLoading ? '...' : stats?.security_alerts_7d ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {isKh ? `${stats?.unauthorized_blocked_7d ?? 0} បានរារាំង` : `${stats?.unauthorized_blocked_7d ?? 0} blocked attempts`}
            </p>
          </div>
        </div>

        {/* Total Audit Events */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Activity size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isKh ? 'កំណត់ហេតុសរុប' : 'Total Audit Records'}
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {statsLoading ? '...' : stats?.total_events ?? totalCount}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {isKh ? 'កត់ត្រាស្វ័យប្រវត្តិ' : 'Automated telemetry'}
            </p>
          </div>
        </div>
      </div>

      {/* Suspicious IP Warning Banner if applicable */}
      {stats && stats.suspicious_ips && stats.suspicious_ips.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                {isKh ? 'បានរកឃើញអាសយដ្ឋាន IP សង្ស័យដែលមានការប៉ុនប៉ងបរាជ័យច្រើនដង៖' : 'Flagged IP Addresses with multiple security incidents:'}
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {stats.suspicious_ips.map((ip) => (
                  <span key={ip.ip_address} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-[11px] font-bold text-amber-800 dark:text-amber-200 border border-amber-300/50">
                    <Globe size={11} />
                    {ip.ip_address} ({ip.incident_count} events)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={isKh ? 'ស្វែងរកតាម IP, អ៊ីមែល, ព្រឹត្តិការណ៍...' : 'Search by IP, email, event...'}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">{isKh ? 'កម្រិតទាំងអស់ (All Severities)' : 'All Severities'}</option>
            <option value="info">{isKh ? 'ព័ត៌មានទូទៅ (Info)' : 'Info'}</option>
            <option value="warning">{isKh ? 'ការព្រមាន (Warning)' : 'Warning'}</option>
            <option value="danger">{isKh ? 'គ្រោះថ្នាក់ (Danger)' : 'Danger / Security Alert'}</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">{isKh ? 'ប្រភេទទាំងអស់ (All Categories)' : 'All Categories'}</option>
            <option value="auth">{isKh ? 'ការផ្ទៀងផ្ទាត់ (Auth)' : 'Authentication'}</option>
            <option value="security">{isKh ? 'សុវត្ថិភាព (Security)' : 'Security'}</option>
            <option value="user_management">{isKh ? 'គ្រប់គ្រងអ្នកប្រើ (User Mgmt)' : 'User Management'}</option>
            <option value="settings">{isKh ? 'ការកំណត់ប្រព័ន្ធ (Settings)' : 'Settings'}</option>
            <option value="system">{isKh ? 'ប្រព័ន្ធ (System)' : 'System'}</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">{isKh ? 'កម្រិត / ព្រឹត្តិការណ៍' : 'Severity / Event'}</th>
                <th className="py-3 px-4">{isKh ? 'អ្នកប្រើប្រាស់' : 'User / Identity'}</th>
                <th className="py-3 px-4">{isKh ? 'សកម្មភាពពិពណ៌នា' : 'Description'}</th>
                <th className="py-3 px-4">{isKh ? 'IP & ឧបករណ៍' : 'IP & Device'}</th>
                <th className="py-3 px-4">{isKh ? 'ពេលវេលា' : 'Timestamp'}</th>
                <th className="py-3 px-4 text-right">{isKh ? 'លម្អិត' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-indigo-500" />
                      <span>{isKh ? 'កំពុងទាញយកកំណត់ហេតុសុវត្ថិភាព...' : 'Loading audit records...'}</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldCheck size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {isKh ? 'មិនមានកំណត់ហេតុដែលត្រូវនឹងលក្ខខណ្ឌឡើយ' : 'No audit records match your filters'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isKh ? 'ព្យាយាមលុបការស្វែងរក ឬប្តូរលក្ខខណ្ឌចម្រោះ' : 'Try clearing your search query or reset filters'}
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Severity & Event */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {getSeverityBadge(log.severity)}
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
                          {log.event}
                        </span>
                      </div>
                    </td>

                    {/* User Identity */}
                    <td className="py-3 px-4">
                      {log.user ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden">
                            {log.user.profile_picture ? (
                              <img
                                src={getOptimizedImageUrl(log.user.profile_picture) || ''}
                                alt={log.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              log.user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {log.user.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {log.user.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
                            <UserIcon size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {log.user_email || (isKh ? 'ភ្ញៀវ / Anonymous' : 'Guest / Anonymous')}
                            </span>
                            <span className="block text-[10px] text-slate-400">Unauthenticated</span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <p className="text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                        {log.description}
                      </p>
                      {log.route && (
                        <span className="inline-block mt-0.5 text-[10px] font-mono text-slate-400">
                          {log.method} {log.route}
                        </span>
                      )}
                    </td>

                    {/* IP & Device */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-700 dark:text-slate-300">
                          <Globe size={11} className="text-slate-400" />
                          {log.ip_address || '127.0.0.1'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                          <Laptop size={11} />
                          {formatBrowser(log.user_agent)}
                        </span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock size={12} className="text-slate-400" />
                        <span>{new Date(log.created_at).toLocaleString(isKh ? 'km-KH' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}</span>
                      </div>
                    </td>

                    {/* Detail Button */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-xs font-semibold transition"
                      >
                        <Eye size={13} />
                        <span>{isKh ? 'មើល' : 'View'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              {isKh ? `ទំព័រ ${page} នៃ ${totalPages}` : `Page ${page} of ${totalPages}`} ({totalCount} {isKh ? 'កំណត់ហេតុ' : 'records'})
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getSeverityBadge(selectedLog.severity)}
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {selectedLog.event}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ID #{selectedLog.id} • {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              {/* Description box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="font-semibold text-slate-500 uppercase text-[10px] mb-1">
                  {isKh ? 'សេចក្តីពិពណ៌នា' : 'Event Description'}
                </p>
                <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {selectedLog.description}
                </p>
              </div>

              {/* Network & Device Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">IP Address</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedLog.ip_address || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Method</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedLog.method || 'GET'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">API Route</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">{selectedLog.route || 'N/A'}</span>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.user_agent && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase mb-0.5">User Agent</span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all">{selectedLog.user_agent}</span>
                </div>
              )}

              {/* Old vs New Values Payload */}
              {(selectedLog.new_values || selectedLog.old_values) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {isKh ? 'ទិន្នន័យ Payload (Sanitized)' : 'Telemetry Payload (Sanitized)'}
                    </span>
                    <button
                      onClick={() => handleCopyJson({ old: selectedLog.old_values, new: selectedLog.new_values })}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-semibold hover:underline"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 custom-scrollbar border border-slate-800">
                    {JSON.stringify({
                      old_values: selectedLog.old_values,
                      new_values: selectedLog.new_values,
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 text-xs transition"
              >
                {isKh ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
