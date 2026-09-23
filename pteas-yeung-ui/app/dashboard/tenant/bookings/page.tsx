'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Calendar, DoorClosed, DollarSign, Clock, Building2, FileText, ArrowRight, Compass } from 'lucide-react';

interface Booking {
    id: number;
    room_id: number;
    check_in_date: string;
    check_out_date: string | null;
    deposit_amount: string;
    status: 'pending' | 'approved' | 'active' | 'confirmed' | 'cancelled';
    room?: {
        id?: number;
        room_number: string;
        type: string;
        price?: number;
        property?: {
            title?: string;
            address?: string;
        };
    };
}

export default function TenantBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState<'kh' | 'en'>('kh');
    const isKh = lang === 'kh';

    const t = {
        kh: {
            loading: 'កំពុងទាញទិន្នន័យការកក់...',
            title: 'ប្រវត្តិការកក់បន្ទប់របស់ខ្ញុំ',
            total: 'ទិន្នន័យសរុប៖',
            noDataTitle: 'មិនទាន់មានទិន្នន័យការកក់បន្ទប់នៅឡើយទេ',
            noDataDesc: 'រាល់ទិន្នន័យដែលអ្នកបានស្នើសុំកក់បន្ទប់នឹងបង្ហាញនៅទីនេះ។',
            roomNum: 'បន្ទប់លេខ',
            checkIn: 'ថ្ងៃចូលស្នាក់នៅ',
            checkOut: 'ថ្ងៃចាកចេញ',
            deposit: 'ប្រាក់កក់',
            findRoom: 'ស្វែងរកបន្ទប់ជួល',
            viewInvoices: 'មើលវិក្កយបត្រ',
            monthlyRent: 'ថ្លៃជួលប្រចាំខែ',
        },
        en: {
            loading: 'Fetching booking data...',
            title: 'My Booking History',
            total: 'Total:',
            noDataTitle: 'No bookings found',
            noDataDesc: 'All your rental requests will appear here.',
            roomNum: 'Room',
            checkIn: 'Check-in',
            checkOut: 'Check-out',
            deposit: 'Deposit',
            findRoom: 'Explore Rooms',
            viewInvoices: 'View Invoices',
            monthlyRent: 'Monthly Rent',
        }
    };

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);

        const fetchBookings = async () => {
            try {
                const res = await api.get('/my-bookings').catch(() => api.get('/bookings'));
                setBookings(res.data?.data || []);
            } catch (err) {
                console.error("Error fetching bookings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-500 font-bold text-sm animate-pulse">
                {t[lang].loading}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{t[lang].title}</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {isKh ? 'ពិនិត្យមើលបន្ទប់ដែលអ្នកបានកក់ និងស្ថានភាពអនុម័ត' : 'Review your booked rooms and approval status'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-black px-3.5 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900">
                        {t[lang].total} {bookings.length}
                    </span>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
                    >
                        <Compass className="w-3.5 h-3.5" />
                        <span>{t[lang].findRoom}</span>
                    </Link>
                </div>
            </div>

            {bookings.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs space-y-3">
                    <DoorClosed className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-bold text-lg text-slate-800 dark:text-slate-200">{t[lang].noDataTitle}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto font-medium">{t[lang].noDataDesc}</p>
                    <div className="pt-2">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
                        >
                            <Compass className="w-4 h-4" />
                            <span>{t[lang].findRoom}</span>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {bookings.map((booking) => {
                        const isPending = booking.status === 'pending';
                        const isApproved = ['approved', 'active', 'confirmed'].includes(booking.status);

                        return (
                            <div key={booking.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-mono font-bold text-slate-400">#{booking.id}</span>
                                        <span className={`px-3 py-1 text-[11px] font-black rounded-full uppercase tracking-wider ${
                                            isPending
                                                ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900'
                                                : isApproved
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                            <DoorClosed className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-slate-900 dark:text-white text-lg truncate">
                                                {t[lang].roomNum} {booking.room?.room_number || booking.room_id}
                                            </h3>
                                            {booking.room?.property?.title && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                                                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate">{booking.room.property.title}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-xs">
                                        <div>
                                            <span className="text-slate-400 font-bold block mb-0.5">{t[lang].checkIn}</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{booking.check_in_date}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 font-bold block mb-0.5">{t[lang].deposit}</span>
                                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                                                ${parseFloat(booking.deposit_amount || '0').toFixed(2)}
                                            </span>
                                        </div>
                                        {booking.room?.price && (
                                            <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                                                <span className="text-slate-400 font-bold">{t[lang].monthlyRent}</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                                                    ${booking.room.price}/mo
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                                    <Link
                                        href="/dashboard/tenant/invoices"
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>{t[lang].viewInvoices}</span>
                                        <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}