'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Lock, Sparkles } from 'lucide-react';
import ProfileTab from '@/app/components/profile/ProfileTab';
import PasswordTab from '@/app/components/profile/PasswordTab';

export default function TenantProfilePage() {
    const { user, setUser } = useAuth();
    const [lang, setLang] = useState<'kh' | 'en'>('kh');
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang && (savedLang === 'kh' || savedLang === 'en')) {
            setLang(savedLang);
        }
    }, []);

    const t = {
        kh: {
            title: 'គណនីអ្នកជួល (Tenant Profile)',
            subtitle: 'គ្រប់គ្រងព័ត៌មានផ្ទាល់ខ្លួន រូបថតគណនី និងសុវត្ថិភាពរបស់អ្នក',
            tabProfile: 'ព័ត៌មានផ្ទាល់ខ្លួន',
            tabPassword: 'ប្តូរលេខកូដសម្ងាត់',
            nameLabel: 'ឈ្មោះអ្នកជួល',
            emailLabel: 'អាសយដ្ឋានអ៊ីមែល',
            phoneLabel: 'លេខទូរស័ព្ទ',
            idCardLabel: 'លេខអត្តសញ្ញាណប័ណ្ណ (ID Card / Passport)',
            roleLabel: 'តួនាទីក្នុងប្រព័ន្ធ',
            currentPass: 'លេខកូដសម្ងាត់បច្ចុប្បន្ន',
            newPass: 'លេខកូដសម្ងាត់ថ្មី',
            confirmPass: 'បញ្ជាក់លេខកូដសម្ងាត់ថ្មី',
            btnSave: 'រក្សាទុកការផ្លាស់ប្តូរ',
            btnSaving: 'កំពុងរក្សាទុក...',
            successProfile: 'ធ្វើបច្ចុប្បន្នភាពព័ត៌មានផ្ទាល់ខ្លួនជោគជ័យ!',
            successPassword: 'ផ្លាស់ប្តូរលេខកូដសម្ងាត់ជោគជ័យ!',
            errMatch: 'លេខកូដសម្ងាត់ថ្មីទាំងពីរមិនផ្ទៀងផ្ទាត់គ្នាឡើយ!',
            photoSpecs: 'គាំទ្រទម្រង់ JPG, PNG ឬ WebP ទំហំអតិបរមា 5MB'
        },
        en: {
            title: 'Tenant Profile',
            subtitle: 'Manage your personal information, profile photo, and security',
            tabProfile: 'Profile Information',
            tabPassword: 'Change Password',
            nameLabel: 'Tenant Full Name',
            emailLabel: 'Email Address',
            phoneLabel: 'Phone Number',
            idCardLabel: 'ID Card / Passport Number',
            roleLabel: 'System Role',
            currentPass: 'Current Password',
            newPass: 'New Password',
            confirmPass: 'Confirm New Password',
            btnSave: 'Save Changes',
            btnSaving: 'Saving...',
            successProfile: 'Profile updated successfully!',
            successPassword: 'Password changed successfully!',
            errMatch: 'New password and confirmation do not match!',
            photoSpecs: 'Supports JPG, PNG or WebP. Max size 5MB'
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                    <span>{t[lang].title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                        {user?.role || 'Tenant'}
                    </span>
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t[lang].subtitle}</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'profile'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                >
                    <User size={16} />
                    {t[lang].tabProfile}
                </button>
                <button
                    onClick={() => setActiveTab('password')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'password'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                >
                    <Lock size={16} />
                    {t[lang].tabPassword}
                </button>
            </div>

            {/* Render Tab Content Component */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                {activeTab === 'profile' ? (
                    <ProfileTab user={user} setUser={setUser} lang={lang} t={t} />
                ) : (
                    <PasswordTab lang={lang} t={t} />
                )}
            </div>
        </div>
    );
}
