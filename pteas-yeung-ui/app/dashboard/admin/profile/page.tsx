'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Lock, Mail, Shield, Save, Camera, Phone, Loader2 } from 'lucide-react';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const [lang, setLang] = useState<'kh' | 'en'>('kh');
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    // Profile States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Profile Image
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);

        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');
            if (user.profile_picture) {
                setPreviewUrl(getOptimizedImageUrl(user.profile_picture) || '');
            }
        }
    }, [user]);

    const t = {
        kh: {
            title: 'គណនីរបស់អ្នកគ្រប់គ្រង',
            subtitle: 'គ្រប់គ្រងព័ត៌មានផ្ទាល់ខ្លួន រូបតំណាង Profile និងសុវត្ថិភាពគណនីរបស់អ្នក',
            tabProfile: 'ព័ត៌មានផ្ទាល់ខ្លួន',
            tabPassword: 'ប្តូរលេខកូដសម្ងាត់',
            nameLabel: 'ឈ្មោះអ្នកគ្រប់គ្រង (Admin Name)',
            emailLabel: 'អាសយដ្ឋានអ៊ីមែល',
            phoneLabel: 'លេខទូរស័ព្ទ',
            roleLabel: 'តួនាទីប្រព័ន្ធ',
            currentPass: 'លេខកូដសម្ងាត់បច្ចុប្បន្ន',
            newPass: 'លេខកូដសម្ងាត់ថ្មី',
            confirmPass: 'បញ្ជាក់លេខកូដសម្ងាត់ថ្មី',
            btnSave: 'រក្សាទុកការផ្លាស់ប្តូរ',
            btnSaving: 'កំពុងរក្សាទុក...',
            successProfile: 'ធ្វើបច្ចុប្បន្នភាពព័ត៌មានផ្ទាល់ខ្លួនជោគជ័យ!',
            successPassword: 'ផ្លាស់ប្តូរលេខកូដសម្ងាត់ជោគជ័យ!',
            errMatch: 'លេខកូដសម្ងាត់ថ្មីទាំងពីរមិនផ្ទៀងផ្ទាត់គ្នាឡើយ!',
            changeAvatar: 'ប្តូររូបភាព Profile',
            avatarHint: 'គាំទ្រទម្រង់ JPG, PNG, WEBP (ទំហំអតិបរមា 2MB)',
        },
        en: {
            title: 'Administrator Profile',
            subtitle: 'Manage your personal information, profile picture, and account security',
            tabProfile: 'Profile Information',
            tabPassword: 'Change Password',
            nameLabel: 'Full Name',
            emailLabel: 'Email Address',
            phoneLabel: 'Phone Number',
            roleLabel: 'Account Role',
            currentPass: 'Current Password',
            newPass: 'New Password',
            confirmPass: 'Confirm New Password',
            btnSave: 'Save Changes',
            btnSaving: 'Saving...',
            successProfile: 'Profile updated successfully!',
            successPassword: 'Password changed successfully!',
            errMatch: 'New password and confirmation do not match!',
            changeAvatar: 'Change Avatar',
            avatarHint: 'JPG, PNG, WEBP supported (Max 2MB)',
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error(lang === 'kh' ? 'ទំហំរូបភាពមិនអាចលើសពី 2MB ឡើយ!' : 'Image size cannot exceed 2MB!');
                return;
            }
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Update Profile Handler
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone || '');
        if (imageFile) {
            formData.append('profile_picture', imageFile);
        }

        try {
            const res = await api.post('/profile/update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.success) {
                toast.success(t[lang].successProfile);
                setUser(res.data.user);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setImageFile(null);
                if (res.data.user?.profile_picture) {
                    setPreviewUrl(getOptimizedImageUrl(res.data.user.profile_picture) || '');
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || (lang === 'kh' ? 'មានបញ្ហាក្នុងការកែប្រែប្រវត្តិរូប' : 'Error updating profile'));
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Update Password Handler
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== newPasswordConfirmation) {
            toast.error(t[lang].errMatch);
            return;
        }

        setIsSavingPassword(true);
        try {
            const res = await api.post('/profile/password', {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: newPasswordConfirmation
            });
            if (res.data.success || res.status === 200) {
                toast.success(t[lang].successPassword);
                setCurrentPassword('');
                setNewPassword('');
                setNewPasswordConfirmation('');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || (lang === 'kh' ? 'មានបញ្ហាក្នុងការប្តូរពាក្យសម្ងាត់' : 'Error changing password'));
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{t[lang].title}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t[lang].subtitle}</p>
            </div>

            {/* Tab Buttons */}
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
                    <span>{t[lang].tabProfile}</span>
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
                    <span>{t[lang].tabPassword}</span>
                </button>
            </div>

            {/* Tab Contents */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
                {activeTab === 'profile' ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                        {/* Profile Picture Avatar Section */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-950/60 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 shadow-inner">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt={name || 'Admin'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={48} className="text-slate-400" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-1 right-1 p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-transform group-hover:scale-105"
                                    title={t[lang].changeAvatar}
                                >
                                    <Camera size={15} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    className="hidden"
                                />
                            </div>

                            <div className="space-y-1 text-center sm:text-left">
                                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                    {name || 'Administrator'}
                                </h3>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                                    {user?.role || 'Super Admin'}
                                </p>
                                <p className="text-[11px] text-slate-400 pt-1">
                                    {t[lang].avatarHint}
                                </p>
                            </div>
                        </div>

                        {/* Name & Email Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                            <div>
                                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">
                                    {t[lang].nameLabel}
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">
                                    {t[lang].emailLabel}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Phone & Role Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                            <div>
                                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">
                                    {t[lang].phoneLabel}
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="012 345 678"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">
                                    {t[lang].roleLabel}
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        disabled
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100 dark:bg-slate-800/50 outline-none font-bold text-indigo-600 dark:text-indigo-400 uppercase select-none cursor-not-allowed"
                                        value={user?.role || ''}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-2xl text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 mt-4"
                        >
                            {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            <span>{isSavingProfile ? t[lang].btnSaving : t[lang].btnSave}</span>
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl text-xs font-medium">
                        <div>
                            <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">{t[lang].currentPass}</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">{t[lang].newPass}</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">{t[lang].confirmPass}</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                                    value={newPasswordConfirmation}
                                    onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingPassword}
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-2xl text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 mt-4"
                        >
                            {isSavingPassword ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            <span>{isSavingPassword ? t[lang].btnSaving : t[lang].btnSave}</span>
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}