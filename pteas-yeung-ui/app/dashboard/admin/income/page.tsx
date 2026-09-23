'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    TrendingUp, DollarSign, Clock, CheckCircle2, AlertCircle, 
    Search, Filter, Calendar, Building2, User, ArrowUpRight, 
    FileText, Download, Check
} from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import ConfirmModal from '@/app/components/ConfirmModal';
import toast, { Toaster } from 'react-hot-toast';

interface IncomeSummary {
    total_income: number;
    pending_income: number;
    this_month_income: number;
    growth_rate: number;
    paid_count: number;
    unpaid_count: number;
}

interface MonthlyTrend {
    month: string;
    label: string;
    amount: number;
}

interface OwnerBreakdown {
    id: number;
    name: string;
    email: string;
    phone?: string;
    properties_count: number;
    total_collected: number;
    invoice_count: number;
}

interface OwnerInvoiceRecord {
    id: number;
    invoice_number: string;
    title: string;
    amount: number | string;
    payment_status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    payment_method?: string;
    due_date?: string;
    paid_at?: string;
    created_at: string;
    owner?: {
        id: number;
        name: string;
        email: string;
        phone?: string;
    };
    property?: {
        id: number;
        title: string;
    };
}

export default function AdminIncomePage() {
    const { language } = useLanguage();
    const isKh = language === 'kh';

    const [summary, setSummary] = useState<IncomeSummary>({
        total_income: 0,
        pending_income: 0,
        this_month_income: 0,
        growth_rate: 0,
        paid_count: 0,
        unpaid_count: 0,
    });
    const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
    const [ownerBreakdown, setOwnerBreakdown] = useState<OwnerBreakdown[]>([]);
    const [invoices, setInvoices] = useState<OwnerInvoiceRecord[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal for collecting payment
    const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<OwnerInvoiceRecord | null>(null);
    const [isCollecting, setIsCollecting] = useState(false);

    const fetchIncomeData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/admin/income', {
                params: {
                    status: statusFilter,
                    search: searchTerm || undefined,
                }
            });
            if (res.data?.success) {
                setSummary(res.data.summary);
                setMonthlyTrend(res.data.monthly_trend || []);
                setOwnerBreakdown(res.data.property_breakdown || []);
                setInvoices(res.data.invoices || []);
            }
        } catch (err) {
            console.error("Error loading income data:", err);
            setError(isKh ? "មិនអាចទាញយកទិន្នន័យចំណូលបានទេ!" : "Failed to load income analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncomeData();
    }, [statusFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchIncomeData();
    };

    const handleTriggerCollect = (invoice: OwnerInvoiceRecord) => {
        setSelectedInvoice(invoice);
        setIsCollectModalOpen(true);
    };

    const handleConfirmCollect = async () => {
        if (!selectedInvoice) return;
        setIsCollecting(true);
        try {
            await api.post(`/admin/income/collect/${selectedInvoice.id}`);
            toast.success(isKh ? `បានកត់ត្រាការទូទាត់វិក្កយបត្រ #${selectedInvoice.invoice_number || selectedInvoice.id} ជោគជ័យ!` : `Payment for invoice #${selectedInvoice.invoice_number || selectedInvoice.id} marked as collected!`);
            await fetchIncomeData();
        } catch (err) {
            console.error(err);
            toast.error(isKh ? "បរាជ័យក្នុងការកត់ត្រាការទូទាត់!" : "Failed to record payment.");
        } finally {
            setIsCollecting(false);
            setIsCollectModalOpen(false);
            setSelectedInvoice(null);
        }
    };

    // Find max monthly trend for proportional bar heights
    const maxMonthAmount = useMemo(() => {
        if (!monthlyTrend.length) return 1;
        const max = Math.max(...monthlyTrend.map(m => m.amount));
        return max > 0 ? max : 1;
    }, [monthlyTrend]);

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            <Toaster position="top-right" reverseOrder={false} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {isKh ? 'គ្រប់គ្រងចំណូលប្រព័ន្ធ' : 'Platform Revenue & Income'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isKh ? 'តាមដានចំណូលសរុប ការប្រមូលថ្លៃបន្ទប់ និងស្ថិតិហិរញ្ញវត្ថុ' : 'Track total platform revenue, room fee collections, and financial growth'}
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => fetchIncomeData()}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
                    >
                        <TrendingUp className="w-4 h-4" />
                        <span>{isKh ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Update Data'}</span>
                    </button>
                </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Paid Revenue */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isKh ? 'ចំណូលប្រមូលបានសរុប' : 'Total Revenue Collected'}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                            ${Number(summary.total_income).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {summary.paid_count} {isKh ? 'វិក្កយបត្របានបង់រួច' : 'Invoices Paid'}
                        </p>
                    </div>
                </div>

                {/* 2. This Month Revenue */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isKh ? 'ចំណូលក្នុងខែនេះ' : 'This Month Revenue'}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                            ${Number(summary.this_month_income).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                        <div className="flex items-center gap-1 mt-1 text-xs">
                            <span className={`font-semibold ${summary.growth_rate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {summary.growth_rate >= 0 ? `+${summary.growth_rate}%` : `${summary.growth_rate}%`}
                            </span>
                            <span className="text-slate-400">{isKh ? 'ធៀបនឹងខែមុន' : 'vs last month'}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Pending / Unpaid Income */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isKh ? 'ចំណូលមិនទាន់ប្រមូល' : 'Pending Collections'}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                            ${Number(summary.pending_income).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">
                            {summary.unpaid_count} {isKh ? 'វិក្កយបត្រមិនទាន់បង់' : 'Invoices Pending'}
                        </p>
                    </div>
                </div>

                {/* 4. Total Invoices Managed */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isKh ? 'វិក្កយបត្រសរុប' : 'Total Invoices'}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                            {summary.paid_count + summary.unpaid_count}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {isKh ? 'អត្រាប្រមូលជោគជ័យ' : 'Collection rate'}: {summary.paid_count + summary.unpaid_count > 0 ? Math.round((summary.paid_count / (summary.paid_count + summary.unpaid_count)) * 100) : 0}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Visual Trend & Property Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Trend Visual */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                                {isKh ? 'និន្នាការចំណូលប្រចាំខែ (៦ ខែចុងក្រោយ)' : 'Monthly Revenue Trend (Last 6 Months)'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {isKh ? 'ប្រាក់ចំណូលដែលបានប្រមូលពីវិក្កយបត្រទាំងអស់' : 'Aggregated paid invoice revenue'}
                            </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            USD ($)
                        </span>
                    </div>

                    <div className="pt-4 grid grid-cols-6 gap-2 sm:gap-4 items-end h-52">
                        {monthlyTrend.map((m) => {
                            const heightPercent = maxMonthAmount > 0 ? Math.max(12, Math.round((m.amount / maxMonthAmount) * 100)) : 12;
                            return (
                                <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end group">
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                        ${Math.round(m.amount)}
                                    </span>
                                    <div
                                        style={{ height: `${heightPercent}%` }}
                                        className="w-full max-w-[42px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-lg transition-all duration-300 group-hover:from-rose-500 group-hover:to-rose-300 relative shadow-sm"
                                    />
                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-full">
                                        {m.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Landlord / Owner Income Breakdown */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                            {isKh ? 'ចំណូលតាមម្ចាស់ផ្ទះ' : 'Revenue by Landlord'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isKh ? 'ម្ចាស់ផ្ទះដែលបង់ថ្លៃសេវាប្រព័ន្ធច្រើនជាងគេ' : 'Top contributing property owners'}
                        </p>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-56">
                        {ownerBreakdown.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-6">
                                {isKh ? 'មិនទាន់មានទិន្នន័យម្ចាស់ផ្ទះនៅឡើយទេ' : 'No owner revenue records.'}
                            </p>
                        ) : (
                            ownerBreakdown.map((owner) => (
                                <div key={owner.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                                            <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                                                {owner.name}
                                            </h4>
                                        </div>
                                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                            {owner.properties_count} {isKh ? 'អចលនទ្រព្យ' : 'properties'} • {owner.invoice_count} {isKh ? 'វិក្កយបត្រ' : 'invoices'}
                                        </p>
                                    </div>
                                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                        ${Number(owner.total_collected).toFixed(2)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Invoices & Collections Ledger */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                            {isKh ? 'កំណត់ត្រាការទូទាត់ប្រាក់ពីម្ចាស់ផ្ទះ' : 'Platform Revenue Collections Ledger'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isKh ? 'ពិនិត្យមើល និងកត់ត្រាការទូទាត់ថ្លៃសេវាពីម្ចាស់ផ្ទះ' : 'Review and collect platform subscription fees from landlords'}
                        </p>
                    </div>

                    {/* Filter & Search controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${statusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                            >
                                {isKh ? 'ទាំងអស់' : 'All'}
                            </button>
                            <button
                                onClick={() => setStatusFilter('paid')}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${statusFilter === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                            >
                                {isKh ? 'បានបង់រួច' : 'Paid'}
                            </button>
                            <button
                                onClick={() => setStatusFilter('unpaid')}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${statusFilter === 'unpaid' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                            >
                                {isKh ? 'មិនទាន់បង់' : 'Unpaid'}
                            </button>
                        </div>

                        <form onSubmit={handleSearchSubmit} className="relative min-w-[200px]">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={isKh ? 'ស្វែងរកម្ចាស់ផ្ទះ/វិក្កយបត្រ...' : 'Search owner or invoice...'}
                                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
                        </form>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <th className="px-4 py-3.5">{isKh ? 'លេខវិក្កយបត្រ' : 'Invoice #'}</th>
                                <th className="px-4 py-3.5">{isKh ? 'ម្ចាស់ផ្ទះ' : 'Landlord (Owner)'}</th>
                                <th className="px-4 py-3.5">{isKh ? 'គម្រោង / បរិយាយ' : 'Plan / Description'}</th>
                                <th className="px-4 py-3.5">{isKh ? 'កាលបរិច្ឆេទកំណត់' : 'Due Date'}</th>
                                <th className="px-4 py-3.5">{isKh ? 'ទឹកប្រាក់' : 'Amount'}</th>
                                <th className="px-4 py-3.5">{isKh ? 'ស្ថានភាព' : 'Status'}</th>
                                <th className="px-4 py-3.5 text-right">{isKh ? 'សកម្មភាព' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                                        {isKh ? 'មិនមានទិន្នន័យវិក្កយបត្រដែលត្រូវនឹងលក្ខខណ្ឌឡើយ។' : 'No invoices match the current filter.'}
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => {
                                    const isPaid = inv.payment_status === 'paid';
                                    const ownerName = inv.owner?.name || 'Owner';
                                    const ownerContact = inv.owner?.phone || inv.owner?.email || '';

                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition">
                                            <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                                {inv.invoice_number || `#${inv.id}`}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-slate-100">{ownerName}</span>
                                                    <p className="text-[11px] text-slate-400 truncate">{ownerContact}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{inv.title}</p>
                                                {inv.payment_method && (
                                                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                        {inv.payment_method}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {inv.due_date || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3.5 font-mono font-bold text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                                ${Number(inv.amount).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                {isPaid ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 rounded-full">
                                                        <span className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                                                        {isKh ? 'បានបង់រួច' : 'Paid'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 rounded-full">
                                                        <span className="w-1.5 h-1.5 bg-amber-600 dark:bg-amber-400 rounded-full" />
                                                        {isKh ? 'មិនទាន់បង់' : 'Unpaid'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                {!isPaid ? (
                                                    <button
                                                        onClick={() => handleTriggerCollect(inv)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                                        title={isKh ? 'កត់ត្រាថាបានទូទាត់' : 'Mark as Collected / Paid'}
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>{isKh ? 'ប្រមូលប្រាក់' : 'Collect'}</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-medium italic">
                                                        {isKh ? 'បានបញ្ចប់' : 'Completed'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Collect / Mark Paid Confirmation Modal */}
            <ConfirmModal
                isOpen={isCollectModalOpen}
                title={isKh ? "កត់ត្រាការប្រមូលប្រាក់ពីម្ចាស់ផ្ទះ" : "Confirm Platform Payment Collection"}
                message={isKh
                    ? `តើអ្នកពិតជាចង់កត់ត្រាវិក្កយបត្រ #${selectedInvoice?.invoice_number || selectedInvoice?.id} ចំនួន $${Number(selectedInvoice?.amount || 0).toFixed(2)} ថាបានបង់រួចរាល់មែនទេ? ប្រព័ន្ធនឹងផ្ញើការជូនដំណឹងទៅកាន់ម្ចាស់ផ្ទះភ្លាមៗ។`
                    : `Are you sure you want to mark invoice #${selectedInvoice?.invoice_number || selectedInvoice?.id} for $${Number(selectedInvoice?.amount || 0).toFixed(2)} as paid? A confirmation notification will be sent to the owner.`
                }
                type="success"
                confirmText={isKh ? "បញ្ជាក់ការប្រមូលប្រាក់" : "Confirm Collection"}
                cancelText={isKh ? "បោះបង់" : "Cancel"}
                onConfirm={handleConfirmCollect}
                onCancel={() => {
                    setIsCollectModalOpen(false);
                    setSelectedInvoice(null);
                }}
            />
        </div>
    );
}
