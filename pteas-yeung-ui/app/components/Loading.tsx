'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
    fullScreen?: boolean;
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    lang?: 'kh' | 'en'; // 🟢 បន្ថែម Props ភាសា (Option)
}

export default function Loading({
    fullScreen = false,
    size = 'md',
    text,
    lang = 'kh'
}: LoadingProps) {

    // 🟢 កំណត់ពាក្យលំនាំដើមតាមភាសាករណីមិនមានការបញ្ជូន text មក
    const defaultText = lang === 'kh' ? 'កំពុងផ្ទុកទិន្នន័យ...' : 'Loading data...';
    const displayText = text || defaultText;

    // កំណត់ទំហំ Icon
    const sizeClasses = {
        sm: 'w-5 h-5 text-rose-500',
        md: 'w-9 h-9 text-rose-600 dark:text-rose-500',
        lg: 'w-14 h-14 text-rose-600 dark:text-rose-500',
    };

    const containerStyle = fullScreen
        ? 'fixed inset-0 bg-slate-900/20 dark:bg-black/50 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in duration-200'
        : 'flex flex-col items-center justify-center py-12 w-full gap-3';

    return (
        <div className={containerStyle}>
            {/* 🟢 ប្រើប្រាស់ Loader2 ជាមួយ Smooth Spin Animation */}
            <Loader2 className={`${sizeClasses[size]} animate-spin`} />

            {displayText && (
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold tracking-wide animate-pulse">
                    {displayText}
                </p>
            )}
        </div>
    );
}