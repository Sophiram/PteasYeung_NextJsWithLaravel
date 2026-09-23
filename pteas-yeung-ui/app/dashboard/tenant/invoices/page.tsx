'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    FileText, CreditCard, CheckCircle2, Clock, DollarSign, 
    Zap, Droplets, Building2, Calendar, RefreshCw, X, Check, Loader2, Download, Printer,
    Copy, ExternalLink, Phone, Send, Sparkles, ShieldCheck, AlertCircle, QrCode
} from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';
import ReceiptModal from '@/app/components/ReceiptModal';

interface OwnerPaymentInfo {
    id?: number;
    name?: string;
    phone?: string | null;
    email?: string | null;
    bank_name?: string | null;
    bank_account_name?: string | null;
    bank_account_number?: string | null;
    bank_qr_code?: string | null;
    payment_instructions?: string | null;
}

interface Invoice {
    id: number;
    invoice_number?: string;
    booking_id: number;
    electricity_start_unit: number;
    electricity_end_unit: number;
    water_unit: number;
    total_amount: number | string;
    payment_status: 'paid' | 'unpaid' | 'partial';
    due_date: string;
    created_at: string;
    booking?: {
        id: number;
        status?: string;
        deposit_amount?: number | string;
        check_in_date?: string;
        check_out_date?: string | null;
        room?: {
            id?: number;
            room_number: string;
            type: string;
            price: number | string;
            property?: {
                id?: number;
                title: string;
                address: string;
                city?: string;
                owner?: OwnerPaymentInfo;
            };
        };
        owner?: OwnerPaymentInfo;
        tenant?: {
            id?: number;
            name?: string;
            phone?: string | null;
            email?: string | null;
        };
    };
}

