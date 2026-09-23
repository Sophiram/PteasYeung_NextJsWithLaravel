'use client';
import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext'; // នាំចូល Hook ភាសា

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'success' | 'warning';
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText, // លុបតម្លៃ Default ចេញដើម្បីឱ្យវាទទួលយកពីខាងក្រៅ
    cancelText,
    type = 'danger'
}: ConfirmModalProps) {
    const { language } = useLanguage(); // យកភាសាដែលកំពុងប្រើ

    if (!isOpen) return null;

    // កំណត់តម្លៃ Default តាមភាសា
    const defaultConfirm = language === 'kh' ? 'យល់ព្រម' : 'Confirm';
    const defaultCancel = language === 'kh' ? 'បោះបង់' : 'Cancel';

    const buttonColors = {
        danger: 'bg-rose-600 hover:bg-rose-700 text-white',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 relative z-10 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={18} />
                </button>

                <div className="flex gap-3 items-start">
                    <div className={`p-2 rounded-lg ${type === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50'}`}>
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{message}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                    >
                        {cancelText || defaultCancel}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition ${buttonColors[type]}`}
                    >
                        {confirmText || defaultConfirm}
                    </button>
                </div>
            </div>
        </div>
    );
}