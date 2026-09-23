'use client';
import React from 'react';
import Link from 'next/link';
import { 
    Users, Building2, FileText, DollarSign, AlertCircle, Clock, RefreshCw, 
    ArrowUpRight, TrendingUp, CreditCard, ShieldCheck, Settings, BarChart3, 
    ChevronRight, BellRing 
} from 'lucide-react';
import { useGetAdminDashboardQuery } from '@/store/api/dashboardApi';
import { useLanguage } from '@/lib/LanguageContext';

// 📥 នាំចូល Component Chart
import { OperationalDonutChart, WeeklyBarChart } from '@/app/components/DashboardCharts';

interface DashboardData {
    stats: {
        total_users: number;
        total_properties: number;
        total_rooms: number;
        total_revenue: number;
        total_expenses: number;
    };
    // 📊 បន្ថែម Interface ត្រង់នេះដើម្បីឱ្យស្គាល់ទិន្នន័យ Chart ចេញពី Laravel 
    chart_data: {
        donut: {
            series: number[];
            labels: string[];
        };
        weekly: {
            categories: string[];
            values: number[];
            is_sample?: boolean;
        };
    };
    latest_data: {
        recent_users: Array<{ id: number; name: string; email: string; created_at: string }>;
        recent_invoices: Array<{ id: number; amount: number; total_amount?: number; status: string; payment_status?: string; user?: { id: number; name: string } }>;
        pending_properties: Array<{ id: number; title: string; status: string }>;
    };
    system_info: {
        server_time: string;
        app_version: string;
    };
}

