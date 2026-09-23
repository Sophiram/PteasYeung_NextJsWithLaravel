'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
    Loader2, CalendarCheck, Search, CheckCircle2, XCircle, Clock, 
    Building2, User, Phone, Check, X, Trash2 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Booking {
    id: number;
    booking_code?: string;
    check_in_date: string;
    check_out_date?: string;
    deposit_amount: number | string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    created_at: string;
    tenant?: {
        name: string;
        phone?: string;
        email?: string;
    };
    room?: {
        room_number: string;
        property?: {
            title: string;
        };
    };
}

export default function OwnerBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [lang, setLang] = useState<'kh' | 'en'>('kh');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/owner/bookings');
            const data = res.data?.data ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            setBookings(data);
        } catch (err: any) {
            console.error("Error fetching bookings:", err);
            if (err.response?.status !== 401) {
                toast.error(lang === 'kh' ? "មិនអាចទាញយកទិន្នន័យបានទេ!" : "Failed to fetch bookings!");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);
        fetchBookings();
    }, []);

    // 🟢 មុខងារកែប្រែ Status
    const handleStatusChange = async (id: number, newStatus: string) => {
        setActionLoading(id);
        try {
            await api.patch(`/owner/bookings/${id}/status`, { status: newStatus });
            toast.success(lang === 'kh' ? "បច្ចុប្បន្នភាពស្ថានភាពជោគជ័យ!" : "Status updated!");
            fetchBookings();
        } catch (err) {
            toast.error(lang === 'kh' ? "មានបញ្ហាក្នុងការប្តូរស្ថានភាព!" : "Failed to update status!");
        } finally {
            setActionLoading(null);
        }
    };

    // 🟢 មុខងារលុបការកក់
    const handleDelete = async (id: number) => {
        if (!confirm(lang === 'kh' ? "តើអ្នកពិតជាចង់លុបការកក់នេះមែនទេ?" : "Are you sure you want to delete this booking?")) return;
        setActionLoading(id);
        try {
            await api.delete(`/owner/bookings/${id}`);
            toast.success(lang === 'kh' ? "លុបការកក់ជោគជ័យ!" : "Booking deleted!");
            setBookings(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            toast.error(lang === 'kh' ? "មិនអាចលុបបានទេ!" : "Failed to delete!");
        } finally {
            setActionLoading(null);
        }
    };

    const t = {
        kh: {
            title: 'គ្រប់គ្រងការកក់បន្ទប់ (Bookings)',
            subtitle: 'ពិនិត្យ និងគ្រប់គ្រងរាល់ការកក់បន្ទប់របស់អតិថិជន',
            loading: 'កំពុងទាញយកទិន្នន័យការកក់...',
            thCode: 'កូដកក់ / អតិថិជន',
            thRoom: 'អចលនទ្រព្យ / បន្ទប់',
            thDate: 'កាលបរិច្ឆេទកក់',
            thAmount: 'តម្លៃសរុប',
            thStatus: 'ស្ថានភាព',
            thAction: 'សកម្មភាព',
            noData: 'មិនទាន់មានទិន្នន័យការកក់នៅឡើយទេ',
            searchPlaceholder: 'ស្វែងរកឈ្មោះ អ៊ីមែល ឬលេខទូរស័ព្ទ...',
            allStatus: 'ស្ថានភាពទាំងអស់',
            pending: 'រង់ចាំការបញ្ជាក់',
            confirmed: 'បានបញ្ជាក់',
            cancelled: 'បានបោះបង់',
            completed: 'បានបញ្ចប់'
        },
        en: {
            title: 'Manage Bookings',
            subtitle: 'Review and manage all customer room reservations',
            loading: 'Loading bookings...',
            thCode: 'Booking Code / Customer',
            thRoom: 'Property / Room',
            thDate: 'Reservation Date',
            thAmount: 'Total Amount',
            thStatus: 'Status',
            thAction: 'Actions',
            noData: 'No booking records found',
            searchPlaceholder: 'Search name, phone...',
            allStatus: 'All Status',
            pending: 'Pending',
            confirmed: 'Confirmed',
            cancelled: 'Cancelled',
            completed: 'Completed'
        }
    };

    const getStatusBadge = (status: Booking['status']) => {
        switch (status) {
            case 'confirmed':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/50"><CheckCircle2 size={12} /> {t[lang].confirmed}</span>;
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200/50"><Clock size={12} /> {t[lang].pending}</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200/50"><XCircle size={12} /> {t[lang].cancelled}</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{status}</span>;
        }
    };

    const filteredBookings = bookings.filter((item) => {
        const customerName = item.tenant?.name || '';
        const customerPhone = item.tenant?.phone || '';
        const roomNumber = item.room?.room_number || '';

        const matchesSearch = customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customerPhone.includes(searchQuery) ||
            roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm font-medium">{t[lang].loading}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t[lang].title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t[lang].subtitle}</p>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder={t[lang].searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                >
                    <option value="all">{t[lang].allStatus}</option>
                    <option value="pending">{t[lang].pending}</option>
                    <option value="confirmed">{t[lang].confirmed}</option>
                    <option value="cancelled">{t[lang].cancelled}</option>
                </select>
            </div>

            {/* Bookings Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">{t[lang].thCode}</th>
                                <th className="px-6 py-4">{t[lang].thRoom}</th>
                                <th className="px-6 py-4">{t[lang].thDate}</th>
                                <th className="px-6 py-4">{t[lang].thAmount}</th>
                                <th className="px-6 py-4 text-center">{t[lang].thStatus}</th>
                                <th className="px-6 py-4 text-center">{t[lang].thAction}</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <CalendarCheck size={32} className="text-slate-300" />
                                            <span>{t[lang].noData}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                <User size={14} className="text-indigo-600" /> {item.tenant?.name || 'មិនស្គាល់'}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                <Phone size={12} /> {item.tenant?.phone || 'គ្មានលេខទូរស័ព្ទ'}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                <Building2 size={14} className="text-slate-400" /> {item.room?.property?.title || 'N/A'}
                                            </div>
                                            <div className="text-xs text-indigo-600 font-medium">
                                                បន្ទប់លេខ៖ {item.room?.room_number || 'N/A'}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                            {item.check_in_date}
                                        </td>

                                        <td className="px-6 py-4 font-bold text-emerald-600">
                                            ${Number(item.deposit_amount || 0).toFixed(2)}
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(item.status)}
                                        </td>

                                        {/* 🟢 Action Buttons Column */}
                                        <td className="px-6 py-4 text-center">
                                            {actionLoading === item.id ? (
                                                <Loader2 size={16} className="animate-spin mx-auto text-indigo-600" />
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    {item.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusChange(item.id, 'confirmed')}
                                                                title="បញ្ជាក់ការកក់"
                                                                className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(item.id, 'cancelled')}
                                                                title="បោះបង់ការកក់"
                                                                className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        title="លុប"
                                                        className="p-1.5 bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}