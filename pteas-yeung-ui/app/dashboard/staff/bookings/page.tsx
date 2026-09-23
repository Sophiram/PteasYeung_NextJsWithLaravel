'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
    CalendarDays, Search, RefreshCw, CheckCircle2, Clock, AlertCircle,
    User, DoorOpen, Building2, DollarSign, Calendar, Loader2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Booking {
    id: number;
    check_in_date: string;
    check_out_date?: string;
    deposit_amount: number;
    status: 'pending' | 'approved' | 'active' | 'confirmed' | 'cancelled';
    created_at: string;
    tenant?: {
        id: number;
        name: string;
        email: string;
        phone?: string;
    };
    room?: {
        id: number;
        room_number: string;
        price: number;
        property?: {
            title: string;
        };
    };
}

export default function StaffBookingsPage() {
    const { hasPermission } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [lang, setLang] = useState<'kh' | 'en'>('kh');

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/staff/bookings');
            const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setBookings(data);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            toast.error(lang === 'kh' ? 'មិនអាចទាញយកបញ្ជីកក់បានទេ' : 'Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const isKh = lang === 'kh';

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
            const query = search.toLowerCase();
            const matchesSearch = !query ||
                b.tenant?.name?.toLowerCase().includes(query) ||
                b.room?.room_number?.toLowerCase().includes(query) ||
                b.room?.property?.title?.toLowerCase().includes(query);
            return matchesStatus && matchesSearch;
        });
    }, [bookings, statusFilter, search]);

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <CalendarDays className="text-emerald-600" />
                        <span>{isKh ? 'ការកក់បន្ទប់ & ភ្ញៀវស្នាក់នៅ' : 'Bookings & Reservations'}</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {isKh ? 'ត្រួតពិនិត្យការកក់ថ្មីៗ កាលបរិច្ឆេទចូលស្នាក់នៅ និងប្រាក់កក់' : 'Review reservation requests, check-in schedules, and guest deposits'}
                    </p>
                </div>

                <button
                    onClick={fetchBookings}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>{isKh ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {['all', 'pending', 'confirmed', 'active', 'cancelled'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition ${
                                statusFilter === st
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {st === 'all' ? (isKh ? 'ទាំងអស់' : 'All') : st}
                        </button>
                    ))}
                </div>

                <div className="relative min-w-[220px]">
                    <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={isKh ? 'ស្វែងរកតាមឈ្មោះភ្ញៀវ ឬបន្ទប់...' : 'Search guest or room...'}
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                </div>
            </div>

            {/* Bookings Table */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <p className="text-xs font-semibold">{isKh ? 'កំពុងទាញយកការកក់...' : 'Loading bookings...'}</p>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 gap-2">
                    <CalendarDays size={40} className="stroke-[1.5] text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-bold text-slate-500">{isKh ? 'មិនមានទិន្នន័យការកក់ទេ' : 'No bookings found'}</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-extrabold">
                                <tr>
                                    <th className="px-5 py-3.5">{isKh ? 'ភ្ញៀវ / អ្នកជួល' : 'Guest / Tenant'}</th>
                                    <th className="px-5 py-3.5">{isKh ? 'បន្ទប់ & អគារ' : 'Room & Property'}</th>
                                    <th className="px-5 py-3.5">{isKh ? 'កាលបរិច្ឆេទចូលស្នាក់' : 'Check-In Date'}</th>
                                    <th className="px-5 py-3.5">{isKh ? 'ប្រាក់កក់' : 'Deposit'}</th>
                                    <th className="px-5 py-3.5">{isKh ? 'ស្ថានភាព' : 'Status'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {filteredBookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center shrink-0">
                                                    {b.tenant?.name?.charAt(0).toUpperCase() || 'G'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">
                                                        {b.tenant?.name || 'Guest'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {b.tenant?.phone || b.tenant?.email || '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                #{b.room?.room_number || '-'}
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                {b.room?.property?.title || 'Unknown'}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                <Calendar size={13} className="text-emerald-500" />
                                                <span>{new Date(b.check_in_date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                                            ${Number(b.deposit_amount || 0).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-block px-2.5 py-1 text-[10px] font-black uppercase rounded-full border ${
                                                b.status === 'confirmed' || b.status === 'active'
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                                                    : b.status === 'pending'
                                                    ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300'
                                                    : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                            }`}>
                                                {b.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