export default function TenantInvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
    const [lang, setLang] = useState<'kh' | 'en'>('kh');
    const isKh = lang === 'kh';

    // System Settings for fallback payment info & exchange rate
    const [systemSettings, setSystemSettings] = useState<any>(null);

    // Pay Modal States
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [paymentNote, setPaymentNote] = useState('');
    const [copied, setCopied] = useState(false);
    const [qrZoomOpen, setQrZoomOpen] = useState(false);

    // Receipt Modal
    const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/my-invoices', {
                params: {
                    payment_status: statusFilter === 'all' ? undefined : statusFilter,
                }
            });
            setInvoices(res.data?.data || []);
        } catch (err) {
            console.error("Error fetching tenant invoices:", err);
            toast.error(isKh ? "មិនអាចទាញយកទិន្នន័យវិក្កយបត្របានទេ!" : "Failed to load invoices.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);
        fetchInvoices();

        // Load system settings for exchange rate & fallback banking details
        api.get('/settings')
            .then((res) => {
                if (res.data) setSystemSettings(res.data);
            })
            .catch(() => {});
    }, [statusFilter]);

    // Summary calculations
    const summary = useMemo(() => {
        const unpaid = invoices.filter(i => i.payment_status === 'unpaid').reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
        const paid = invoices.filter(i => i.payment_status === 'paid').reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
        return {
            unpaid,
            paid,
            total: invoices.length,
        };
    }, [invoices]);

    // Open Pay Modal
    const handleOpenPay = (inv: Invoice) => {
        setSelectedInvoice(inv);
        setPaymentNote('');
        setCopied(false);
        setIsPayModalOpen(true);
    };

    // Copy Account Number
    const handleCopyAccount = (accNum: string) => {
        if (!accNum) return;
        navigator.clipboard.writeText(accNum);
        setCopied(true);
        toast.success(isKh ? 'បានចម្លងលេខគណនីធនាគារ!' : 'Bank account number copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    // Confirm Payment
    const handleConfirmPayment = async () => {
        if (!selectedInvoice) return;
        setIsPaying(true);
        try {
            await api.post(`/my-invoices/${selectedInvoice.id}/pay`, {
                payment_note: paymentNote.trim() || undefined,
            });
            toast.success(isKh ? `បានទូទាត់វិក្កយបត្រ #${selectedInvoice.id} ជោគជ័យ! បន្ទប់ត្រូវបានបញ្ជាក់។` : `Invoice #${selectedInvoice.id} paid successfully! Room booking confirmed.`);
            setIsPayModalOpen(false);
            setSelectedInvoice(null);
            setPaymentNote('');
            await fetchInvoices();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || (isKh ? "បរាជ័យក្នុងការទូទាត់!" : "Payment failed."));
        } finally {
            setIsPaying(false);
        }
    };

    // Open Receipt
    const handleOpenReceipt = (inv: Invoice) => {
        setReceiptInvoice(inv);
        setIsReceiptModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        {isKh ? 'វិក្កយបត្ររបស់ខ្ញុំ' : 'My Invoices'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {isKh ? 'ពិនិត្យមើល និងទូទាត់ថ្លៃជួលបន្ទប់ សេវាទឹក និងអគ្គិសនី' : 'Review and pay room rent, water, and electricity invoices'}
                    </p>
                </div>

                <button
                    onClick={fetchInvoices}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isKh ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
                </button>
            </div>

            {/* Financial Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKh ? 'ទឹកប្រាក់ត្រូវបង់' : 'Total Due'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                        ${summary.unpaid.toFixed(2)}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {invoices.filter(i => i.payment_status === 'unpaid').length} {isKh ? 'វិក្កយបត្រមិនទាន់បង់' : 'Unpaid invoices'}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKh ? 'បានទូទាត់រួច' : 'Total Paid'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        ${summary.paid.toFixed(2)}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {invoices.filter(i => i.payment_status === 'paid').length} {isKh ? 'វិក្កយបត្រជោគជ័យ' : 'Paid invoices'}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKh ? 'វិក្កយបត្រសរុប' : 'Total Invoices'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                        {summary.total}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {isKh ? 'រាល់វិក្កយបត្រដែលបានបង្កើត' : 'Lifetime generated'}
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${statusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                >
                    {isKh ? 'ទាំងអស់' : 'All'}
                </button>
                <button
                    onClick={() => setStatusFilter('unpaid')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${statusFilter === 'unpaid' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                >
                    {isKh ? 'មិនទាន់បង់' : 'Unpaid'}
                </button>
                <button
                    onClick={() => setStatusFilter('paid')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${statusFilter === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                >
                    {isKh ? 'បានបង់រួច' : 'Paid'}
                </button>
            </div>

            {/* Invoices List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                    <p className="text-xs font-semibold">{isKh ? 'កំពុងទាញទិន្នន័យ...' : 'Loading invoices...'}</p>
                </div>
            ) : invoices.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
                        {isKh ? 'មិនមានវិក្កយបត្រឡើយ' : 'No invoices found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {isKh ? 'វិក្កយបត្រថ្លៃបន្ទប់ និងសេវានឹងបង្ហាញនៅទីនេះ។' : 'Your rental and utility bills will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {invoices.map((inv) => {
                        const isPaid = inv.payment_status === 'paid';
                        const roomNum = inv.booking?.room?.room_number || 'N/A';
                        const propertyTitle = inv.booking?.room?.property?.title || 'General Property';
                        const electricityKwh = Math.max(0, (inv.electricity_end_unit || 0) - (inv.electricity_start_unit || 0));

                        return (
                            <div key={inv.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5">
                                <div className="space-y-4">
                                    {/* Top badge & ID */}
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-xs text-slate-400">#{inv.id}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                                            isPaid 
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' 
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 animate-pulse'
                                        }`}>
                                            {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                            <span>{isPaid ? (isKh ? 'បានបង់' : 'Paid') : (isKh ? 'មិនទាន់បង់' : 'Unpaid')}</span>
                                        </span>
                                    </div>

                                    {/* Room and Property */}
                                    <div>
                                        <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
                                            Room {roomNum}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                            <Building2 className="w-3.5 h-3.5" />
                                            <span>{propertyTitle}</span>
                                        </p>
                                    </div>

                                    {/* Utility Usage Breakdown */}
                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-slate-400 text-[10px]">{isKh ? 'អគ្គិសនី' : 'Electricity'}</p>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{electricityKwh} kWh</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Droplets className="w-4 h-4 text-sky-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-slate-400 text-[10px]">{isKh ? 'ទឹក' : 'Water'}</p>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{inv.water_unit || 0} m³</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Amount & Due Date */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div>
                                            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                                                {isKh ? 'កាលបរិច្ឆេទកំណត់' : 'Due Date'}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                {inv.due_date}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                                                {isKh ? 'ទឹកប្រាក់សរុប' : 'Total Amount'}
                                            </span>
                                            <span className="font-mono font-black text-xl text-slate-900 dark:text-slate-100">
                                                ${Number(inv.total_amount).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => handleOpenReceipt(inv)}
                                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center justify-center cursor-pointer"
                                        title={isKh ? 'បោះពុម្ព / រក្សាទុកជា PDF' : 'Print / Save PDF'}
                                    >
                                        <Printer className="w-3.5 h-3.5 text-sky-600" />
                                    </button>

                                    <button
                                        onClick={() => handleOpenReceipt(inv)}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{isKh ? 'មើលបង្កាន់ដៃ' : 'View Slip'}</span>
                                    </button>

                                    {!isPaid ? (
                                        <button
                                            onClick={() => handleOpenPay(inv)}
                                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <CreditCard className="w-3.5 h-3.5" />
                                            <span>{isKh ? 'បង់ប្រាក់ឥឡូវនេះ' : 'Pay Now'}</span>
                                        </button>
                                    ) : (
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-1 py-2.5">
                                            {isKh ? 'បានទូទាត់រួចរាល់' : 'Paid in full'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 💳 Pay Now Modal Connected to Owner Payment Method */}
            {isPayModalOpen && selectedInvoice && (() => {
                const booking = selectedInvoice.booking;
                const room = booking?.room;
                const property = room?.property;
                const owner = property?.owner || booking?.owner;
                const isBookingPayment = booking?.status === 'pending' || Number(booking?.deposit_amount || 0) > 0;

                const bankName = owner?.bank_name || systemSettings?.admin_bank_name || 'ABA Bank';
                const accountName = owner?.bank_account_name || owner?.name || systemSettings?.admin_bank_account_name || 'Property Landlord';
                const accountNumber = owner?.bank_account_number || systemSettings?.admin_bank_account_number || '';
                const bankQrRaw = owner?.bank_qr_code || systemSettings?.admin_bank_qr_url;
                const bankQrUrl = bankQrRaw ? getOptimizedImageUrl(bankQrRaw) : null;
                const instructions = owner?.payment_instructions || systemSettings?.admin_payment_notes_kh;
                const ownerPhone = owner?.phone;
                const cleanPhone = ownerPhone ? ownerPhone.replace(/[^0-9]/g, '') : '';
                const telegramPhone = cleanPhone.startsWith('0') ? '855' + cleanPhone.slice(1) : cleanPhone;
                const telegramUrl = cleanPhone ? (cleanPhone.startsWith('@') ? `https://t.me/${cleanPhone.replace('@', '')}` : `tg://resolve?phone=${telegramPhone}`) : null;

                const exchangeRate = Number(systemSettings?.receipt_khr_exchange_rate || 4100);
                const totalAmount = Number(selectedInvoice.total_amount || 0);
                const totalKHR = Math.round(totalAmount * exchangeRate);

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
                            {/* Header Gradient */}
                            <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500" />
                            
                            {/* Top Bar */}
                            <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                                            {isKh ? 'ទូទាត់វិក្កយបត្រ' : 'Pay Invoice'} #{selectedInvoice.invoice_number || selectedInvoice.id}
                                        </h3>
                                        <p className="text-[11px] text-slate-400">
                                            {isKh ? 'ភ្ជាប់ដោយផ្ទាល់ជាមួយគណនីម្ចាស់ផ្ទះ' : 'Direct settlement with property owner'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsPayModalOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                                {/* Booking Alert Banner */}
                                {isBookingPayment && (
                                    <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-3">
                                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-black text-indigo-950 dark:text-indigo-200 text-xs">
                                                {isKh ? 'ការទូទាត់សម្រាប់កក់បន្ទប់ (Room Booking Payment)' : 'Room Booking & Deposit Payment'}
                                            </p>
                                            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5 leading-relaxed">
                                                {isKh 
                                                    ? 'បន្ទាប់ពីការទូទាត់ជោគជ័យ ការកក់បន្ទប់របស់អ្នកនឹងត្រូវបានបញ្ជាក់ជាស្ថាពរភ្លាមៗ។'
                                                    : 'Your room booking will be officially confirmed upon successful payment.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Room & Invoice Summary Card */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                                            <Building2 size={13} className="text-indigo-600" />
                                            <span>{property?.title || 'អចលនទ្រព្យផ្ទះយើង'}</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black font-mono text-[11px]">
                                            បន្ទប់ #{room?.room_number || '-'}
                                        </span>
                                    </div>

                                    {booking?.check_in_date && (
                                        <div className="flex justify-between text-slate-500 text-[11px]">
                                            <span>{isKh ? 'កាលបរិច្ឆេទចូលស្នាក់នៅ' : 'Check-in Date'}:</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{booking.check_in_date}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-slate-500 text-[11px]">
                                        <span>{isKh ? 'កាលបរិច្ឆេទកំណត់បង់' : 'Due Date'}:</span>
                                        <span className="font-semibold text-rose-600">{selectedInvoice.due_date}</span>
                                    </div>

                                    {/* Total Payable Block */}
                                    <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                        <div>
                                            <span className="text-slate-500 font-bold block text-[11px]">
                                                {isKh ? 'ទឹកប្រាក់ត្រូវទូទាត់' : 'Total Payable'}
                                            </span>
                                            <span className="text-[10px] text-sky-600 font-semibold font-mono">
                                                ៛{totalKHR.toLocaleString()} KHR
                                            </span>
                                        </div>
                                        <span className="font-mono font-black text-2xl sm:text-3xl text-indigo-600 dark:text-indigo-400">
                                            ${totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* 🏦 OWNER PAYMENT METHOD SECTION */}
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/50 dark:from-slate-900 dark:to-slate-950 border-2 border-sky-200/80 dark:border-sky-900/60 shadow-xs space-y-3.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                                            <ShieldCheck size={14} className="text-sky-600" />
                                            <span>{isKh ? 'ព័ត៌មានគណនីរបស់ម្ចាស់ផ្ទះ (Owner Account)' : 'Owner Payment Method'}</span>
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-black text-[10px]">
                                            {bankName}
                                        </span>
                                    </div>

                                    {/* Bank Details & QR Grid */}
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        {/* KHQR Code Preview */}
                                        {bankQrUrl ? (
                                            <div className="shrink-0 flex flex-col items-center">
                                                <div 
                                                    onClick={() => setQrZoomOpen(true)}
                                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1.5 border-2 border-sky-300 dark:border-sky-700 shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 transition-transform group relative"
                                                    title={isKh ? 'ចុចដើម្បីពង្រីក QR' : 'Click to enlarge QR'}
                                                >
                                                    <img 
                                                        src={bankQrUrl} 
                                                        alt="Owner KHQR Code"
                                                        className="w-full h-full object-contain"
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                                        🔍 ពង្រីក
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 mt-1 uppercase tracking-wider">
                                                    KHQR Scan
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 p-2 text-center shrink-0">
                                                <QrCode size={24} className="mb-1 text-slate-400" />
                                                <span className="text-[9px]">{isKh ? 'គ្មាន QR' : 'No QR Code'}</span>
                                            </div>
                                        )}

                                        {/* Bank Account Info */}
                                        <div className="flex-1 min-w-0 w-full space-y-2">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                                    {isKh ? 'ឈ្មោះម្ចាស់គណនី' : 'Account Holder'}
                                                </span>
                                                <p className="font-black text-slate-900 dark:text-white text-sm truncate">
                                                    {accountName}
                                                </p>
                                            </div>

                                            {accountNumber ? (
                                                <div>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                                        {isKh ? 'លេខគណនី' : 'Account Number'}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="font-mono font-black text-base text-sky-700 dark:text-sky-300 tracking-wider">
                                                            {accountNumber}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyAccount(accountNumber)}
                                                            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
                                                                copied 
                                                                    ? 'bg-emerald-600 text-white border-emerald-600' 
                                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                                            }`}
                                                            title="Copy account number"
                                                        >
                                                            {copied ? <Check size={12} /> : <Copy size={12} />}
                                                            <span>{copied ? (isKh ? 'បានចម្លង' : 'Copied') : (isKh ? 'ចម្លង' : 'Copy')}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-amber-600 text-[11px] font-medium">
                                                    {isKh ? 'ម្ចាស់ផ្ទះមិនទាន់បានបញ្ចូលលេខគណនី' : 'Owner has not configured account number'}
                                                </p>
                                            )}

                                            {/* Owner Direct Contact */}
                                            {ownerPhone && (
                                                <div className="pt-1 flex items-center gap-2">
                                                    <a
                                                        href={`tel:${ownerPhone}`}
                                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
                                                    >
                                                        <Phone size={12} className="text-emerald-500" />
                                                        <span>{ownerPhone}</span>
                                                    </a>
                                                    {telegramUrl && (
                                                        <a
                                                            href={telegramUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 hover:underline"
                                                        >
                                                            <Send size={11} />
                                                            <span>Telegram</span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Owner Payment Remarks */}
                                    {instructions && (
                                        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 mr-1">💡 {isKh ? 'សេចក្តីណែនាំ:' : 'Instructions:'}</span>
                                            <span>{instructions}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tenant Remark / Transaction Reference */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        {isKh ? 'លេខប្រតិបត្តិការ ឬចំណាំផ្ទេរប្រាក់ (ស្រេចចិត្ត)' : 'Transaction Ref / Remark (Optional)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentNote}
                                        onChange={(e) => setPaymentNote(e.target.value)}
                                        placeholder={isKh ? 'ឧ. លេខប្រតិបត្តិការ ABA ឬ បង់ប្រាក់រួចរាល់' : 'e.g. ABA-TXN-123456 or settled via transfer'}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900">
                                <button
                                    type="button"
                                    onClick={() => setIsPayModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                    {isKh ? 'បោះបង់' : 'Cancel'}
                                </button>
                                <button
                                    type="button"
                                    disabled={isPaying}
                                    onClick={handleConfirmPayment}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    <span>{isPaying ? (isKh ? 'កំពុងដំណើរការ...' : 'Processing...') : (isKh ? 'បញ្ជាក់ការទូទាត់' : 'Confirm Payment')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Lightbox QR Zoom */}
                        {qrZoomOpen && bankQrUrl && (
                            <div 
                                onClick={() => setQrZoomOpen(false)}
                                className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
                            >
                                <div className="bg-white p-4 rounded-3xl max-w-sm w-full text-center space-y-3" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-between items-center pb-2 border-b">
                                        <span className="text-xs font-bold text-slate-700 uppercase">
                                            {bankName} - {accountName}
                                        </span>
                                        <button onClick={() => setQrZoomOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <img src={bankQrUrl} alt="Enlarged KHQR" className="w-full h-auto object-contain rounded-xl max-h-[65vh] mx-auto" />
                                    {accountNumber && (
                                        <p className="font-mono font-black text-sm text-slate-900">
                                            {accountNumber}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* 📄 Printable Receipt Modal (Isolated Print / Save PDF) */}
            <ReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => {
                    setIsReceiptModalOpen(false);
                    setReceiptInvoice(null);
                }}
                invoice={receiptInvoice}
                lang={lang}
            />
        </div>
    );
}
