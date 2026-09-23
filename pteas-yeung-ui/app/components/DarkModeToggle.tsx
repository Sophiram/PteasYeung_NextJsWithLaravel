'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface DarkModeToggleProps {
    lang?: 'kh' | 'en';
    className?: string;
}

export default function DarkModeToggle({ lang = 'kh', className }: DarkModeToggleProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const syncTheme = () => {
            const savedTheme = localStorage.getItem('theme');
            const isDark = savedTheme === 'dark' ||
                (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

            setIsDarkMode(isDark);

            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        syncTheme();
        window.addEventListener('storage', syncTheme);
        window.addEventListener('themeChange', syncTheme);
        return () => {
            window.removeEventListener('storage', syncTheme);
            window.removeEventListener('themeChange', syncTheme);
        };
    }, []);

    const toggleDarkMode = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
        window.dispatchEvent(new Event('themeChange'));
    };

    if (!mounted) {
        return <div className={`w-9 h-9 ${className || ''}`} />;
    }

    // 🟢 អត្ថបទ Hover តាមភាសា
    const titleText = isDarkMode
        ? (lang === 'en' ? 'Switch to Light Mode' : 'ប្តូរទៅរបៀបពន្លឺ (Light Mode)')
        : (lang === 'en' ? 'Switch to Dark Mode' : 'ប្តូរទៅរបៀបងងឹត (Dark Mode)');

    return (
        <button
            onClick={toggleDarkMode}
            className={`p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer flex items-center justify-center ${className || ''}`}
            title={titleText}
            aria-label={titleText}
            type="button"
        >
            {isDarkMode ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 animate-in fade-in" />
            ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400 animate-in fade-in" />
            )}
        </button>
    );
}