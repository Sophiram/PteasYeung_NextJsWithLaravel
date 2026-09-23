'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
    FileText, Search, RefreshCw, CheckCircle2, Clock, DollarSign,
    User, DoorOpen, ShieldAlert, AlertCircle, Loader2, Check, Printer
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';
import ReceiptModal from '@/app/components/ReceiptModal';

interface Invoice {
    id: number;
    invoice_number: string;
    total_amount: number;
    payment_status: 'paid' | 'unpaid' | 'partial';
    due_date?: string;
    paid_at?: string;
    created_at: string;
    booking?: {
        tenant?: {
            id: number;
            name: string;
            email: string;
            phone?: string;
        };
        room?: {
            id: number;
            room_number: string;
            property?: {
                title: string;
            };
        };
    };
}

export default function StaffInvoicesPage() {
    const { hasPermission } = useAuth();
    const canCollectPayment = hasPermission('invoices.collect_payment');

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
    const [search, setSearch] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [receiptInvoice, setReceiptInvoice] = useState<any | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [collecting, setCollecting] = useState(false);
    const [lang, setLang] = useState<'kh' | 'en'>('kh');

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/staff/invoices');
            const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setInvoices(data);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            toast.error(lang === 'kh' ? 'មិនអាចទាញយកទិន្នន័យវិក្កយបត្របានទេ' : 'Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCollectModal = (invoice: Invoice) => {
        if (!canCollectPayment) {
            toast.error(lang === 'kh' ? 'អ្នកគ្មានសិទ្ធិប្រមូលប្រាក់វិក្កយបត្រឡើយ!' : 'Permission denied for payment collection!');
            return;
        }
        setSelectedInvoice(invoice);
        setIsConfirmOpen(true);
    };

    const handleConfirmCollect = async () => {
        if (!selectedInvoice) return;

        setCollecting(true);
        try {
            await api.post(`/staff/invoices/${selectedInvoice.id}/collect`);
            toast.success(lang === 'kh' ? `បានកត់ត្រាការប្រមូលប្រាក់ $${selectedInvoice.total_amount} ដោយជោគជ័យ!` : `Payment of $${selectedInvoice.total_amount} collected successfully!`);
            setInvoices(prev => prev.map(inv => inv.id === selectedInvoice.id ? { ...inv, payment_status: 'paid', paid_at: new Date().toISOString() } : inv));
            setIsConfirmOpen(false);
            setSelectedInvoice(null);
        } catch (err: any) {
            console.error('Error collecting payment:', err);
            toast.error(err.response?.data?.message || (lang === 'kh' ? 'មិនអាចកត់ត្រាការប្រមូលប្រាក់បានទេ' : 'Failed to record payment collection'));
        } finally {
            setCollecting(false);
        }
    };

    const isKh = lang === 'kh';

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchesStatus = statusFilter === 'all' || inv.payment_status === statusFilter;
            const query = search.toLowerCase();
            const matchesSearch = !query ||
                inv.invoice_number?.toLowerCase().includes(query) ||
                inv.booking?.tenant?.name?.toLowerCase().includes(query) ||
                inv.booking?.room?.room_number?.toLowerCase().includes(query);
            return matchesStatus && matchesSearch;
        });
    }, [invoices, statusFilter, search]);

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-indigo-600" />
                        <span>{isKh ? 'វិក្កយបត្រ & ប្រមូលប្រាក់' : 'Invoices & Cash Collection'}</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {isKh ? 'ត្រួតពិនិត្យវិក្កយបត្រថ្លៃជួល និងកត់ត្រាការទូទាត់ប្រាក់ពីអ្នកជួល' : 'Inspect invoices, confirm tenant payments, and issue collection receipts'}
                    </p>
                </div>

                <button
                    onClick={fetchInvoices}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>{isKh ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
                </button>
            </div>

            {/* Permission Notice */}
            {!canCollectPayment && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
                    <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                    <span>{isKh ? 'ចំណាំ៖ គណនីរបស់អ្នកមានសិទ្ធិត្រឹមតែ "មើល" វិក្កយបត្រប៉ុណ្ណោះ មិនអាចកត់ត្រាការប្រមូលប្រាក់បានឡើយ។' : 'Notice: Your staff account has view-only billing access. Payment collection is restricted.'}</span>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            statusFilter === 'all'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        {isKh ? 'ទាំងអស់' : 'All'}
                    </button>
                    <button
                        onClick={() => setStatusFilter('unpaid')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            statusFilter === 'unpaid'
                                ? 'bg-amber-500 text-white'
                                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        }`}
                    >
                        <Clock size={13} />
                        <span>{isKh ? 'មិនទាន់បង់' : 'Unpaid'}</span>
                    </button>
                    <button
                        onClick={() => setStatusFilter('paid')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            statusFilter === 'paid'
                                ? 'bg-emerald-600 text-white'
                                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                    >
                        <CheckCircle2 size={13} />
                        <span>{isKh ? 'បានបង់រួច' : 'Paid'}</span>
                    </button>
                </div>

                <div className="relative min-w-[220px]">
                    <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={isKh ? 'ស្វែងរកវិក្កយបត្រ, អ្នកជួល...' : 'Search invoice #, tenant...'}
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                </div>
            </div>

            {/* Invoices List / Table */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-xs font-semibold">{isKh ? 'កំពុងផ្ទុកវិក្កយបត្រ...' : 'Loading invoices...'}</p>
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 gap-2">
                    <FileText size={40} className="stroke-[1.5] text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-bold text-slate-500">{isKh ? 'មិនមានវិក្កយបត្រទេ' : 'No invoices found'}</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-extrabold">
                                <tr>
                                    <th className="px-5 py-3.5">{isKh ? 'លេខវិក្កយបត្រ' : 'Invoice #'}</th>
                                    <th className="px-5 py-3.5">{isKh ? 'អ្នកជួល & បន្ទប់' : 'Tenant & Room'}</th>
                                    <th className="px-5 py-3.5">{isKh ? 'ចំនួនទឹកប្រាក់' : 'Amount'}</th>
                                    <th className="px-5 py-3.5">{isKh ? 'ស្ថានភាព' : 'Status'}</th>
                                    <th className="px-5 py-3.5 text-right">{isKh ? 'សកម្មភាព' : 'Action'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                                        <td className="px-5 py-4">
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                {inv.invoice_number || `#INV-${inv.id}`}
                                            </span>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {new Date(inv.created_at).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-slate-900 dark:text-white">
                                                    {inv.booking?.tenant?.name || 'Guest'}
                                                </p>
                                                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                                    <DoorOpen size={12} className="text-indigo-500" />
                                                    <span>បន្ទប់ #{inv.booking?.room?.room_number || '-'} ({inv.booking?.room?.property?.title || '-'})</span>
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                ${Number(inv.total_amount).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {inv.payment_status === 'paid' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase border border-emerald-300 dark:border-emerald-800">
                                                    <CheckCircle2 size={11} />
                                                    <span>{isKh ? 'បានបង់' : 'Paid'}</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase border border-amber-300 dark:border-amber-800">
                                                    <Clock size={11} />
                                                    <span>{isKh ? 'មិនទាន់បង់' : 'Unpaid'}</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => {
                                                        setReceiptInvoice(inv);
                                                        setIsReceiptOpen(true);
                                                    }}
                                                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                                                    title={isKh ? 'មើលវិក្កយបត្រ / បង្កាន់ដៃ' : 'View Receipt / Invoice'}
                                                >
                                                    <Printer size={13} />
                                                </button>
                                                {inv.payment_status === 'unpaid' ? (
                                                    <button
                                                        onClick={() => handleOpenCollectModal(inv)}
                                                        disabled={!canCollectPayment}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 disabled:opacity-40 transition"
                                                        title={isKh ? 'កត់ត្រាការប្រមូលប្រាក់' : 'Collect Payment'}
                                                    >
                                                        <DollarSign size={13} />
                                                        <span>{isKh ? 'ប្រមូលប្រាក់' : 'Collect'}</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px] font-medium flex items-center justify-end gap-1 px-1">
                                                        <Check size={13} className="text-emerald-500" />
                                                        <span>{isKh ? 'រួចរាល់' : 'Settled'}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Receipt / Invoice Modal */}
            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => {
                    setIsReceiptOpen(false);
                    setReceiptInvoice(null);
                }}
                invoice={receiptInvoice}
                lang={lang}
            />

            {/* Confirm Payment Collection Modal */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                title={isKh ? "បញ្ជាក់ការប្រមូលប្រាក់ពីអ្នកជួល" : "Confirm Payment Collection"}
                message={isKh 
                    ? `តើអ្នកពិតជាបានទទួលប្រាក់ចំនួន $${selectedInvoice?.total_amount} សម្រាប់វិក្កយបត្រ ${selectedInvoice?.invoice_number} ពី ${selectedInvoice?.booking?.tenant?.name || 'អ្នកជួល'} រួចរាល់ហើយមែនទេ? ប្រព័ន្ធនឹងកត់ត្រាចូល Audit Log ដោយស្វ័យប្រវត្ត។`
                    : `Confirm receipt of $${selectedInvoice?.total_amount} for invoice ${selectedInvoice?.invoice_number} from ${selectedInvoice?.booking?.tenant?.name}? This action will be logged in system audit trail.`
                }
                type="success"
                confirmText={isKh ? "យល់ព្រម បានទទួលប្រាក់" : "Confirm & Mark Paid"}
                cancelText={isKh ? "បោះបង់" : "Cancel"}
                onConfirm={handleConfirmCollect}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setSelectedInvoice(null);
                }}
            />
        </div>
    );
}