export default function AdminDashboardPage() {
    const { language } = useLanguage();
    const isKh = language === 'kh';

    const { data: responseData, isLoading: loading, isError: error, refetch: fetchDashboardData } = useGetAdminDashboardQuery();
    
    // Type assertion because baseQuery returns unknown without casting sometimes, or we can just assume responseData matches
    const data = responseData as unknown as DashboardData;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 w-full min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {isKh ? "កំពុងផ្ទុកទិន្នន័យស្ថិតិ..." : "Loading dashboard statistics..."}
                </p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl w-full">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                    <p className="font-medium text-rose-900 dark:text-rose-100 text-sm break-words">
                        {isKh ? "មិនអាចទាញយកទិន្នន័យបានទេ" : "Failed to load dashboard data."}
                    </p>
                    <button onClick={fetchDashboardData} className="text-xs font-semibold text-rose-600 dark:text-rose-400 underline mt-2 block">
                        {isKh ? "ព្យាយាមម្តងទៀត" : "Try again"}
                    </button>
                </div>
            </div>
        );
    }

    const pendingPropertiesCount = data.latest_data?.pending_properties?.length || 0;

    return (
        <div className="space-y-6 w-full max-w-full text-slate-800 dark:text-slate-200 antialiased">

            {/* Top Welcome & Header Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full border-b border-slate-100 dark:border-slate-800/60 pb-5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        {isKh ? "ទិដ្ឋភាពទូទៅនៃប្រព័ន្ធ" : "System Overview"}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mt-1">
                        {isKh ? "ស្វាគមន៍មកកាន់ផ្ទាំងគ្រប់គ្រង និងរបាយការណ៍សកម្មភាពចុងក្រោយ" : "Welcome to the administration panel & latest activity reports"}
                    </p>
                </div>

                <button
                    onClick={fetchDashboardData}
                    className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{isKh ? "ធ្វើបច្ចុប្បន្នភាព" : "Refresh"}</span>
                </button>
            </div>

            {/* Pending Approvals Banner */}
            {pendingPropertiesCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300 flex-shrink-0">
                            <BellRing className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                                {isKh 
                                    ? `មាន ${pendingPropertiesCount} អចលនទ្រព្យកំពុងរង់ចាំការពិនិត្យ និងអនុម័ត!` 
                                    : `${pendingPropertiesCount} properties are awaiting your verification & approval!`}
                            </p>
                            <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                                {isKh ? "សូមពិនិត្យមើលព័ត៌មានលម្អិតមុននឹងបើកឱ្យដំណើរការលើប្រព័ន្ធ" : "Please review the submissions before approving them onto the platform."}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/admin/properties"
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 self-end sm:self-auto"
                    >
                        <span>{isKh ? "ពិនិត្យឥឡូវនេះ" : "Review Now"}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}

            {/* Row 1: 4-Column Core Stats Cards with Direct Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 w-full">

                {/* 1. Total Users */}
                <Link
                    href="/dashboard/admin/users"
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs hover:border-indigo-500/40 hover:shadow-md transition duration-200 group block"
                >
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                            <span>{isKh ? "គ្រប់គ្រង" : "Manage"}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </div>
                    <div className="mt-4 space-y-0.5">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {isKh ? "សមាជិកសរុប" : "Total Members"}
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {data.stats.total_users.toLocaleString()} {isKh ? "នាក់" : "Users"}
                        </h3>
                    </div>
                </Link>

                {/* 2. Total Properties */}
                <Link
                    href="/dashboard/admin/properties"
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs hover:border-sky-500/40 hover:shadow-md transition duration-200 group block"
                >
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                            <span>{isKh ? "បញ្ជី" : "List"}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </div>
                    <div className="mt-4 space-y-0.5">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {isKh ? "អចលនទ្រព្យសរុប" : "Total Properties"}
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {data.stats.total_properties.toLocaleString()} {isKh ? "ខ្នង" : "Units"}
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            {data.stats.total_rooms.toLocaleString()} {isKh ? "បន្ទប់ជួលសរុប" : "Total Rooms"}
                        </p>
                    </div>
                </Link>

                {/* 3. Total Expenses */}
                <Link
                    href="/dashboard/admin/expenses"
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs hover:border-rose-500/40 hover:shadow-md transition duration-200 group block"
                >
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            <span>{isKh ? "ចំណាយ" : "Expenses"}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </div>
                    <div className="mt-4 space-y-0.5">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {isKh ? "ការចំណាយសរុប" : "Total Expenses"}
                        </p>
                        <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                            ${Number(data.stats.total_expenses).toLocaleString()}
                        </h3>
                    </div>
                </Link>

                {/* 4. Total Revenue / Income */}
                <Link
                    href="/dashboard/admin/income"
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs hover:border-emerald-500/40 hover:shadow-md transition duration-200 group block"
                >
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span>{isKh ? "ចំណូល" : "Income"}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </div>
                    <div className="mt-4 space-y-0.5">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {isKh ? "ចំណូលវិក្កយបត្រសរុប" : "Total Revenue"}
                        </p>
                        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                            ${Number(data.stats.total_revenue).toLocaleString()}
                        </h3>
                    </div>
                </Link>

            </div>

            {/* Quick Actions Shortcuts Grid */}
            <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {isKh ? "ផ្លូវកាត់មុខងាររហ័ស" : "Quick Action Shortcuts"}
                    </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Link
                        href="/dashboard/admin/income"
                        className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-emerald-500/40 hover:shadow-xs transition group text-center"
                    >
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-105 transition-transform">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {isKh ? "គ្រប់គ្រងចំណូល" : "Income Flow"}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                            {isKh ? "វិក្កយបត្រ & បង់ប្រាក់" : "Invoices & Paid"}
                        </span>
                    </Link>

                    <Link
                        href="/dashboard/admin/expenses"
                        className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-rose-500/40 hover:shadow-xs transition group text-center"
                    >
                        <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-2 group-hover:scale-105 transition-transform">
                            <CreditCard className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {isKh ? "ការចំណាយ" : "Expenses"}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                            {isKh ? "តាមដាន & កត់ត្រា" : "Track & Log"}
                        </span>
                    </Link>

                    <Link
                        href="/dashboard/admin/users"
                        className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-500/40 hover:shadow-xs transition group text-center"
                    >
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-105 transition-transform">
                            <Users className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {isKh ? "អ្នកប្រើប្រាស់" : "Users"}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                            {isKh ? "ម្ចាស់ & អ្នកជួល" : "Owners & Tenants"}
                        </span>
                    </Link>

                    <Link
                        href="/dashboard/admin/properties"
                        className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-sky-500/40 hover:shadow-xs transition group text-center"
                    >
                        <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-2 group-hover:scale-105 transition-transform">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {isKh ? "អចលនទ្រព្យ" : "Properties"}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                            {isKh ? "ពិនិត្យ & អនុម័ត" : "Verify & Approve"}
                        </span>
                    </Link>

                    <Link
                        href="/dashboard/admin/reports"
                        className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-amber-500/40 hover:shadow-xs transition group text-center"
                    >
                        <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-105 transition-transform">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {isKh ? "របាយការណ៍" : "Reports"}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                            {isKh ? "ស្ថិតិ & ទាញយក" : "Stats & Export"}
                        </span>
                    </Link>

                    <Link
                        href="/dashboard/admin/settings"
                        className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-purple-500/40 hover:shadow-xs transition group text-center"
                    >
                        <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-105 transition-transform">
                            <Settings className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {isKh ? "ការកំណត់" : "Settings"}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                            {isKh ? "ព័ត៌មាន & ប្រព័ន្ធ" : "System & Footer"}
                        </span>
                    </Link>
                </div>
            </div>

            {/* Row 2: Visual Charts Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                <div className="lg:col-span-1 flex flex-col">
                    <OperationalDonutChart
                        seriesData={data?.chart_data?.donut?.series}
                        labelsData={data?.chart_data?.donut?.labels}
                    />                </div>
                <div className="lg:col-span-2 flex flex-col">
                    <WeeklyBarChart
                        categories={data?.chart_data?.weekly?.categories}
                        dataValues={data?.chart_data?.weekly?.values}
                    />                </div>
            </div>

            {/* Row 3: Recent Activities Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

                {/* ប្រអប់អ្នកប្រើប្រាស់ចុះឈ្មោះថ្មីៗ */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 w-full shadow-xs flex flex-col">
                    <div className="flex items-center justify-between mb-2 border-b border-slate-50 dark:border-slate-800/60 pb-3">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500" />
                            <span>{isKh ? "សមាជិកចុះឈ្មោះថ្មីៗ" : "Recent Registered Members"}</span>
                        </h3>
                        <Link 
                            href="/dashboard/admin/users" 
                            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                        >
                            <span>{isKh ? "មើលទាំងអស់" : "View All"}</span>
                            <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/40 flex-1">
                        {data.latest_data.recent_users.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">
                                {isKh ? "មិនទាន់មានអ្នកប្រើប្រាស់ថ្មី។" : "No recent users found."}
                            </p>
                        ) : (
                            data.latest_data.recent_users.map((u) => (
                                <div key={u.id} className="py-3 flex items-center justify-between gap-3 min-w-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl flex items-center justify-center text-xs flex-shrink-0">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{u.name}</p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg">
                                        <Clock className="w-3 h-3 text-slate-400" /> {new Date(u.created_at).toLocaleDateString(isKh ? 'km-KH' : 'en-US')}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ប្រអប់វិក្កយបត្រថ្មីៗ */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 w-full shadow-xs flex flex-col">
                    <div className="flex items-center justify-between mb-2 border-b border-slate-50 dark:border-slate-800/60 pb-3">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-500" />
                            <span>{isKh ? "វិក្កយបត្រចុងក្រោយ" : "Recent Invoices"}</span>
                        </h3>
                        <Link 
                            href="/dashboard/admin/payments" 
                            className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                        >
                            <span>{isKh ? "មើលទាំងអស់" : "View All"}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/40 flex-1">
                        {data.latest_data.recent_invoices.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">
                                {isKh ? "មិនទាន់មានវិក្កយបត្រចេញនៅឡើយទេ។" : "No invoices issued yet."}
                            </p>
                        ) : (
                            data.latest_data.recent_invoices.map((inv: any) => {
                                const isPaid = (inv.payment_status || inv.status) === 'paid';
                                const ownerName = inv.owner?.name || inv.user?.name;
                                const title = inv.title || (isKh ? `វិក្កយបត្រ #${inv.invoice_number || inv.id}` : `Invoice #${inv.invoice_number || inv.id}`);

                                return (
                                    <div key={inv.id} className="py-3 flex items-center justify-between gap-3 min-w-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl flex items-center justify-center text-sm flex-shrink-0">
                                                $
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                    {ownerName ? `${ownerName} - ${title}` : title}
                                                </p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                                                    ${Number(inv.total_amount || inv.amount).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap ${isPaid
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                                            }`}>
                                            {isPaid ? (isKh ? 'បង់រួច' : 'Paid') : (isKh ? 'រង់ចាំ' : 'Pending')}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}