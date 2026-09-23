'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Settings, Save, Loader2, Image as ImageIcon, Upload, 
    Phone, Mail, Send, MapPin, Clock, Globe, Sparkles,
    Receipt, FileText, Eye, Palette, Check, DollarSign,
    CreditCard, User, QrCode, Shield, Copy, ExternalLink,
    Camera, RefreshCw, Layers, Database, Download, Server
} from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { translations } from '@/lib/translations';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';
import ReceiptModal, { ReceiptInvoice, ReceiptSettings } from '@/app/components/ReceiptModal';
import PendingApprovalModal from '@/app/components/PendingApprovalModal';

interface SystemSettings extends ReceiptSettings {
    // 1. Profile & System
    system_name: string;
    logo_url: string;
    admin_email: string;
    admin_name?: string;
    admin_phone?: string;
    admin_profile_picture?: string;

    // 2. Hero Section
    hero_title: string;
    hero_subtitle: string;
    hero_background: string;

    // 3. Payment Methods
    admin_bank_name?: string;
    admin_bank_account_name?: string;
    admin_bank_account_number?: string;
    admin_bank_qr_url?: string;
    admin_hotline_secondary?: string;
    admin_payment_notes_kh?: string;
    admin_payment_notes_en?: string;

    // 4. Footer & Socials
    footer_description_kh: string;
    footer_description_en: string;
    footer_hotline: string;
    footer_email: string;
    footer_telegram: string;
    footer_address_kh: string;
    footer_address_en: string;
    footer_operating_hours_kh: string;
    footer_operating_hours_en: string;
    footer_facebook: string;
    footer_instagram: string;
    footer_twitter: string;
    footer_copyright: string;
}

type ConfigType = 'profile' | 'hero' | 'payment' | 'receipt' | 'footer' | 'backup';

const COLOR_PRESETS = [
    { label: 'Sky Blue', value: '#0284c7' },
    { label: 'Emerald Green', value: '#059669' },
    { label: 'Indigo Purple', value: '#4f46e5' },
    { label: 'Rose Red', value: '#e11d48' },
    { label: 'Slate Dark', value: '#0f172a' },
];

