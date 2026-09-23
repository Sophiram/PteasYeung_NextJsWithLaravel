'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
    DoorOpen, CheckCircle2, Clock, FileText, CalendarDays,
    Building2, Phone, Mail, Shield, ArrowRight, RefreshCw,
    AlertCircle, Sparkles, Check, Key
} from 'lucide-react';
import Link from 'next/link';

interface StaffOverview {
    staff: {
        id: number;
        name: string;
        email: string;
        permissions: string[];
    };
    owner: {
        id: number;
        name: string;
        email: string;
        phone?: string;
    };
    stats: {
        total_properties: number;
        total_rooms: number;
        occupied_rooms: number;
        available_rooms: number;
        pending_bookings: number;
        unpaid_invoices: number;
    };
}

export default function StaffOverviewPage() {
    const { user, hasPermission } = useAuth();
    const [overview, setOverview] = useState<StaffOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lang, setLang] = useState<'kh' | 'en'>('kh');

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);
        fetchOverview();
    }, []);

    const fetchOverview = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/staff/overview');
            setOverview(res.data);
        } catch (err: any) {
            console.error('Error fetching staff overview:', err);
            setError(err.response?.data?.message || (lang === 'kh' ? 'មិនអាចទាញយកទិន្នន័យទូទៅបានទេ' : 'Failed to load staff overview'));
        } finally {
            setLoading(false);
        }
    };

    const isKh = lang === 'kh';

    return (
        <div className="space-y-6">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-sky-900/10">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-sky-100">
                        <Shield size={13} />
                        <span>Staff Operational Portal</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black">
                        {isKh ? `សួស្តី, ${user?.name || 'បុគ្គលិក'}!` : `Welcome back, ${user?.name || 'Staff'}!`}
                    </h1>
                    <p className="text-xs sm:text-sm text-sky-100/90 font-medium">
                        {overview?.owner 
                            ? (isKh ? `អ្នកកំពុងបំពេញការងារជូនម្ចាស់អចលនទ្រព្យ៖ ${overview.owner.name}` : `Assigned to Property Owner: ${overview.owner.name}`)
                            : (isKh ? 'គ្រប់គ្រងស្ថានភាពបន្ទប់ វិក្កយបត្រ និងការកក់' : 'Manage room status, customer invoicing, and bookings')}
                    </p>
                </div>

                <button
                    onClick={fetchOverview}
                    className="self-start sm:self-center px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-xs flex items-center gap-1.5 transition"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>{isKh ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Refresh Data'}</span>
                </button>
            </div>

            {/* Error state */}
            {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-xs text-rose-800 dark:text-rose-200 font-semibold">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Owner Connection Info & Staff Duties */}
            {overview?.owner && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Owner Card */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 size={14} className="text-sky-500" />
                            <span>{isKh ? 'ម្ចាស់អចលនទ្រព្យ' : 'Property Owner'}</span>
                        </span>
                        <div>
                            <p className="text-base font-black text-slate-900 dark:text-white">
                                {overview.owner.name}
                            </p>
                            <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                <div className="flex items-center gap-2">
                                    <Mail size={13} className="text-slate-400 shrink-0" />
                                    <span>{overview.owner.email}</span>
                                </div>
                                {overview.owner.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={13} className="text-slate-400 shrink-0" />
                                        <span>{overview.owner.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active Permissions / Duties */}
                    <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Key size={14} className="text-indigo-500" />
                                <span>{isKh ? 'សិទ្ធិ & ភារកិច្ចដែលបានប្រគល់ជូន' : 'Assigned Responsibilities'}</span>
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                                {overview.staff?.permissions?.length || 0} {isKh ? 'សិទ្ធិ' : 'Permissions'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {overview.staff?.permissions && overview.staff.permissions.length > 0 ? (
                                overview.staff.permissions.map((p) => (
                                    <span
                                        key={p}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200 dark:border-slate-700"
                                    >
                                        <Check size={11} className="text-emerald-500" />
                                        <span>{p}</span>
                                    </span>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400">
                                    {isKh ? 'មិនទាន់មានសិទ្ធិពិសេសត្រូវបានផ្ទេរនៅឡើយទេ' : 'No specialized permissions delegated yet'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Total Rooms */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-bold uppercase">{isKh ? 'បន្ទប់សរុប' : 'Total Rooms'}</span>
                        <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                            <DoorOpen size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                        {overview?.stats.total_rooms ?? '-'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                        {overview?.stats.total_properties ?? 0} {isKh ? 'អគារ' : 'properties'}
                    </p>
                </div>

                {/* Available Rooms */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-bold uppercase">{isKh ? 'បន្ទប់ទំនេរ' : 'Available'}</span>
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                        {overview?.stats.available_rooms ?? '-'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                        {isKh ? 'រួចរាល់សម្រាប់ជួល' : 'Ready for rent'}
                    </p>
                </div>

                {/* Occupied Rooms */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-bold uppercase">{isKh ? 'បន្ទប់មានអ្នកស្នាក់' : 'Occupied'}</span>
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                            <Clock size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                        {overview?.stats.occupied_rooms ?? '-'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                        {isKh ? 'កំពុងជួល' : 'Currently rented'}
                    </p>
                </div>

                {/* Unpaid Invoices */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-bold uppercase">{isKh ? 'វិក្កយបត្រមិនទាន់បង់' : 'Unpaid Bills'}</span>
                        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                            <FileText size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                        {overview?.stats.unpaid_invoices ?? '-'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                        {isKh ? 'រង់ចាំការប្រមូលប្រាក់' : 'Awaiting collection'}
                    </p>
                </div>
            </div>

            {/* Quick Action Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Rooms Check */}
                <Link
                    href="/dashboard/staff/rooms"
                    className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 shadow-sm transition-all flex flex-col justify-between"
                >
                    <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                            <DoorOpen size={20} />
                        </div>
                        <h3 className="font-black text-base text-slate-900 dark:text-white">
                            {isKh ? 'ត្រួតពិនិត្យ & ប្តូរស្ថានភាពបន្ទប់' : 'Room Status Inspection'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {isKh ? 'ពិនិត្យបញ្ជីបន្ទប់ កត់ត្រាបន្ទប់ទំនេរ បន្ទប់កំពុងជួសជុល ឬបន្ទប់មានភ្ញៀវស្នាក់នៅ' : 'Inspect room inventory and toggle availability status on the fly'}
                        </p>
                    </div>
                    <div className="pt-4 flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:gap-2 transition-all">
                        <span>{isKh ? 'ទៅកាន់បញ្ជីបន្ទប់' : 'Go to Rooms'}</span>
                        <ArrowRight size={14} />
                    </div>
                </Link>

                {/* Invoices Collection */}
                <Link
                    href="/dashboard/staff/invoices"
                    className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm transition-all flex flex-col justify-between"
                >
                    <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <FileText size={20} />
                        </div>
                        <h3 className="font-black text-base text-slate-900 dark:text-white">
                            {isKh ? 'ប្រមូលប្រាក់ & វិក្កយបត្រ' : 'Invoices & Cash Collection'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {isKh ? 'ត្រួតពិនិត្យវិក្កយបត្រជួលបន្ទប់ ទឹក ភ្លើង និងកត់ត្រាការប្រមូលប្រាក់ពីអ្នកជួល' : 'Review rental/utility bills and collect payments from tenants'}
                        </p>
                    </div>
                    <div className="pt-4 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
                        <span>{isKh ? 'ទៅកាន់វិក្កយបត្រ' : 'Go to Invoices'}</span>
                        <ArrowRight size={14} />
                    </div>
                </Link>

                {/* Bookings */}
                <Link
                    href="/dashboard/staff/bookings"
                    className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm transition-all flex flex-col justify-between"
                >
                    <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <CalendarDays size={20} />
                        </div>
                        <h3 className="font-black text-base text-slate-900 dark:text-white">
                            {isKh ? 'ការកក់ & ទទួលភ្ញៀវ' : 'Bookings & Check-Ins'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {isKh ? 'ពិនិត្យមើលកាលវិភាគកក់បន្ទប់ថ្មីៗ និងព័ត៌មានភ្ញៀវចូលស្នាក់នៅ' : 'Check booking records, incoming guest schedules, and deposits'}
                        </p>
                    </div>
                    <div className="pt-4 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:gap-2 transition-all">
                        <span>{isKh ? 'ទៅកាន់ការកក់' : 'Go to Bookings'}</span>
                        <ArrowRight size={14} />
                    </div>
                </Link>
            </div>
        </div>
    );
}
