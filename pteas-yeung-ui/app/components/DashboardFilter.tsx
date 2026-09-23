'use client';

import React from 'react';
import { Building, CalendarDays, Calendar, ChevronDown } from 'lucide-react';

export default function DashboardFilter({
    properties,
    selectedProperty, setSelectedProperty,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    t, lang
}: any) {

    // ស្ទីលរួមសម្រាប់ select box ដែលបានកែសម្រួលពណ៌ Border និង Ring ដូច Input ធម្មតា
    const selectClasses = "appearance-none cursor-pointer w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-200 truncate";

    return (
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">

            {/* 🏢 Property Select */}
            <div className="relative flex-1 w-full sm:w-auto min-w-[240px] group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Building size={18} />
                </div>
                <select value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)} className={selectClasses}>
                    <option value="">{t[lang].allProperties}</option>
                    {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                {/* 📅 Month Select */}
                <div className="relative flex-1 min-w-[140px] group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <CalendarDays size={18} />
                    </div>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={selectClasses}>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                                {new Date(0, i).toLocaleString(lang === 'kh' ? 'km-KH' : 'en-US', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                    </div>
                </div>

                {/* 🗓️ Year Select */}
                <div className="relative flex-1 min-w-[120px] group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <Calendar size={18} />
                    </div>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={selectClasses}>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                    </div>
                </div>
            </div>
        </div>
    );
}