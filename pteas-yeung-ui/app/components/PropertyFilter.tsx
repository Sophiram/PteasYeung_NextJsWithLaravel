'use client';

import React from 'react';
import { Search, Building, ChevronDown } from 'lucide-react';

interface PropertyFilterProps {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    selectedProperty: string;
    setSelectedProperty: (value: string) => void;
    properties: Array<{ id: string; name: string }>;
    t: any;
    lang: 'kh' | 'en';
}

export default function PropertyFilter({
    searchQuery,
    setSearchQuery,
    selectedProperty,
    setSelectedProperty,
    properties,
    t,
    lang
}: PropertyFilterProps) {

    const filteredProperties = React.useMemo(() => {
        return properties.filter((prop: any) =>
            prop.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [properties, searchQuery]);

    return (
        // ធ្វើឱ្យវាបង្ហាញជាជួរដេកជានិច្ច (Row)
        <div className="flex flex-row items-center gap-4 w-full">

            {/* 1. Input Search Bar */}
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Search size={18} />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t[lang].searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                />
            </div>

            {/* 2. Select Dropdown */}
            <div className="relative flex items-center flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    {/* Consistent icon size (18 instead of 16) */}
                    <Building size={18} />
                </div>
                <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    // UI Consistency: pl-10 (prevents text overlap) and matching blue focus rings
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                >
                    <option value="">{t[lang].allProperties}</option>
                    {filteredProperties.map((prop: any) => (
                        <option key={prop.id} value={prop.id}>{prop.name}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    {/* Changed to ChevronDown to properly indicate a dropdown select menu */}
                    <ChevronDown size={18} />
                </div>
            </div>

        </div>
    );
}