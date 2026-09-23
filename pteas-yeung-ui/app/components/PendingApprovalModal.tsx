'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, ShieldAlert, CheckCircle2, Phone, Send, Home, LogIn, 
  ExternalLink, QrCode, Copy, Check, Sparkles, Building2, CreditCard
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getOptimizedImageUrl } from './RoomCard';

interface PendingApprovalModalProps {
    isOpen: boolean;
    onClose?: () => void;
    userName?: string;
    userRole?: string;
    userEmail?: string;
    lang?: 'kh' | 'en';
}

interface AdminSettings {
    system_name?: string;
    admin_bank_name?: string;
    admin_bank_account_name?: string;
    admin_bank_account_number?: string;
    admin_bank_qr_url?: string;
    admin_hotline_secondary?: string;
    admin_payment_notes_kh?: string;
    admin_payment_notes_en?: string;
    footer_hotline?: string;
    footer_telegram?: string;
    footer_email?: string;
}

export default function PendingApprovalModal({
    isOpen,
    onClose,
    userName,
    userRole = 'tenant',
    userEmail,
    lang = 'kh',
}: PendingApprovalModalProps) {
    const [settings, setSettings] = useState<AdminSettings | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;

        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/settings');
                if (isMounted && res.data) {
                    setSettings(res.data);
                }
            } catch (err) {
                // Fallback default info
            }
        };

        fetchSettings();

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const isKh = lang === 'kh';

    const roleLabel = userRole === 'owner' 
        ? (isKh ? 'ម្ចាស់ផ្ទះជួល (Owner)' : 'Property Owner')
        : (isKh ? 'អ្នកជួល (Tenant)' : 'Tenant');

    const systemName = settings?.system_name || 'PTEAS YEUNG';
    const bankName = settings?.admin_bank_name || 'ABA Bank';
    const bankAccName = settings?.admin_bank_account_name || 'PTEAS YEUNG PLATFORM';
    const bankAccNumber = settings?.admin_bank_account_number || '001 234 567';
    const qrUrl = settings?.admin_bank_qr_url ? getOptimizedImageUrl(settings.admin_bank_qr_url) : null;
    const primaryHotline = settings?.footer_hotline || '+855 12 345 678';
    const secondaryHotline = settings?.admin_hotline_secondary || '+855 98 765 432';
    const telegramUrl = settings?.footer_telegram || 'https://t.me/PteasYeungAdmin';
    const telegramHandle = telegramUrl.startsWith('http') 
        ? `@${telegramUrl.split('/').pop()}` 
        : telegramUrl.startsWith('@') ? telegramUrl : `@${telegramUrl}`;

    const paymentNotes = isKh
        ? (settings?.admin_payment_notes_kh || 'សូមផ្ញើវិក្កយបត្រ ឬរូបភាពផ្ទេរប្រាក់មកកាន់ Telegram ផ្លូវការរបស់រដ្ឋបាល ដើម្បីផ្ទៀងផ្ទាត់ និងបើកដំណើរការគណនីភ្លាមៗ។')
        : (settings?.admin_payment_notes_en || 'Please send the transfer receipt or screenshot to our official Admin Telegram for instant verification and account activation.');

    const handleCopyAccountNumber = () => {
        navigator.clipboard.writeText(bankAccNumber.replace(/\s+/g, ''));
        setCopied(true);
        toast.success(isKh ? 'បានចម្លងលេខគណនី!' : 'Account number copied!');
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[95vh] overflow-y-auto custom-scrollbar">
                {/* Decorative Accent Strip */}
                <div className="h-2 w-full bg-linear-to-r from-amber-500 via-rose-500 to-indigo-600 animate-pulse" />

                <div className="p-6 sm:p-8 space-y-6">
                    {/* Header Icon & Title */}
                    <div className="text-center space-y-3">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
                            <Clock className="w-8 h-8 animate-spin-slow" />
                        </div>

                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/50 mb-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                <span>{isKh ? 'រង់ចាំការត្រួតពិនិត្យ និងអនុម័ត' : 'Awaiting Review & Approval'}</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                                {isKh 
                                    ? 'គណនីកំពុងរង់ចាំការបញ្ជាក់ពីរដ្ឋបាល' 
                                    : 'Account Pending Admin Confirmation'}
                            </h2>
                            {userName && (
                                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                                    {isKh ? 'សូមស្វាគមន៍' : 'Welcome'}, <span className="font-bold text-slate-900 dark:text-slate-200">{userName}</span> ({roleLabel})
                                </p>
                            )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto font-medium">
                            {isKh
                                ? 'គណនីរបស់អ្នកត្រូវបានបង្កើតដោយជោគជ័យ! សូមទាក់ទងមកកាន់រដ្ឋបាល ដើម្បីផ្ទៀងផ្ទាត់ និងបញ្ចប់ការទូទាត់ប្រាក់។ រដ្ឋបាលនឹងបើកដំណើរការគណនីជូនអ្នកភ្លាមៗក្រោយការផ្ទៀងផ្ទាត់។'
                                : 'Your account has been registered! Please contact our Admin to verify details and complete the payment process. Once confirmed, your account will be activated immediately.'}
                        </p>
                    </div>

                    {/* Payment & Contact Details Card (Dynamic from Admin Settings) */}
                    <div className="bg-slate-50 dark:bg-slate-950/70 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <CreditCard size={14} className="text-indigo-600" />
                                <span>{isKh ? 'ព័ត៌មានទូទាត់ និងទំនាក់ទំនងរដ្ឋបាល' : 'Admin Payment & Contact Info'}</span>
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-black uppercase">
                                {systemName}
                            </span>
                        </div>

                        {/* Optional QR Code Card */}
                        {qrUrl && (
                            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                <div className="w-28 h-28 shrink-0 bg-white p-1 rounded-xl shadow-xs border border-slate-100 overflow-hidden flex items-center justify-center">
                                    <img 
                                        src={qrUrl} 
                                        alt="Admin Payment KHQR" 
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                        <QrCode size={11} />
                                        <span>KHQR / ABA Scan</span>
                                    </span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                        {isKh ? 'ស្កេនទូទាត់ប្រាក់តាម KHQR' : 'Scan to pay with any Mobile Banking App'}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {bankAccName}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Bank Details & Hotline Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Bank Details */}
                            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                                    {isKh ? `គណនីធនាគារ (${bankName})` : `Bank Account (${bankName})`}:
                                </p>
                                <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm tracking-wide">
                                        {bankAccNumber}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyAccountNumber}
                                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                        title={isKh ? 'ចម្លងលេខគណនី' : 'Copy account number'}
                                    >
                                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase truncate">
                                    {bankAccName}
                                </p>
                            </div>

                            {/* Hotline Phone */}
                            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                                    {isKh ? 'ទូរស័ព្ទរដ្ឋបាល (Hotline)' : 'Admin Hotline'}:
                                </p>
                                <a 
                                    href={`tel:${primaryHotline.replace(/[^+\d]/g, '')}`} 
                                    className="font-mono font-black text-rose-600 dark:text-rose-400 hover:underline block text-sm"
                                >
                                    {primaryHotline}
                                </a>
                                {secondaryHotline && (
                                    <a 
                                        href={`tel:${secondaryHotline.replace(/[^+\d]/g, '')}`}
                                        className="font-mono text-[11px] text-slate-500 dark:text-slate-400 hover:underline block"
                                    >
                                        {secondaryHotline}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Telegram Direct Support Banner */}
                        <div className="pt-1">
                            <a
                                href={telegramUrl.startsWith('http') ? telegramUrl : `https://t.me/${telegramUrl.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-sky-950 dark:text-sky-200">
                                            {isKh ? 'ផ្ញើវិក្កយបត្រតាម Telegram ទៅ Admin' : 'Send receipt via Telegram to Admin'}
                                        </p>
                                        <p className="text-[11px] text-sky-700 dark:text-sky-400 font-mono">{telegramHandle}</p>
                                    </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                            </a>
                        </div>

                        {/* Dynamic Payment Note */}
                        {paymentNotes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic border-t border-slate-200/80 dark:border-slate-800 pt-2.5">
                                💡 {paymentNotes}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <Link
                            href="/"
                            className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            <span>{isKh ? 'ត្រឡប់ទៅទំព័រដើម' : 'Return Home'}</span>
                        </Link>

                        <Link
                            href="/login"
                            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>{isKh ? 'ទៅកាន់ទំព័រ Login' : 'Go to Login'}</span>
                        </Link>
                    </div>

                    {onClose && (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline transition"
                            >
                                {isKh ? 'បិទផ្ទាំងនេះ' : 'Close this dialog'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