export default function AdminSettingsPage() {
    const { language } = useLanguage();
    const { user, setUser } = useAuth();
    const isKh = language === 'kh';
    const t = translations[language];

    // Config Type Tabs
    const [activeTab, setActiveTab] = useState<ConfigType>('profile');

    const [settings, setSettings] = useState<SystemSettings>({
        system_name: '',
        logo_url: '/logo/PteasYeung.png',
        receipt_logo_url: '/logo/PteasYeung.png',
        admin_email: '',
        admin_name: '',
        admin_phone: '',
        admin_profile_picture: '',
        hero_title: '',
        hero_subtitle: '',
        hero_background: '',
        footer_description_kh: '',
        footer_description_en: '',
        footer_hotline: '',
        footer_email: '',
        footer_telegram: '',
        footer_address_kh: '',
        footer_address_en: '',
        footer_operating_hours_kh: '',
        footer_operating_hours_en: '',
        footer_facebook: '',
        footer_instagram: '',
        footer_twitter: '',
        footer_copyright: '',
        receipt_title_kh: 'បង្កាន់ដៃទទួលប្រាក់ / វិក្កយបត្រ',
        receipt_title_en: 'OFFICIAL RECEIPT / INVOICE',
        receipt_subtitle_kh: 'ប្រព័ន្ធគ្រប់គ្រងបន្ទប់ជួល ផ្ទះយើង',
        receipt_subtitle_en: 'Pteas Yeung Rental Platform',
        receipt_header_note: 'សូមអរគុណចំពោះការជឿទុកចិត្ត និងស្នាក់នៅជាមួយយើងខ្ញុំ',
        receipt_footer_note_kh: 'សូមអរគុណសម្រាប់ការទូទាត់ប្រាក់ទាន់ពេលវេលា!',
        receipt_footer_note_en: 'Thank you for your prompt payment!',
        receipt_terms_kh: "១. សូមរក្សាទុកបង្កាន់ដៃនេះជាភស្តុតាងនៃការទូទាត់។\n២. ប្រាក់កក់មិនអាចដកវិញបានទេ ប្រសិនបើចាកចេញមុនកាលកំណត់នៃកិច្ចសន្យា។\n៣. ការទូទាត់យឺតយ៉ាវអាចនឹងមានការផាកពិន័យតាមការព្រមព្រៀង។",
        receipt_terms_en: "1. Please retain this receipt as proof of payment.\n2. Security deposits are non-refundable in the event of early termination.\n3. Late payments may incur standard agreed penalties.",
        receipt_currency_symbol: '$',
        receipt_khr_exchange_rate: 4100,
        receipt_show_water_electricity: true,
        receipt_show_signatures: true,
        receipt_accent_color: '#0284c7',
        admin_bank_name: 'ABA Bank',
        admin_bank_account_name: 'PTEAS YEUNG PLATFORM',
        admin_bank_account_number: '001 234 567',
        admin_bank_qr_url: '',
        admin_hotline_secondary: '+855 98 765 432',
        admin_payment_notes_kh: 'សូមផ្ញើវិក្កយបត្រ ឬរូបភាពផ្ទេរប្រាក់មកកាន់ Telegram ផ្លូវការរបស់រដ្ឋបាល ដើម្បីផ្ទៀងផ្ទាត់ និងបើកដំណើរការគណនីភ្លាមៗ។',
        admin_payment_notes_en: 'Please send the transfer receipt or screenshot to our official Admin Telegram for instant verification and account activation.',
    });

    // Image Upload States
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('/logo/PteasYeung.png');

    const [receiptLogoFile, setReceiptLogoFile] = useState<File | null>(null);
    const [receiptLogoPreview, setReceiptLogoPreview] = useState<string>('/logo/PteasYeung.png');

    const [bankQrFile, setBankQrFile] = useState<File | null>(null);
    const [bankQrPreview, setBankQrPreview] = useState<string>('');

    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string>('');

    const [loading, setLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    
    // Live Preview Modals
    const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState<boolean>(false);
    const [isPendingPreviewOpen, setIsPendingPreviewOpen] = useState<boolean>(false);

    // Backup states
    const [backupStats, setBackupStats] = useState<any>(null);
    const [loadingBackupStats, setLoadingBackupStats] = useState<boolean>(false);
    const [exportingAdminBackup, setExportingAdminBackup] = useState<string | null>(null);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const receiptLogoInputRef = useRef<HTMLInputElement>(null);
    const bankQrInputRef = useRef<HTMLInputElement>(null);
    const profileImageInputRef = useRef<HTMLInputElement>(null);

    // Fetch Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/settings');
                if (res.data) {
                    setSettings(prev => ({
                        ...prev,
                        ...res.data,
                    }));
                    if (res.data.logo_url) {
                        setLogoPreview(getOptimizedImageUrl(res.data.logo_url) || res.data.logo_url);
                    }
                    if (res.data.receipt_logo_url) {
                        setReceiptLogoPreview(getOptimizedImageUrl(res.data.receipt_logo_url) || res.data.receipt_logo_url);
                    }
                    if (res.data.admin_bank_qr_url) {
                        setBankQrPreview(getOptimizedImageUrl(res.data.admin_bank_qr_url) || res.data.admin_bank_qr_url);
                    }
                    if (res.data.admin_profile_picture || user?.profile_picture) {
                        const pic = res.data.admin_profile_picture || user?.profile_picture;
                        setProfileImagePreview(getOptimizedImageUrl(pic) || pic);
                    }
                    if (user && !res.data.admin_name) {
                        setSettings(prev => ({
                            ...prev,
                            admin_name: user.name,
                            admin_phone: user.phone || prev.admin_phone,
                        }));
                    }
                }
            } catch (err) {
                console.error("Failed to load settings", err);
                toast.error(isKh ? 'មិនអាចទាញយកការកំណត់បានទេ' : 'Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [user, isKh]);

    // Fetch Backup Stats on tab activation
    useEffect(() => {
        if (activeTab === 'backup' && !backupStats) {
            setLoadingBackupStats(true);
            api.get('/admin/backup/stats')
                .then(res => {
                    if (res.data?.success) {
                        setBackupStats(res.data.data);
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch backup stats', err);
                })
                .finally(() => setLoadingBackupStats(false));
        }
    }, [activeTab]);

    const handleDownloadAdminBackup = async (type: string = 'all') => {
        setExportingAdminBackup(type);
        try {
            const res = await api.get(`/admin/backup/export?type=${type}`, {
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pteasyeung_system_backup_${type}_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success(isKh ? 'បានទាញយកទិន្នន័យបម្រុងទុកប្រព័ន្ធដោយជោគជ័យ!' : 'System backup downloaded successfully!');
        } catch (err) {
            toast.error(isKh ? 'បរាជ័យក្នុងការទាញយកទិន្នន័យបម្រុងទុក!' : 'Failed to download system backup!');
        } finally {
            setExportingAdminBackup(null);
        }
    };

    // Handle Input Changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setSettings(prev => ({ ...prev, [name]: checked }));
        } else {
            setSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    // Main Logo File Selection
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error(isKh ? 'ទំហំរូបភាពមិនអាចលើសពី 2MB ឡើយ!' : 'Logo size cannot exceed 2MB!');
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    // Receipt Logo File Selection
    const handleReceiptLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error(isKh ? 'ទំហំរូបភាពមិនអាចលើសពី 2MB ឡើយ!' : 'Receipt logo size cannot exceed 2MB!');
                return;
            }
            setReceiptLogoFile(file);
            setReceiptLogoPreview(URL.createObjectURL(file));
        }
    };

    // Admin Bank QR Code File Selection
    const handleBankQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error(isKh ? 'ទំហំរូបភាពមិនអាចលើសពី 2MB ឡើយ!' : 'QR Code image size cannot exceed 2MB!');
                return;
            }
            setBankQrFile(file);
            setBankQrPreview(URL.createObjectURL(file));
        }
    };

    // Admin Profile Image Selection
    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error(isKh ? 'ទំហំរូបភាពមិនអាចលើសពី 2MB ឡើយ!' : 'Profile image size cannot exceed 2MB!');
                return;
            }
            setProfileImageFile(file);
            setProfileImagePreview(URL.createObjectURL(file));
        }
    };

    // Submit Handler
    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const formData = new FormData();
            if (logoFile) formData.append('logo', logoFile);
            if (receiptLogoFile) formData.append('receipt_logo', receiptLogoFile);
            if (bankQrFile) formData.append('admin_bank_qr', bankQrFile);
            if (profileImageFile) formData.append('admin_profile_picture', profileImageFile);

            // Keys to skip appending as text strings
            const skipKeys = [
                'id', 'created_at', 'updated_at',
                'logo', 'receipt_logo', 'admin_bank_qr',
                'admin_profile_picture'
            ];

            Object.entries(settings).forEach(([key, val]) => {
                if (skipKeys.includes(key)) return;
                if (val !== null && val !== undefined) {
                    if (typeof val === 'boolean') {
                        formData.append(key, val ? '1' : '0');
                    } else {
                        formData.append(key, String(val));
                    }
                }
            });
            formData.append('_method', 'PUT');

            const res = await api.post('/admin/settings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.data) {
                const data = res.data.data;
                setSettings(prev => ({ ...prev, ...data }));
                if (data.logo_url) setLogoPreview(getOptimizedImageUrl(data.logo_url) || data.logo_url);
                if (data.receipt_logo_url) setReceiptLogoPreview(getOptimizedImageUrl(data.receipt_logo_url) || data.receipt_logo_url);
                if (data.admin_bank_qr_url) setBankQrPreview(getOptimizedImageUrl(data.admin_bank_qr_url) || data.admin_bank_qr_url);
                if (data.admin_profile_picture) {
                    setProfileImagePreview(getOptimizedImageUrl(data.admin_profile_picture) || data.admin_profile_picture);
                    if (user) {
                        const updatedUser = { ...user, profile_picture: data.admin_profile_picture, name: data.admin_name || user.name };
                        setUser(updatedUser);
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                    }
                }
            }

            toast.success(isKh ? 'រក្សាទុកការកំណត់ជោគជ័យ!' : 'Configuration updated successfully!');
            window.dispatchEvent(new Event('settingsUpdated'));
        } catch (error: any) {
            console.error("Error saving settings:", error);
            const errData = error.response?.data;
            let errorMsg = errData?.message || (isKh ? 'សូមព្យាយាមម្តងទៀត' : 'Please try again');
            if (errData?.errors) {
                const detailedErrors = Object.values(errData.errors).flat().join(', ');
                if (detailedErrors) errorMsg = `${errorMsg}: ${detailedErrors}`;
            }
            toast.error(`${isKh ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Error saving'}: ${errorMsg}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Sample mock invoice for Live Receipt Preview
    const sampleInvoice: ReceiptInvoice = {
        id: 108,
        invoice_number: 'INV-2026-00108',
        booking_id: 12,
        electricity_start_unit: 1420,
        electricity_end_unit: 1545,
        water_unit: 14,
        total_amount: 198.50,
        payment_status: 'paid',
        due_date: '2026-09-25',
        paid_at: '2026-09-10',
        created_at: '2026-09-10',
        booking: {
            id: 12,
            room: {
                id: 5,
                room_number: '302',
                price: 150.00,
                type: 'Deluxe Studio',
                property: {
                    id: 1,
                    title: 'អគារ ផ្ទះយើង សែនសុខ (Pteas Yeung Sen Sok)',
                    address: 'ផ្លូវ ១៩៨៦, សង្កាត់ភ្នំពេញថ្មី, ខណ្ឌសែនសុខ',
                    city: 'រាជធានីភ្នំពេញ',
                    owner: {
                        id: 2,
                        name: 'លោក សុខ វិបុល (Sok Vibul)',
                        phone: '012 888 999',
                        email: 'vibul.owner@pteasyeung.com'
                    }
                }
            },
            tenant: {
                id: 8,
                name: 'កញ្ញា ចាន់ ធីតា (Chan Thida)',
                phone: '098 765 432',
                email: 'thida.tenant@gmail.com'
            },
            owner: {
                id: 2,
                name: 'លោក សុខ វិបុល (Sok Vibul)',
                phone: '012 888 999',
                email: 'vibul.owner@pteasyeung.com'
            }
        }
    };

    const configTabs = [
        { id: 'profile', label: isKh ? 'គណនី Admin & ប្រព័ន្ធ' : 'Admin Profile & System', icon: User },
        { id: 'hero', label: isKh ? 'ផ្នែក Hero & ស្វែងរក' : 'Hero & Search Banner', icon: Sparkles },
        { id: 'payment', label: isKh ? 'វិធីសាស្ត្រទូទាត់ប្រាក់' : 'Payment Methods (Admin)', icon: CreditCard },
        { id: 'receipt', label: isKh ? 'ទម្រង់វិក្កយបត្រ / បង្កាន់ដៃ' : 'Receipt & Invoice Template', icon: Receipt },
        { id: 'footer', label: isKh ? 'បាតទំព័រ & បណ្តាញសង្គម' : 'Footer & Socials', icon: Globe },
        { id: 'backup', label: isKh ? 'ទិន្នន័យបម្រុង & សុវត្ថិភាព' : 'Backup & Data Export', icon: Database },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full">
                <Loader2 className="w-9 h-9 text-indigo-600 animate-spin mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{isKh ? 'កំពុងទាញយកការកំណត់...' : 'Loading settings...'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            <Toaster position="top-right" reverseOrder={false} />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
                        {isKh ? 'ការកំណត់ប្រព័ន្ធទូទៅ' : 'Platform System Settings'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isKh 
                            ? 'កំណត់រូបតំណាង Admin, ព័ត៌មានទូទាត់ប្រាក់, Hero, គំរូវិក្កយបត្រ និងបាតទំព័រតាមប្រភេទ' 
                            : 'Configure Admin profile avatar, payment methods, Hero section, receipt templates, and footer by type'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {activeTab === 'payment' && (
                        <button
                            type="button"
                            onClick={() => setIsPendingPreviewOpen(true)}
                            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-amber-500/20"
                        >
                            <Eye size={14} />
                            <span>{isKh ? 'មើលគំរូ Pending Modal' : 'Preview Pending Modal'}</span>
                        </button>
                    )}

                    {activeTab === 'receipt' && (
                        <button
                            type="button"
                            onClick={() => setIsReceiptPreviewOpen(true)}
                            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-sky-500/20"
                        >
                            <Eye size={14} />
                            <span>{isKh ? 'មើលគំរូវិក្កយបត្រ (Preview)' : 'Preview Receipt Template'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Config Type Tab Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
                {configTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as ConfigType)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                            }`}
                        >
                            <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">

                {/* ========================================================================= */}
                {/* 1. ADMIN PROFILE & SYSTEM TAB */}
                {/* ========================================================================= */}
                {activeTab === 'profile' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Admin Profile Image & Personal Info Card */}
                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {isKh ? 'រូបភាពគណនី Admin និងព័ត៌មានផ្ទាល់ខ្លួន' : 'Admin Profile Picture & Account Details'}
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {isKh ? 'កំណត់រូបភាពតំណាង Profile និងទិន្នន័យទំនាក់ទំនងរបស់ Admin' : 'Upload custom administrator avatar and manage system admin identity'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
                                {/* Profile Picture Preview with Camera Badge */}
                                <div className="relative group">
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 shadow-inner">
                                        {profileImagePreview ? (
                                            <img
                                                src={profileImagePreview}
                                                alt="Admin Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User size={48} className="text-slate-400" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => profileImageInputRef.current?.click()}
                                        className="absolute bottom-1 right-1 p-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg transition-transform group-hover:scale-105"
                                        title={isKh ? 'ជ្រើសរើសរូបថត' : 'Change Avatar'}
                                    >
                                        <Camera size={16} />
                                    </button>
                                    <input
                                        type="file"
                                        ref={profileImageInputRef}
                                        onChange={handleProfileImageChange}
                                        accept="image/jpeg,image/png,image/jpg,image/webp"
                                        className="hidden"
                                    />
                                </div>

                                <div className="flex-1 space-y-4 w-full text-xs">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                                {isKh ? 'ឈ្មោះអ្នកគ្រប់គ្រង (Admin Name)' : 'Admin Full Name'}
                                            </label>
                                            <input
                                                type="text"
                                                name="admin_name"
                                                value={settings.admin_name || ''}
                                                onChange={handleChange}
                                                placeholder="e.g. Sopiram Jr"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                                {isKh ? 'លេខទូរស័ព្ទ Admin' : 'Admin Phone'}
                                            </label>
                                            <input
                                                type="text"
                                                name="admin_phone"
                                                value={settings.admin_phone || ''}
                                                onChange={handleChange}
                                                placeholder="e.g. 012 345 678"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            {isKh ? 'អ៊ីមែលរដ្ឋបាលផ្លូវការ (Admin Email)' : 'Official Admin Email'}
                                        </label>
                                        <input
                                            type="email"
                                            name="admin_email"
                                            value={settings.admin_email || ''}
                                            onChange={handleChange}
                                            placeholder="admin@system.com"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Branding Card */}
                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                    <Settings size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {isKh ? 'ព័ត៌មានម៉ាកសញ្ញាប្រព័ន្ធ (System Branding)' : 'System Branding & Main Logo'}
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {isKh ? 'ឈ្មោះប្រព័ន្ធ និងរូបសញ្ញាដែលបង្ហាញលើ Navbar & Footer' : 'Brand identity shown across the main site navigation and footer'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        {isKh ? 'ឈ្មោះប្រព័ន្ធ (System Name)' : 'System Name'}
                                    </label>
                                    <input
                                        type="text"
                                        name="system_name"
                                        value={settings.system_name}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                    />
                                </div>

                                {/* Logo Upload */}
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        {isKh ? 'រូបសញ្ញាប្រព័ន្ធ (Main Logo)' : 'Main Brand Logo'}
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-2 shrink-0">
                                            <img
                                                src={logoPreview}
                                                alt="Logo Preview"
                                                className="max-h-full max-w-full object-contain"
                                                onError={(e) => { (e.target as HTMLImageElement).src = '/logo/PteasYeung.png'; }}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5"
                                            >
                                                <Upload size={14} />
                                                <span>{isKh ? 'ជ្រើសរើសរូប Logo' : 'Upload Logo'}</span>
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleLogoChange}
                                                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                                className="hidden"
                                            />
                                            <p className="text-[10px] text-slate-400">PNG, SVG, JPG (Max 2MB)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 2. HERO SECTION TAB */}
                {/* ========================================================================= */}
                {activeTab === 'hero' && (
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-200">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {isKh ? 'ផ្នែកក្បាលទំព័រដើម (Hero Section Settings)' : 'Hero Section & Search Banner'}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isKh ? 'កំណត់ពាក្យស្លោក ចំណងជើងធំ និងរូបភាពផ្ទៃខាងក្រោយលើទំព័រដើម' : 'Custom banner headings, subtitles, and background imagery'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ចំណងជើងធំ Hero Title' : 'Hero Main Title'}
                                </label>
                                <input
                                    type="text"
                                    name="hero_title"
                                    value={settings.hero_title}
                                    onChange={handleChange}
                                    placeholder="e.g. ដែលសក្ដិសមសម្រាប់អ្នក"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ចំណងជើងរង Hero Subtitle' : 'Hero Subtitle / Description'}
                                </label>
                                <textarea
                                    name="hero_subtitle"
                                    rows={3}
                                    value={settings.hero_subtitle}
                                    onChange={handleChange}
                                    placeholder="e.g. ស្វែងរកបន្ទប់ជួលបានរហ័ស ទាន់ចិត្ត..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition resize-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'តំណភ្ជាប់រូបភាពផ្ទៃខាងក្រោយ (Hero Background Image URL)' : 'Hero Background Image URL'}
                                </label>
                                <input
                                    type="text"
                                    name="hero_background"
                                    value={settings.hero_background}
                                    onChange={handleChange}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            {/* Hero Preview Card */}
                            {settings.hero_background && (
                                <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative h-40">
                                    <img
                                        src={settings.hero_background}
                                        alt="Hero Background Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 text-center">
                                        <p className="text-white font-black text-lg drop-shadow-md">
                                            {settings.hero_title || 'Hero Banner Preview'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 3. PAYMENT METHODS TAB (ADMIN PAYMENT & PENDING ACCOUNT) */}
                {/* ========================================================================= */}
                {activeTab === 'payment' && (
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-200">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {isKh ? 'វិធីសាស្ត្រទូទាត់ប្រាក់ & គណនីរដ្ឋបាល (Admin Payment & Verification)' : 'Admin Bank Payment Details & Pending Accounts'}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isKh 
                                        ? 'ព័ត៌មានទាំងនេះនឹងបង្ហាញលើផ្ទាំង Pending Confirmation សម្រាប់ម្ចាស់ផ្ទះដែលទើបចុះឈ្មោះថ្មី' 
                                        : 'These bank details and QR code will be displayed on the Account Pending modal for new owner registrations'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                            {/* Bank Name */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ឈ្មោះធនាគារ (Bank Name)' : 'Bank Name'}
                                </label>
                                <input
                                    type="text"
                                    name="admin_bank_name"
                                    value={settings.admin_bank_name || ''}
                                    onChange={handleChange}
                                    placeholder="e.g. ABA Bank / ACLEDA / Wing"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            {/* Account Name */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ឈ្មោះម្ចាស់គណនី (Account Name)' : 'Bank Account Holder Name'}
                                </label>
                                <input
                                    type="text"
                                    name="admin_bank_account_name"
                                    value={settings.admin_bank_account_name || ''}
                                    onChange={handleChange}
                                    placeholder="e.g. PTEAS YEUNG PLATFORM"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            {/* Account Number */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'លេខគណនីធនាគារ (Account Number)' : 'Bank Account Number'}
                                </label>
                                <input
                                    type="text"
                                    name="admin_bank_account_number"
                                    value={settings.admin_bank_account_number || ''}
                                    onChange={handleChange}
                                    placeholder="e.g. 001 234 567"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>

                        {/* QR Code Upload & Hotlines */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
                            {/* QR Code Upload Card */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                                <label className="block font-bold text-slate-700 dark:text-slate-300">
                                    {isKh ? 'រូបភាព QR Code ទូទាត់ប្រាក់ (Admin KHQR / ABA)' : 'Upload Admin KHQR Payment QR Code'}
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                                        {bankQrPreview ? (
                                            <img
                                                src={bankQrPreview}
                                                alt="Bank QR Preview"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <QrCode size={36} className="text-slate-300" />
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <button
                                            type="button"
                                            onClick={() => bankQrInputRef.current?.click()}
                                            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Upload size={14} />
                                            <span>{isKh ? 'ជ្រើសរើស QR Code' : 'Upload QR Image'}</span>
                                        </button>
                                        <input
                                            type="file"
                                            ref={bankQrInputRef}
                                            onChange={handleBankQrChange}
                                            accept="image/png,image/jpeg,image/webp"
                                            className="hidden"
                                        />
                                        <p className="text-[10px] text-slate-400">
                                            {isKh ? 'រូប KHQR របស់ ABA ឬ Bakong (Max 2MB)' : 'KHQR / Bakong / ABA QR image (Max 2MB)'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Hotline & Verification Hotline */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        {isKh ? 'លេខទូរស័ព្ទរដ្ឋបាលទី ២ (Secondary Admin Hotline)' : 'Secondary Admin Hotline'}
                                    </label>
                                    <input
                                        type="text"
                                        name="admin_hotline_secondary"
                                        value={settings.admin_hotline_secondary || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. +855 98 765 432"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                    💡 {isKh ? 'លេខទូរស័ព្ទចម្បងនឹងប្រើប្រាស់ Hotline ក្នុង Footer ដោយស្វ័យប្រវត្តិ។' : 'Primary hotline uses the general support hotline from Footer settings.'}
                                </p>
                            </div>
                        </div>

                        {/* Payment Instructions / Notes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ការណែនាំការបង់ប្រាក់ (ភាសាខ្មែរ)' : 'Payment Instructions (Khmer)'}
                                </label>
                                <textarea
                                    name="admin_payment_notes_kh"
                                    rows={3}
                                    value={settings.admin_payment_notes_kh || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition resize-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ការណែនាំការបង់ប្រាក់ (English)' : 'Payment Instructions (English)'}
                                </label>
                                <textarea
                                    name="admin_payment_notes_en"
                                    rows={3}
                                    value={settings.admin_payment_notes_en || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition resize-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 4. RECEIPT & INVOICE TAB */}
                {/* ========================================================================= */}
                {activeTab === 'receipt' && (
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 animate-in fade-in duration-200">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                                <Receipt size={20} />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {isKh ? 'ការកំណត់ទម្រង់វិក្កយបត្រ & បង្កាន់ដៃទទួលប្រាក់' : 'Receipt & Invoice Customization'}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isKh ? 'កំណត់រូបសញ្ញា Logo, ចំណងជើង, លក្ខខណ្ឌ និងពណ៌នៅលើបង្កាន់ដៃ' : 'Customize receipt branding, titles, notes, and terms & conditions'}
                                </p>
                            </div>
                        </div>

                        {/* Receipt Logo & Accent Color */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                            {/* Receipt Logo Upload */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                                <label className="block font-bold text-slate-700 dark:text-slate-300">
                                    {isKh ? 'រូបសញ្ញា Logo លើវិក្កយបត្រ' : 'Receipt Official Logo'}
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                                        <img
                                            src={receiptLogoPreview}
                                            alt="Receipt Logo Preview"
                                            className="max-h-full max-w-full object-contain"
                                            onError={(e) => { (e.target as HTMLImageElement).src = '/logo/PteasYeung.png'; }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <button
                                            type="button"
                                            onClick={() => receiptLogoInputRef.current?.click()}
                                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Upload size={14} />
                                            <span>{isKh ? 'ជ្រើសរើស Logo វិក្កយបត្រ' : 'Upload Receipt Logo'}</span>
                                        </button>
                                        <input
                                            type="file"
                                            ref={receiptLogoInputRef}
                                            onChange={handleReceiptLogoChange}
                                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                            className="hidden"
                                        />
                                        <p className="text-[10px] text-slate-400">PNG, SVG, JPG (Max 2MB)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Accent Color Palette */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                                <label className="block font-bold text-slate-700 dark:text-slate-300">
                                    {isKh ? 'ពណ៌លេចធ្លោលើវិក្កយបត្រ (Accent Color)' : 'Receipt Accent Color'}
                                </label>
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    {COLOR_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() => setSettings(prev => ({ ...prev, receipt_accent_color: preset.value }))}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                                                settings.receipt_accent_color === preset.value
                                                    ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/20 text-slate-900 dark:text-white'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.value }} />
                                            <span>{preset.label}</span>
                                            {settings.receipt_accent_color === preset.value && <Check size={12} className="text-indigo-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Titles & Subtitles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ចំណងជើងវិក្កយបត្រ (ភាសាខ្មែរ)' : 'Receipt Title (Khmer)'}
                                </label>
                                <input
                                    type="text"
                                    name="receipt_title_kh"
                                    value={settings.receipt_title_kh || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ចំណងជើងវិក្កយបត្រ (English)' : 'Receipt Title (English)'}
                                </label>
                                <input
                                    type="text"
                                    name="receipt_title_en"
                                    value={settings.receipt_title_en || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ចំណងជើងរង (ភាសាខ្មែរ)' : 'Subtitle (Khmer)'}
                                </label>
                                <input
                                    type="text"
                                    name="receipt_subtitle_kh"
                                    value={settings.receipt_subtitle_kh || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ចំណងជើងរង (English)' : 'Subtitle (English)'}
                                </label>
                                <input
                                    type="text"
                                    name="receipt_subtitle_en"
                                    value={settings.receipt_subtitle_en || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>

                        {/* Currency & Exchange Rate */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'និមិត្តសញ្ញារូបិយប័ណ្ណ' : 'Currency Symbol'}
                                </label>
                                <input
                                    type="text"
                                    name="receipt_currency_symbol"
                                    value={settings.receipt_currency_symbol || '$'}
                                    onChange={handleChange}
                                    placeholder="$"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'អត្រាប្តូរប្រាក់រៀល (1 USD = ? KHR)' : 'Exchange Rate (1 USD to KHR)'}
                                </label>
                                <input
                                    type="number"
                                    name="receipt_khr_exchange_rate"
                                    value={settings.receipt_khr_exchange_rate || 4100}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>

                        {/* Notes & Terms */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'លក្ខខណ្ឌវិក្កយបត្រ (ភាសាខ្មែរ)' : 'Terms & Conditions (Khmer)'}
                                </label>
                                <textarea
                                    name="receipt_terms_kh"
                                    rows={3}
                                    value={settings.receipt_terms_kh || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition resize-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'លក្ខខណ្ឌវិក្កយបត្រ (English)' : 'Terms & Conditions (English)'}
                                </label>
                                <textarea
                                    name="receipt_terms_en"
                                    rows={3}
                                    value={settings.receipt_terms_en || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition resize-none"
                                />
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-wrap items-center gap-6 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    name="receipt_show_water_electricity"
                                    checked={settings.receipt_show_water_electricity ?? true}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{isKh ? 'បង្ហាញការគណនាកុងទ័រភ្លើង-ទឹក' : 'Show Electricity & Water Calculation'}</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    name="receipt_show_signatures"
                                    checked={settings.receipt_show_signatures ?? true}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{isKh ? 'បង្ហាញកន្លែងចុះហត្ថលេខា' : 'Show Landlord / Tenant Signature Lines'}</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 5. FOOTER & SOCIALS TAB */}
                {/* ========================================================================= */}
                {activeTab === 'footer' && (
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-200">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                <Globe size={20} />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {isKh ? 'បាតទំព័រ & ព័ត៌មានទំនាក់ទំនង (Footer & Contacts)' : 'Footer, Social Media & Contacts'}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isKh ? 'កំណត់ព័ត៌មានជំនួយ ២៤/៧ ម៉ោងធ្វើការ និងបណ្តាញសង្គមក្នុង Footer' : 'Direct hotline, physical address, operating hours, and social channels'}
                                </p>
                            </div>
                        </div>

                        {/* Footer Descriptions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ការពិពណ៌នាសង្ខេប (ភាសាខ្មែរ)' : 'Platform Description (Khmer)'}
                                </label>
                                <textarea
                                    name="footer_description_kh"
                                    rows={3}
                                    value={settings.footer_description_kh || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition resize-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ការពិពណ៌នាសង្ខេប (English)' : 'Platform Description (English)'}
                                </label>
                                <textarea
                                    name="footer_description_en"
                                    rows={3}
                                    value={settings.footer_description_en || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition resize-none"
                                />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'លេខទូរស័ព្ទជំនួយ (Hotline)' : 'Primary Hotline'}
                                </label>
                                <input
                                    type="text"
                                    name="footer_hotline"
                                    value={settings.footer_hotline || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'អ៊ីមែលទំនាក់ទំនង' : 'Support Email'}
                                </label>
                                <input
                                    type="email"
                                    name="footer_email"
                                    value={settings.footer_email || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'Telegram ផ្លូវការ' : 'Official Telegram Link'}
                                </label>
                                <input
                                    type="text"
                                    name="footer_telegram"
                                    value={settings.footer_telegram || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>

                        {/* Addresses & Operating Hours */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'អាសយដ្ឋានការិយាល័យ (Khmer)' : 'Office Address (Khmer)'}
                                </label>
                                <input
                                    type="text"
                                    name="footer_address_kh"
                                    value={settings.footer_address_kh || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'អាសយដ្ឋានការិយាល័យ (English)' : 'Office Address (English)'}
                                </label>
                                <input
                                    type="text"
                                    name="footer_address_en"
                                    value={settings.footer_address_en || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ម៉ោងបម្រើការងារ (Khmer)' : 'Operating Hours (Khmer)'}
                                </label>
                                <input
                                    type="text"
                                    name="footer_operating_hours_kh"
                                    value={settings.footer_operating_hours_kh || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ម៉ោងបម្រើការងារ (English)' : 'Operating Hours (English)'}
                                </label>
                                <input
                                    type="text"
                                    name="footer_operating_hours_en"
                                    value={settings.footer_operating_hours_en || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Facebook URL</label>
                                <input
                                    type="text"
                                    name="footer_facebook"
                                    value={settings.footer_facebook || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Instagram URL</label>
                                <input
                                    type="text"
                                    name="footer_instagram"
                                    value={settings.footer_instagram || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Twitter / X URL</label>
                                <input
                                    type="text"
                                    name="footer_twitter"
                                    value={settings.footer_twitter || ''}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                {isKh ? 'សាររក្សាសិទ្ធិ (Copyright Text)' : 'Copyright Notice'}
                            </label>
                            <input
                                type="text"
                                name="footer_copyright"
                                value={settings.footer_copyright || ''}
                                onChange={handleChange}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                            />
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 6. SYSTEM BACKUP & DATA EXPORT TAB */}
                {/* ========================================================================= */}
                {activeTab === 'backup' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* System Database Telemetry Card */}
                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                        <Database size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                            {isKh ? 'ប្រព័ន្ធទិន្នន័យបម្រុងទុក & ការនាំចេញ (System Backup)' : 'System Database Backup & Disaster Recovery'}
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {isKh 
                                                ? 'ទាញយកទិន្នន័យប្រព័ន្ធទាំងមូលដើម្បីរក្សាសុវត្ថិភាព ឬស្តារទិន្នន័យឡើងវិញ' 
                                                : 'Generate comprehensive system snapshots for disaster recovery, auditing, and archival'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoadingBackupStats(true);
                                        api.get('/admin/backup/stats')
                                            .then(res => { if (res.data?.success) setBackupStats(res.data.data); })
                                            .finally(() => setLoadingBackupStats(false));
                                    }}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                >
                                    <RefreshCw size={13} className={loadingBackupStats ? 'animate-spin text-indigo-600' : ''} />
                                    <span>{isKh ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh Telemetry'}</span>
                                </button>
                            </div>

                            {/* Database KPI Counters */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isKh ? 'អ្នកប្រើប្រាស់' : 'Users'}</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                                        {loadingBackupStats ? '...' : (backupStats?.counts?.users ?? '—')}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isKh ? 'អចលនទ្រព្យ' : 'Properties'}</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                                        {loadingBackupStats ? '...' : (backupStats?.counts?.properties ?? '—')}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isKh ? 'បន្ទប់សរុប' : 'Rooms'}</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                                        {loadingBackupStats ? '...' : (backupStats?.counts?.rooms ?? '—')}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isKh ? 'ការកក់បន្ទប់' : 'Bookings'}</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                                        {loadingBackupStats ? '...' : (backupStats?.counts?.bookings ?? '—')}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isKh ? 'វិក្កយបត្រ' : 'Invoices'}</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                                        {loadingBackupStats ? '...' : (backupStats?.counts?.invoices ?? '—')}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isKh ? 'កំណត់ហេតុ' : 'Audit Logs'}</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                                        {loadingBackupStats ? '...' : (backupStats?.counts?.audit_logs ?? '—')}
                                    </p>
                                </div>
                            </div>

                            {/* Database Engine Info Badge */}
                            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-bold">
                                    <Server size={18} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>Database Engine: {backupStats?.database?.driver ? backupStats.database.driver.toUpperCase() : 'MySQL / MariaDB'} ({backupStats?.database?.name || 'pteas_yeung_db'})</span>
                                </div>
                                <div className="text-emerald-700 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-2">
                                    <span>PHP {backupStats?.environment?.php_version || '8.2+'}</span>
                                    <span>•</span>
                                    <span>Laravel {backupStats?.environment?.laravel_version || '11.x'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Export Action Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Complete Full Backup */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {isKh ? 'ទាញយកទិន្នន័យប្រព័ន្ធទាំងមូល (Full System Backup)' : 'Full System Snapshot'}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {isKh ? 'រួមបញ្ចូល Users, Properties, Rooms, Bookings, Invoices, Expenses, Settings & Logs' : 'All database entities, configurations, and active rental ledgers'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={!!exportingAdminBackup}
                                    onClick={() => handleDownloadAdminBackup('all')}
                                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition active:scale-95 disabled:opacity-50"
                                >
                                    {exportingAdminBackup === 'all' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                    <span>{isKh ? 'ទាញយក Full Backup JSON' : 'Export Full JSON Backup'}</span>
                                </button>
                            </div>

                            {/* Audit Logs Backup */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {isKh ? 'ទាញយកកំណត់ហេតុសុវត្ថិភាព (Audit Logs Backup)' : 'Security Telemetry & Audit Logs'}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {isKh ? 'នាំចេញរាល់កំណត់ហេតុចូលប្រើប្រាស់ ការផ្លាស់ប្តូរសិទ្ធិ និងព្រឹត្តិការណ៍រដ្ឋបាល' : 'Export incident history, authentication events, and administrative audit trails'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={!!exportingAdminBackup}
                                    onClick={() => handleDownloadAdminBackup('audit_logs')}
                                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition active:scale-95 disabled:opacity-50"
                                >
                                    {exportingAdminBackup === 'audit_logs' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                    <span>{isKh ? 'ទាញយក Audit Logs JSON' : 'Export Audit Logs JSON'}</span>
                                </button>
                            </div>

                            {/* Users & Landlords Backup */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {isKh ? 'ទិន្នន័យអ្នកប្រើប្រាស់ & ម្ចាស់ផ្ទះ (Users Directory)' : 'User Accounts & Landlords Directory'}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {isKh ? 'ព័ត៌មានគណនី Admin, ម្ចាស់ផ្ទះ, បុគ្គលិក និងអ្នកជួល' : 'Full roster of accounts, roles, statuses, and registration metadata'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={!!exportingAdminBackup}
                                    onClick={() => handleDownloadAdminBackup('users')}
                                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                                >
                                    {exportingAdminBackup === 'users' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                    <span>{isKh ? 'ទាញយក Users Directory JSON' : 'Export Users Directory'}</span>
                                </button>
                            </div>

                            {/* Invoices & Financials Backup */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {isKh ? 'វិក្កយបត្រ & ប្រវត្តិទូទាត់ប្រាក់ (Financial Records)' : 'Platform Invoices & Billing History'}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {isKh ? 'ទិន្នន័យវិក្កយបត្រថ្លៃបន្ទប់ ភ្លើង-ទឹក និងស្ថានភាពទូទាត់របស់អ្នកជួលទាំងអស់' : 'Comprehensive ledger of rent, utility units, and payment verification entries'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={!!exportingAdminBackup}
                                    onClick={() => handleDownloadAdminBackup('invoices')}
                                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                                >
                                    {exportingAdminBackup === 'invoices' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                    <span>{isKh ? 'ទាញយក Invoices Ledger JSON' : 'Export Invoices Ledger'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sticky Action Footer */}
                {activeTab !== 'backup' && (
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 disabled:opacity-60"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            <span>{isSaving ? (isKh ? 'កំពុងរក្សាទុក...' : 'Saving Changes...') : (isKh ? 'រក្សាទុកការកំណត់ទាំងអស់' : 'Save All Settings')}</span>
                        </button>
                    </div>
                )}
            </form>

            {/* Live Receipt Modal Preview */}
            <ReceiptModal
                isOpen={isReceiptPreviewOpen}
                onClose={() => setIsReceiptPreviewOpen(false)}
                invoice={sampleInvoice}
                customSettings={settings}
                lang={isKh ? 'kh' : 'en'}
            />

            {/* Live Pending Approval Modal Preview */}
            <PendingApprovalModal
                isOpen={isPendingPreviewOpen}
                onClose={() => setIsPendingPreviewOpen(false)}
                userName="លោក សុខ វិបុល (Sample Landlord)"
                userRole="owner"
                lang={isKh ? 'kh' : 'en'}
            />
        </div>
    );
}