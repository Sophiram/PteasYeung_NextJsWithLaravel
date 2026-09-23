'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
    DoorOpen, CalendarDays, FileText, DollarSign, ArrowRight, 
    Building2, Clock, CheckCircle2, AlertCircle, Compass, User, CreditCard, ExternalLink, Loader2,
    Zap, Droplets, Receipt, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import ReceiptModal, { ReceiptInvoice } from '@/app/components/ReceiptModal';

interface Booking {
    id: number;
    room_id: number;
    check_in_date: string;
    check_out_date: string | null;
    deposit_amount: string | number;
    status: 'pending' | 'approved' | 'active' | 'confirmed' | 'cancelled';
    room?: {
        id: number;
        room_number: string;
        type: string;
        price: number;
        property?: {
            id: number;
            title: string;
            address: string;
            city: string;
        };
    };
}

interface Invoice {
    id: number;
    total_amount: number;
    payment_status: 'paid' | 'unpaid' | 'partial';
    due_date: string;
    created_at: string;
    booking?: {
        room?: {
            room_number: string;
            property?: {
                title: string;
            };
        };
    };
}

export default function TenantDashboardPage() {
    const { user } = useAuth();
    const [lang, setLang] = useState<'kh' | 'en'>('kh');
    const isKh = lang === 'kh';

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [monthlyStay, setMonthlyStay] = useState<any>(null);
    const [stats, setStats] = useState({ total_amount: 0, unpaid_amount: 0, paid_amount: 0 });
    const [loading, setLoading] = useState(true);

    // Receipt Modal
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptInvoice | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);

        const loadTenantData = async () => {
            try {
                const [bookingsRes, invoicesRes, monthlyRes] = await Promise.all([
                    api.get('/my-bookings').catch(() => ({ data: { data: [] } })),
                    api.get('/my-invoices').catch(() => ({ data: { data: [], stats: { total_amount: 0, unpaid_amount: 0, paid_amount: 0 } } })),
                    api.get('/my-monthly-payment').catch(() => ({ data: { has_active_stay: false } }))
                ]);

                setBookings(bookingsRes.data?.data || []);
                setInvoices(invoicesRes.data?.data || []);
                if (invoicesRes.data?.stats) {
                    setStats(invoicesRes.data.stats);
                }
                if (monthlyRes.data) {
                    setMonthlyStay(monthlyRes.data);
                }
            } catch (err) {
                console.error("Error loading tenant dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        loadTenantData();
    }, []);

    // Find active booking
    const activeBooking = bookings.find(b => ['active', 'confirmed', 'approved'].includes(b.status)) || bookings[0];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                <p className="text-sm font-semibold">{isKh ? 'កំពុងផ្ទុកទិន្នន័យ...' : 'Loading dashboard...'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
                <div className="relative z-10 max-w-2xl space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {isKh ? 'គណនីអ្នកជួលសកម្ម' : 'Active Tenant Portal'}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                        {isKh ? `សួស្តី, ${user?.name || 'អ្នកជួល'}!` : `Welcome, ${user?.name || 'Tenant'}!`}
                    </h1>
                    <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
                        {isKh 
                            ? 'គ្រប់គ្រងការស្នាក់នៅ ពិនិត្យមើលវិក្កយបត្រថ្លៃទឹក ភ្លើង និងតាមដានប្រវត្តិការកក់បន្ទប់របស់អ្នកបានយ៉ាងរហ័ស។'
                            : 'Manage your rental stay, review utility & rental invoices, and track your booking history effortlessly.'}
                    </p>

                    <div className="pt-3 flex flex-wrap items-center gap-3">
                        <Link
                            href="/dashboard/tenant/invoices"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-950 font-bold text-xs sm:text-sm hover:bg-indigo-50 transition shadow-sm"
                        >
                            <CreditCard className="w-4 h-4 text-indigo-600" />
                            <span>{isKh ? 'មើលវិក្កយបត្រ' : 'View Invoices'}</span>
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition backdrop-blur-sm border border-white/20"
                        >
                            <Compass className="w-4 h-4" />
                            <span>{isKh ? 'ស្វែងរកបន្ទប់ជួល' : 'Explore Rooms'}</span>
                        </Link>
                    </div>
                </div>

                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
                    <Building2 className="w-80 h-80 text-white" />
                </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Active Booking Status */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKh ? 'បន្ទប់បច្ចុប្បន្ន' : 'Current Room'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <DoorOpen className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 truncate">
                        {activeBooking?.room ? `Room ${activeBooking.room.room_number}` : (isKh ? 'គ្មានបន្ទប់' : 'No Room')}
                    </h2>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate">
                        {activeBooking?.room?.property?.title || (isKh ? 'មិនទាន់មានការជួល' : 'No active stay')}
                    </p>
                </div>

                {/* 2. Total Bookings */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKh ? 'ការកក់សរុប' : 'Total Bookings'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CalendarDays className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                        {bookings.length}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {isKh ? 'ប្រវត្តិស្នើសុំកក់' : 'Total requests'}
                    </p>
                </div>

                {/* 3. Unpaid Due Invoices */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKh ? 'វិក្កយបត្រត្រូវបង់' : 'Unpaid Due'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                        ${Number(stats.unpaid_amount).toFixed(2)}
                    </h2>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        {invoices.filter(i => i.payment_status === 'unpaid').length} {isKh ? 'វិក្កយបត្រមិនទាន់បង់' : 'Pending payment'}
                    </p>
                </div>

                {/* 4. Total Paid */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKh ? 'បានទូទាត់រួច' : 'Total Paid'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                        ${Number(stats.paid_amount).toFixed(2)}
                    </h2>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {invoices.filter(i => i.payment_status === 'paid').length} {isKh ? 'វិក្កយបត្រជោគជ័យ' : 'Paid invoices'}
                    </p>
                </div>
            </div>

            {/* 🌟 Monthly Room Rent & Utilities Status Card */}
            {monthlyStay?.has_active_stay && (
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-xl">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    {isKh ? `ខែនេះ: ${monthlyStay.current_month}` : `This Month: ${monthlyStay.current_month}`}
                                </span>
                                {monthlyStay.is_paid_for_current_month ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>{isKh ? 'បានទូទាត់រួចរាល់' : 'Paid'}</span>
                                    </span>
                                ) : monthlyStay.current_month_invoice ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                                        <span>{isKh ? 'ដល់កាលកំណត់បង់' : 'Payment Due'}</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700/50 text-slate-300 border border-slate-600/30">
                                        <span>{isKh ? 'រង់ចាំម្ចាស់ផ្ទះចេញវិក្កយបត្រ' : 'Awaiting Bill'}</span>
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                {monthlyStay.booking?.room ? `បន្ទប់ #${monthlyStay.booking.room.room_number}` : 'បន្ទប់ជួល'}
                                <span className="text-sm font-normal text-indigo-200 ml-2">
                                    ({monthlyStay.booking?.room?.property?.title || 'អចលនទ្រព្យ'})
                                </span>
                            </h3>

                            {monthlyStay.current_month_invoice ? (
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {isKh 
                                            ? `វិក្កយបត្រខែនេះរួមមានថ្លៃបន្ទប់ $${monthlyStay.booking?.room?.price || 0}`
                                            : `This month's invoice includes base rent $${monthlyStay.booking?.room?.price || 0}`}
                                        {monthlyStay.current_month_invoice.water_unit > 0 && ` + ទឹក ${monthlyStay.current_month_invoice.water_unit} m³`}
                                        {monthlyStay.current_month_invoice.electricity_end_unit > monthlyStay.current_month_invoice.electricity_start_unit && 
                                            ` + ភ្លើង ${monthlyStay.current_month_invoice.electricity_end_unit - monthlyStay.current_month_invoice.electricity_start_unit} kWh`}
                                        {monthlyStay.current_month_invoice.due_date && (
                                            <span className="text-amber-300 ml-1.5 font-semibold">
                                                ({isKh ? 'កាលបរិច្ឆេទ:' : 'Due:'} {monthlyStay.current_month_invoice.due_date})
                                            </span>
                                        )}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-300">
                                    {isKh 
                                        ? `ម្ចាស់ផ្ទះមិនទាន់បានចេញវិក្កយបត្រទឹកភ្លើងសម្រាប់ខែនេះនៅឡើយទេ។ ថ្លៃបន្ទប់គោលគឺ $${monthlyStay.booking?.room?.price || 0}/ខែ។`
                                        : `Owner hasn't generated this month's utility bill yet. Base room rent is $${monthlyStay.booking?.room?.price || 0}/month.`}
                                </p>
                            )}
                        </div>

                        {/* Amount & CTA */}
                        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex-shrink-0 min-w-[200px]">
                            <div>
                                <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block">
                                    {isKh ? 'ទឹកប្រាក់ខែនេះ' : 'Month Amount'}
                                </span>
                                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                                    ${Number(monthlyStay.current_month_invoice?.total_amount ?? monthlyStay.booking?.room?.price ?? 0).toFixed(2)}
                                </div>
                            </div>

                            {monthlyStay.is_paid_for_current_month ? (
                                <button
                                    onClick={() => {
                                        setSelectedReceipt(monthlyStay.current_month_invoice);
                                        setIsReceiptOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                                >
                                    <Receipt className="w-4 h-4" />
                                    <span>{isKh ? 'មើលបង្កាន់ដៃ' : 'View Receipt'}</span>
                                </button>
                            ) : monthlyStay.current_month_invoice ? (
                                <Link
                                    href="/dashboard/tenant/invoices"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition animate-bounce"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    <span>{isKh ? 'ទូទាត់ប្រាក់ឥឡូវនេះ' : 'Pay Rent Now'}</span>
                                </Link>
                            ) : (
                                <span className="text-xs text-slate-400 italic">
                                    {isKh ? 'មិនទាន់ទាមទារការបង់' : 'No payment required yet'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Current Active Room Details Card & Recent Invoices */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Stay Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                            {isKh ? 'ព័ត៌មានបន្ទប់ស្នាក់នៅ' : 'Rental Information'}
                        </h3>
                        {activeBooking && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                {activeBooking.status}
                            </span>
                        )}
                    </div>

                    {activeBooking?.room ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">{isKh ? 'លេខបន្ទប់' : 'Room Number'}</span>
                                    <span className="font-black text-lg text-indigo-600 dark:text-indigo-400">
                                        Room {activeBooking.room.room_number}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">{isKh ? 'ប្រភេទ' : 'Room Type'}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                                        {activeBooking.room.type}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">{isKh ? 'ថ្លៃជួលប្រចាំខែ' : 'Monthly Rent'}</span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        ${activeBooking.room.price}/mo
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                                    <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <span>{activeBooking.room.property?.title}</span>
                                </div>
                                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                                    <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <span>{isKh ? 'ថ្ងៃចូលស្នាក់នៅ' : 'Check-in'}: {activeBooking.check_in_date}</span>
                                </div>
                            </div>

                            <Link
                                href="/dashboard/tenant/bookings"
                                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition"
                            >
                                <span>{isKh ? 'មើលព័ត៌មានលម្អិត' : 'View Full Booking'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    ) : (
                        <div className="text-center py-8 space-y-3">
                            <DoorOpen className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-xs text-slate-500">{isKh ? 'អ្នកមិនទាន់បានកក់បន្ទប់ណាមួយនៅឡើយទេ' : 'You do not have an active rental room yet.'}</p>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                            >
                                {isKh ? 'ស្វែងរកបន្ទប់ជួល' : 'Find a Room'}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Recent Invoices Ledger */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                                {isKh ? 'វិក្កយបត្រថ្មីៗ' : 'Recent Invoices'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {isKh ? 'តាមដានការទូទាត់ថ្លៃបន្ទប់ និងសេវាទឹកភ្លើង' : 'Track rent and utility fees'}
                            </p>
                        </div>

                        <Link
                            href="/dashboard/tenant/invoices"
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                            <span>{isKh ? 'មើលទាំងអស់' : 'View All'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {invoices.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs">
                            {isKh ? 'មិនទាន់មានវិក្កយបត្រនៅឡើយទេ' : 'No invoices generated yet.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead>
                                    <tr className="text-[11px] font-semibold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                                        <th className="pb-3">ID</th>
                                        <th className="pb-3">{isKh ? 'បន្ទប់' : 'Room'}</th>
                                        <th className="pb-3">{isKh ? 'កាលបរិច្ឆេទ' : 'Due Date'}</th>
                                        <th className="pb-3">{isKh ? 'ចំនួនទឹកប្រាក់' : 'Amount'}</th>
                                        <th className="pb-3">{isKh ? 'ស្ថានភាព' : 'Status'}</th>
                                        <th className="pb-3 text-right">{isKh ? 'សកម្មភាព' : 'Action'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {invoices.slice(0, 5).map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                            <td className="py-3 font-mono text-slate-500">#{inv.id}</td>
                                            <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">
                                                Room {inv.booking?.room?.room_number || 'N/A'}
                                            </td>
                                            <td className="py-3 text-slate-500 whitespace-nowrap">{inv.due_date}</td>
                                            <td className="py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                                                ${Number(inv.total_amount).toFixed(2)}
                                            </td>
                                            <td className="py-3">
                                                {inv.payment_status === 'paid' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        {isKh ? 'បានបង់' : 'Paid'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                                        <Clock className="w-3 h-3" />
                                                        {isKh ? 'មិនទាន់បង់' : 'Unpaid'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 text-right">
                                                <Link
                                                    href="/dashboard/tenant/invoices"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                                                >
                                                    {inv.payment_status === 'unpaid' ? (isKh ? 'បង់ប្រាក់' : 'Pay') : (isKh ? 'មើល' : 'View')}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Shared Receipt Modal */}
            {isReceiptOpen && selectedReceipt && (
                <ReceiptModal
                    invoice={selectedReceipt}
                    isOpen={isReceiptOpen}
                    onClose={() => setIsReceiptOpen(false)}
                    lang={lang}
                />
            )}
        </div>
    );
}

