'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGetOwnerDashboardQuery } from '@/store/api/dashboardApi';
import { Building2, DoorOpen, Wallet, Users, Loader2, TrendingUp, DollarSign } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import DashboardFilter from '@/app/components/DashboardFilter';

export default function OwnerDashboardPage() {
    const { user } = useAuth();
    const [lang, setLang] = useState<'kh' | 'en'>('kh');
    const [selectedProperty, setSelectedProperty] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

    const t = {
        kh: {
            allProperties: 'អចលនទ្រព្យទាំងអស់',
            filterBy: 'តម្រងតាមអចលនទ្រព្យ',
            searchPlaceholder: 'ស្វែងរកអចលនទ្រព្យ...',
            totalProps: 'អចលនទ្រព្យសរុប',
            totalRooms: 'បន្ទប់សរុប',
            pendingInvoices: 'កក់បន្ទប់សរុប',
            totalExpenses: 'ការចំណាយសរុប',
            revenueVsExpense: 'ក្រាហ្វិកប្រៀបធៀប ចំណូល និង ការចំណាយ (ប្រចាំខែ)',
            roomStatusTitle: 'ក្រាហ្វិកបែងចែកបន្ទប់តាមអចលនទ្រព្យ',
            revenue: 'ចំណូល',
            expense: 'ចំណាយ',
            loading: 'កំពុងទាញយកទិន្នន័យ...',
            noData: 'គ្មានទិន្នន័យ'
        },
        en: {
            allProperties: 'All Properties',
            filterBy: 'Filter by Property',
            searchPlaceholder: 'Search property...',
            totalProps: 'Total Properties',
            totalRooms: 'Total Rooms',
            pendingInvoices: 'Total Bookings',
            totalExpenses: 'Total Expenses',
            revenueVsExpense: 'Revenue vs Expenses Overview (Monthly)',
            roomStatusTitle: 'Rooms per Property Breakdown',
            revenue: 'Revenue',
            expense: 'Expense',
            loading: 'Loading dashboard data...',
            noData: 'No Data'
        }
    };

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang && (savedLang === 'kh' || savedLang === 'en')) {
            setLang(savedLang);
        }
    }, []);

    const { data: dashboardData, isLoading } = useGetOwnerDashboardQuery({
        property_id: selectedProperty || undefined,
        month: selectedMonth || undefined,
        year: selectedYear || undefined
    });

    if (isLoading || !dashboardData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm font-medium">{t[lang].loading}</p>
            </div>
        );
    }

    const properties = dashboardData?.properties || [];
    const stats = dashboardData?.stats || { total_properties: 0, total_rooms: 0, total_bookings: 0, total_expense: 0 };
    const bar_chart = dashboardData?.bar_chart || [];
    const rawDonutData = dashboardData?.donut_chart || [];

    const totalRevenueNum = Number(stats.total_revenue || 0);
    const totalExpenseNum = Number(stats.total_expense || 0);
    const netProfitNum = totalRevenueNum - totalExpenseNum;

    const cardStats = [
        { 
            title: lang === 'kh' ? 'ចំណូលប្រមូលបាន' : 'Total Revenue', 
            value: `$${totalRevenueNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
            icon: TrendingUp, 
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400' 
        },
        { 
            title: t[lang].totalExpenses, 
            value: `$${totalExpenseNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
            icon: Wallet, 
            color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400' 
        },
        { 
            title: lang === 'kh' ? 'ប្រាក់ចំណេញសុទ្ធ' : 'Net Profit', 
            value: `$${netProfitNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
            icon: DollarSign, 
            color: netProfitNum >= 0 ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' 
        },
        { 
            title: t[lang].pendingInvoices, 
            value: stats.total_bookings, 
            icon: Users, 
            color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400' 
        },
        { 
            title: t[lang].totalRooms, 
            value: stats.total_rooms, 
            icon: DoorOpen, 
            color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50 dark:text-sky-400' 
        },
        { 
            title: t[lang].totalProps, 
            value: stats.total_properties, 
            icon: Building2, 
            color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50 dark:text-violet-400' 
        },
    ];

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];

    let donutData = rawDonutData.map((item: any, index: number) => ({
        name: item.property_name,
        value: Number(item.rooms_count || 0),
        color: COLORS[index % COLORS.length]
    })).filter((item: any) => item.value > 0);

    if (donutData.length === 0) {
        donutData = [{ name: t[lang].noData, value: 1, color: '#94a3b8' }];
    }

    return (
        <div className="space-y-4 text-slate-900 dark:text-slate-100 transition-colors duration-200">

            {/* Header Filter Section - លុបអត្ថបទស្វាគមន៍ចោលរួចរាល់ */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <DashboardFilter
                    properties={properties}
                    selectedProperty={selectedProperty}
                    setSelectedProperty={setSelectedProperty}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    t={t}
                    lang={lang}
                />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
                {cardStats.map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                        <div className="space-y-1 min-w-0 flex-1">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">{stat.title}</span>
                            <h3 className="text-xl sm:text-2xl font-black dark:text-white truncate">{stat.value}</h3>
                        </div>
                        <div className={`p-2.5 rounded-xl ${stat.color} flex-shrink-0 ml-2`}>
                            <stat.icon size={20} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 📊 Left: Bar Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">
                        {t[lang].revenueVsExpense}
                    </h3>
                    <div className="h-80 w-full text-xs font-medium">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bar_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                                <XAxis dataKey="name" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgb(15, 23, 42)', borderRadius: '12px', border: 'none', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar dataKey="revenue" name={t[lang].revenue} fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name={t[lang].expense} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 🍩 Right: Donut Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">
                        {t[lang].roomStatusTitle}
                    </h3>

                    <div className="h-52 w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={donutData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {donutData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black dark:text-white">{stats.total_rooms}</span>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t[lang].totalRooms}</span>
                        </div>
                    </div>

                    {/* Legends Custom */}
                    <div className="max-h-[120px] overflow-y-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
                        {donutData.map((item: any, index: number) => (
                            <div key={index} className="flex flex-col">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="truncate">{item.name}</span>
                                </div>
                                <span className="text-sm font-extrabold pl-4 dark:text-white">
                                    {item.name === t[lang].noData ? 0 : `${item.value} បន្ទប់`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}