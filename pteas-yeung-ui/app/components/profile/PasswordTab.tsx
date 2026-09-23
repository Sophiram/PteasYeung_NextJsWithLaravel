'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Lock, Save } from 'lucide-react';

interface PasswordTabProps {
    lang: 'kh' | 'en';
    t: any;
}

export default function PasswordTab({ lang, t }: PasswordTabProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== newPasswordConfirmation) {
            toast.error(t[lang].errMatch);
            return;
        }

        setIsSaving(true);
        try {
            const res = await api.post('/profile/password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: newPasswordConfirmation
            });
            if (res.data.success) {
                toast.success(t[lang].successPassword);
                setCurrentPassword('');
                setNewPassword('');
                setNewPasswordConfirmation('');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error changing password');
        } bits: {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{t[lang].currentPass}</label>
                <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input type="password" required placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder-slate-400" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{t[lang].newPass}</label>
                <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input type="password" required placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder-slate-400" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{t[lang].confirmPass}</label>
                <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input type="password" required placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder-slate-400" value={newPasswordConfirmation} onChange={(e) => setNewPasswordConfirmation(e.target.value)} />
                </div>
            </div>

            <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow-md transition-all disabled:opacity-50 mt-4">
                <Save size={16} />
                {isSaving ? t[lang].btnSaving : t[lang].btnSave}
            </button>
        </form>
    );
}