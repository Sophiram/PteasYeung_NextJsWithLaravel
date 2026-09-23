'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, 
    Download, RefreshCw, AlertCircle, FileSpreadsheet, Search, 
    ArrowDownRight, ArrowUpRight, Filter, PieChart, ShieldCheck
} from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import toast, { Toaster } from 'react-hot-toast';

interface ReportSummary {
    total_income: number;
    total_expense: number;
    net_profit: number;
}

interface ReportRow {
    'ថ្ងៃខែ': string;
    'ប្រភេទ': string;
    'ប្រភព/ការពិពណ៌នា': string;
    'ទឹកប្រាក់ ($)': number;
    'ស្ថានភាព': string;
}

export default function AdminReportsPage() {
    const { language } = useLanguage();
    const isKh = language === 'kh';

    const [summary, setSummary] = useState<ReportSummary>({
        total_income: 0,
        total_expense: 0,
        net_profit: 0,
    });
    const [rows, setRows] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Filters
    const [reportType, setReportType] = useState<'all' | 'income' | 'expense'>('all');
    const [datePreset, setDatePreset] = useState<'all' | 'this_month' | 'last_month' | 'this_year' | 'custom'>('this_month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Set dates based on preset
    useEffect(() => {
        const now = new Date();
        if (datePreset === 'this_month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            setStartDate(firstDay);
            setEndDate(lastDay);
        } else if (datePreset === 'last_month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
            setStartDate(firstDay);
            setEndDate(lastDay);
        } else if (datePreset === 'this_year') {
            const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
            setStartDate(firstDay);
            setEndDate(lastDay);
        } else if (datePreset === 'all') {
            setStartDate('');
            setEndDate('');
        }
    }, [datePreset]);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/admin/reports/export', {
                params: {
                    format: 'json',
                    type: reportType,
                    start_date: startDate || undefined,
                    end_date: endDate || undefined,
                }
            });

            if (res.data?.success) {
                setSummary(res.data.summary || { total_income: 0, total_expense: 0, net_profit: 0 });
                setRows(res.data.data || []);
            }
        } catch (err) {
            console.error("Error loading financial reports:", err);
            setError(isKh ? "មិនអាចទាញយកទិន្នន័យរបាយការណ៍បានទេ!" : "Failed to load financial reports.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [reportType, startDate, endDate]);

    // Handle Excel File Export
    const handleDownloadExcel = async () => {
        setIsExporting(true);
        try {
            const params: Record<string, string> = {};
            if (reportType !== 'all') params.type = reportType;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const res = await api.get('/admin/reports/export', {
                params,
                responseType: 'blob',
            });

            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `PteasYeung_Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast.success(isKh ? "បានទាញយករបាយការណ៍ Excel ជោគជ័យ!" : "Excel report downloaded successfully!");
        } catch (err) {
            console.error(err);
            toast.error(isKh ? "បរាជ័យក្នុងការទាញយក Excel!" : "Failed to export Excel report.");
        } finally {
            setIsExporting(false);
        }
    };

    // Filter rows by search term
    const filteredRows = useMemo(() => {
        if (!searchTerm) return rows;
        const q = searchTerm.toLowerCase();
        return rows.filter((r) => 
            (r['ប្រភព/ការពិពណ៌នា'] && r['ប្រភព/ការពិពណ៌នា'].toLowerCase().includes(q)) ||
            (r['ប្រភេទ'] && r['ប្រភេទ'].toLowerCase().includes(q)) ||
            (r['ថ្ងៃខែ'] && r['ថ្ងៃខែ'].includes(q))
        );
    }, [rows, searchTerm]);

    // Profit margin calculation
    const profitMargin = useMemo(() => {
        if (summary.total_income <= 0) return 0;
        return Math.round((summary.net_profit / summary.total_income) * 100);
    }, [summary]);

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            <Toaster position="top-right" reverseOrder={false} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {isKh ? 'របាយការណ៍ហិរញ្ញវត្ថុប្រព័ន្ធ' : 'Financial & System Reports'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isKh ? 'វិភាគទិន្នន័យចំណូល ចំណាយ ប្រាក់ចំណេញ និងនាំចេញជាឯកសារ Excel' : 'Analyze income, expenses, net profits, and export to Excel spreadsheets'}
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleDownloadExcel}
                        disabled={isExporting}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>{isExporting ? (isKh ? 'កំពុងទាញយក...' : 'Exporting...') : (isKh ? 'ទាញយក Excel' : 'Export Excel')}</span>
                    </button>
                </div>
            </div>

            {/* Filter Control Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Preset Buttons */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {isKh ? 'កាលបរិច្ឆេទ:' : 'Period:'}
                        </span>

                        {[
                            { id: 'this_month', label: isKh ? 'ខែនេះ' : 'This Month' },
                            { id: 'last_month', label: isKh ? 'ខែមុន' : 'Last Month' },
                            { id: 'this_year', label: isKh ? 'ឆ្នាំនេះ' : 'This Year' },
                            { id: 'all', label: isKh ? 'ទាំងអស់' : 'All Time' },
                            { id: 'custom', label: isKh ? 'តាមកាលកំណត់' : 'Custom' },
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setDatePreset(p.id as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${datePreset === p.id ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Report Type Filter (All, Income, Expense) */}
                    <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 self-end sm:self-auto">
                        <button
                            onClick={() => setReportType('all')}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${reportType === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                            {isKh ? 'ទាំងអស់' : 'All'}
                        </button>
                        <button
                            onClick={() => setReportType('income')}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${reportType === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                            {isKh ? 'ចំណូល' : 'Income'}
                        </button>
                        <button
                            onClick={() => setReportType('expense')}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${reportType === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                            {isKh ? 'ចំណាយ' : 'Expense'}
                        </button>
                    </div>
                </div>

                {/* Custom Date Pickers (Shown when custom preset is picked) */}
                {datePreset === 'custom' && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{isKh ? 'ចាប់ពីថ្ងៃ៖' : 'From:'}</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{isKh ? 'ដល់ថ្ងៃ៖' : 'To:'}</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Financial Health Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Income */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKh ? 'ចំណូលសរុប' : 'Total Revenue'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                        ${Number(summary.total_income).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {isKh ? 'ពីថ្លៃសេវា និងការជាវរបស់ម្ចាស់ផ្ទះ' : 'From owner subscriptions & fees'}
                    </p>
                </div>

                {/* Total Expense */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKh ? 'ចំណាយសរុប' : 'Total Expenses'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                        ${Number(summary.total_expense).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {isKh ? 'ចំណាយប្រតិបត្តិការប្រព័ន្ធ' : 'Platform & system operations'}
                    </p>
                </div>

                {/* Net Profit */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKh ? 'ប្រាក់ចំណេញសុទ្ធ' : 'Net Cash Flow / Profit'}
                        </span>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${summary.net_profit >= 0 ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400' : 'bg-rose-100 text-rose-600'}`}>
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className={`text-2xl sm:text-3xl font-black ${summary.net_profit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                        ${Number(summary.net_profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {isKh ? 'ចំណូល ដក ចំណាយ' : 'Income minus expenses'}
                    </p>
                </div>

                {/* Profit Margin */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKh ? 'អត្រាប្រាក់ចំណេញ' : 'Profit Margin'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
                            <PieChart className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                        {profitMargin}%
                    </h2>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                            style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        />
                    </div>
                </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                            {isKh ? 'ប្រតិបត្តិការហិរញ្ញវត្ថុលម្អិត' : 'Financial Transaction Ledger'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isKh ? 'បង្ហាញរាល់កំណត់ត្រាចំណូល និងចំណាយដែលបានជ្រើសរើស' : 'Itemized income and expense records'}
                        </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={isKh ? 'ស្វែងរកប្រតិបត្តិការ...' : 'Search ledger...'}
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-16 text-slate-400 text-xs sm:text-sm">
                        <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        {isKh ? 'កំពុងទាញយកទិន្នន័យរបាយការណ៍...' : 'Loading report data...'}
                    </div>
                ) : filteredRows.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs sm:text-sm">
                        {isKh ? 'មិនមានទិន្នន័យប្រតិបត្តិការក្នុងចន្លោះពេលនេះឡើយ។' : 'No transactions recorded in this period.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="px-4 py-3.5">{isKh ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                                    <th className="px-4 py-3.5">{isKh ? 'ប្រភេទ' : 'Type'}</th>
                                    <th className="px-4 py-3.5">{isKh ? 'ប្រភព / ការពិពណ៌នា' : 'Source / Description'}</th>
                                    <th className="px-4 py-3.5">{isKh ? 'ស្ថានភាព' : 'Status'}</th>
                                    <th className="px-4 py-3.5 text-right">{isKh ? 'ទឹកប្រាក់ ($)' : 'Amount ($)'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                {filteredRows.map((row, idx) => {
                                    const isIncome = row['ប្រភេទ']?.includes('ចំណូល') || row['ទឹកប្រាក់ ($)'] > 0;
                                    const amount = Math.abs(Number(row['ទឹកប្រាក់ ($)']));

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/30 transition">
                                            <td className="px-4 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                                                {row['ថ្ងៃខែ'] || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                {isIncome ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 rounded-full">
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                        {isKh ? 'ចំណូល' : 'Income'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/40 rounded-full">
                                                        <ArrowDownRight className="w-3.5 h-3.5" />
                                                        {isKh ? 'ចំណាយ' : 'Expense'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {row['ប្រភព/ការពិពណ៌នា']}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className="text-xs uppercase font-medium text-slate-500">
                                                    {row['ស្ថានភាព'] || 'paid'}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3.5 text-right font-mono font-bold text-sm whitespace-nowrap ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {isIncome ? `+$${amount.toFixed(2)}` : `-$${amount.toFixed(2)}`}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}