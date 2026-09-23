'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, CreditCard, Shield, Camera, Save, Loader2, QrCode, Upload, Check } from 'lucide-react';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';

interface ProfileTabProps {
    user: any;
    setUser: (user: any) => void;
    lang: 'kh' | 'en';
    t: any;
}

export default function ProfileTab({ user, setUser, lang, t }: ProfileTabProps) {
    const isKh = lang === 'kh';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [idCardNumber, setIdCardNumber] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Profile Picture
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Landlord Payment Methods (for owner role)
    const [bankName, setBankName] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');
    const [bankAccountNumber, setBankAccountNumber] = useState('');
    const [paymentInstructions, setPaymentInstructions] = useState('');
    const [bankQrFile, setBankQrFile] = useState<File | null>(null);
    const [bankQrPreview, setBankQrPreview] = useState<string>('');
    const bankQrInputRef = useRef<HTMLInputElement>(null);

    const isOwner = user?.role === 'owner';

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');
            setIdCardNumber(user.id_card_number || '');

            if (user.profile_picture) {
                setPreviewUrl(getOptimizedImageUrl(user.profile_picture) || '');
            } else {
                setPreviewUrl('');
            }

            if (user.bank_name) setBankName(user.bank_name);
            if (user.bank_account_name) setBankAccountName(user.bank_account_name);
            if (user.bank_account_number) setBankAccountNumber(user.bank_account_number);
            if (user.payment_instructions) setPaymentInstructions(user.payment_instructions);
            if (user.bank_qr_code) {
                setBankQrPreview(getOptimizedImageUrl(user.bank_qr_code) || user.bank_qr_code);
            }
        } else {
            setName('');
            setEmail('');
            setPhone('');
            setIdCardNumber('');
            setPreviewUrl('');
        }
    }, [user]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(isKh ? 'ទំហំរូបភាពមិនអាចលើសពី 5MB ឡើយ!' : 'Image size cannot exceed 5MB!');
                return;
            }
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleBankQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error(isKh ? 'ទំហំរូបភាព QR មិនអាចលើសពី 2MB ឡើយ!' : 'QR code image size cannot exceed 2MB!');
                return;
            }
            setBankQrFile(file);
            setBankQrPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone || '');
        formData.append('id_card_number', idCardNumber || '');
        if (imageFile) {
            formData.append('profile_picture', imageFile);
        }

        if (isOwner) {
            formData.append('bank_name', bankName);
            formData.append('bank_account_name', bankAccountName);
            formData.append('bank_account_number', bankAccountNumber);
            formData.append('payment_instructions', paymentInstructions);
            if (bankQrFile) {
                formData.append('bank_qr_code', bankQrFile);
            }
        }

        try {
            const res = await api.post('/profile/update', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (res.data.success) {
                toast.success(t[lang].successProfile);
                setUser(res.data.user);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setImageFile(null);
                setBankQrFile(null);
                if (res.data.user?.profile_picture) {
                    setPreviewUrl(getOptimizedImageUrl(res.data.user.profile_picture) || '');
                }
                if (res.data.user?.bank_qr_code) {
                    setBankQrPreview(getOptimizedImageUrl(res.data.user.bank_qr_code) || '');
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || (isKh ? 'មានបញ្ហាក្នុងការកែប្រែប្រវត្តិរូប' : 'Error updating profile'));
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-xs font-medium">{isKh ? 'កំពុងទាញយកទិន្នន័យគណនី...' : 'Loading profile data...'}</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border-2 border-dashed border-indigo-400 dark:border-indigo-500 flex items-center justify-center relative shadow-sm group-hover:border-indigo-600 transition-colors">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Avatar"
                                className="w-full h-full object-cover rounded-full"
                                onError={() => setPreviewUrl('')}
                            />
                        ) : (
                            <User size={36} className="text-slate-400" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                            <Camera size={20} className="text-white" />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        className="hidden"
                    />
                </div>

                <div className="text-center sm:text-left">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {isKh ? 'រូបភាពគណនី (Profile Picture)' : 'Profile Picture'}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t[lang].photoSpecs}</p>
                </div>
            </div>

            {/* Grid Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{t[lang].nameLabel}</label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input type="text" required className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{t[lang].emailLabel}</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input type="email" required className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{t[lang].phoneLabel}</label>
                    <div className="relative">
                        <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="012345678" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{t[lang].idCardLabel}</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="123456789" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium" value={idCardNumber} onChange={(e) => setIdCardNumber(e.target.value)} />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{t[lang].roleLabel}</label>
                    <div className="relative">
                        <Shield className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input type="text" disabled className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-100 dark:bg-slate-800/50 outline-none font-bold text-indigo-600 dark:text-indigo-400 uppercase cursor-not-allowed select-none" value={user?.role || ''} />
                    </div>
                </div>
            </div>

            {/* Owner Payment Method Configuration */}
            {isOwner && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-2">
                        <CreditCard size={18} className="text-emerald-600 dark:text-emerald-400" />
                        <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                {isKh ? 'វិធីសាស្ត្រទទួលប្រាក់ពីអ្នកជួល (Owner Payment Methods)' : 'Tenant Payment Methods & KHQR'}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                                {isKh ? 'ព័ត៌មានទាំងនេះនឹងត្រូវបានបង្ហាញលើវិក្កយបត្រជូនអ្នកជួលដើម្បីស្កេនបង់ប្រាក់' : 'These bank credentials and QR code will appear on invoices for tenants to settle rent'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {isKh ? 'ឈ្មោះធនាគារ (Bank Name)' : 'Bank Name'}
                            </label>
                            <input
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="e.g. ABA Bank / ACLEDA / Wing"
                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {isKh ? 'ឈ្មោះម្ចាស់គណនី' : 'Account Name'}
                            </label>
                            <input
                                type="text"
                                value={bankAccountName}
                                onChange={(e) => setBankAccountName(e.target.value)}
                                placeholder="e.g. SOK DARA"
                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {isKh ? 'លេខគណនីធនាគារ' : 'Account Number'}
                            </label>
                            <input
                                type="text"
                                value={bankAccountNumber}
                                onChange={(e) => setBankAccountNumber(e.target.value)}
                                placeholder="e.g. 000 123 456"
                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono font-medium"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                        {/* QR Code Upload */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                            <label className="block font-bold text-slate-700 dark:text-slate-300">
                                {isKh ? 'រូបភាព QR Code ទទួលប្រាក់ (KHQR)' : 'Landlord KHQR Payment Image'}
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                                    {bankQrPreview ? (
                                        <img
                                            src={bankQrPreview}
                                            alt="Landlord QR Preview"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <QrCode size={28} className="text-slate-300" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => bankQrInputRef.current?.click()}
                                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm"
                                    >
                                        <Upload size={12} />
                                        <span>{isKh ? 'ជ្រើសរើស QR Code' : 'Upload QR'}</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={bankQrInputRef}
                                        onChange={handleBankQrChange}
                                        accept="image/png,image/jpeg,image/webp"
                                        className="hidden"
                                    />
                                    <p className="text-[10px] text-slate-400">PNG, JPG (Max 2MB)</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Remark / Instructions */}
                        <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {isKh ? 'ចំណាំការទូទាត់សម្រាប់អ្នកជួល' : 'Tenant Payment Instructions'}
                            </label>
                            <textarea
                                rows={3}
                                value={paymentInstructions}
                                onChange={(e) => setPaymentInstructions(e.target.value)}
                                placeholder={isKh ? 'ឧ. សូមដាក់លេខបន្ទប់ក្នុងការផ្ញើប្រាក់...' : 'e.g. Please include room number in payment remark...'}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-medium resize-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-2xl text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{isSaving ? t[lang].btnSaving : t[lang].btnSave}</span>
            </button>
        </form>
    );
}