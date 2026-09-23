'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import PendingApprovalModal from '@/app/components/PendingApprovalModal';
import DarkModeToggle from '@/app/components/DarkModeToggle';
import { 
    User, Mail, Lock, Phone, Eye, EyeOff, ArrowLeft, Loader2, 
    AlertCircle, CheckCircle2, Shield, Sparkles, Building2, UserCheck, Check
} from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [role, setRole] = useState<'tenant' | 'owner'>('tenant');
    const [agreedTerms, setAgreedTerms] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [registeredUser, setRegisteredUser] = useState<{ name: string; email: string; role: string } | null>(null);

    const [lang, setLang] = useState<'kh' | 'en'>('kh');

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);
    }, []);

    const handleLangToggle = (newLang: 'kh' | 'en') => {
        setLang(newLang);
        localStorage.setItem('lang', newLang);
    };

    // Calculate password strength (0 to 100)
    const getPasswordStrength = (pass: string) => {
        if (!pass) return 0;
        let score = 0;
        if (pass.length >= 6) score += 25;
        if (pass.length >= 8) score += 25;
        if (/[A-Z]/.test(pass)) score += 25;
        if (/[0-9!@#$%^&*]/.test(pass)) score += 25;
        return score;
    };

    const passStrength = getPasswordStrength(password);
    const passwordsMatch = password && passwordConfirmation && password === passwordConfirmation;
    const passwordsMismatch = password && passwordConfirmation && password !== passwordConfirmation;

    const t = {
        kh: {
            backHome: 'ត្រឡប់ទៅទំព័រដើម',
            title: 'បង្កើតគណនីថ្មី',
            subtitle: 'ជ្រើសរើសប្រភេទគណនី និងបំពេញព័ត៌មានដើម្បីចូលរួម',
            nameLabel: 'ឈ្មោះពេញ',
            namePlaceholder: 'ឧ. សុខ ចាន់ដារ៉ា',
            emailLabel: 'អាសយដ្ឋានអ៊ីមែល',
            emailPlaceholder: 'name@example.com',
            phoneLabel: 'លេខទូរស័ព្ទ',
            phonePlaceholder: '012 345 678',
            roleLabel: 'តួនាទីគណនីរបស់អ្នក',
            roleTenantTitle: 'អ្នកជួល (Tenant)',
            roleTenantDesc: 'ស្វែងរក និងកក់បន្ទប់ជួល តាមដានវិក្កយបត្រ',
            roleOwnerTitle: 'ម្ចាស់ផ្ទះ (Property Owner)',
            roleOwnerDesc: 'គ្រប់គ្រងអគារ បន្ទប់ បុគ្គលិក និងចំណូលជួល',
            passLabel: 'លេខកូដសម្ងាត់',
            passConfirmLabel: 'បញ្ជាក់លេខកូដសម្ងាត់',
            passPlaceholder: '••••••••',
            passStrengthWeak: 'ខ្សោយ',
            passStrengthFair: 'មធ្យម',
            passStrengthStrong: 'ខ្លាំង និងមានសុវត្ថិភាព',
            passMatch: 'លេខសម្ងាត់ត្រូវគ្នា',
            passMismatch: 'លេខសម្ងាត់មិនត្រូវគ្នាទេ',
            termsText: 'ខ្ញុំយល់ព្រមតាម',
            termsLink: 'លក្ខខណ្ឌប្រើប្រាស់',
            andText: 'និង',
            privacyLink: 'គោលការណ៍ឯកជនភាព',
            btnRegister: 'បង្កើតគណនីឥឡូវនេះ',
            btnRegistering: 'កំពុងចុះឈ្មោះ...',
            alreadyHaveAccount: 'មានគណនីរួចហើយមែនទេ?',
            loginHere: 'ចូលប្រើប្រាស់នៅទីនេះ',
            errEmpty: 'សូមបំពេញព័ត៌មានដែលចាំបាច់ឱ្យបានគ្រប់គ្រាន់!',
            errMismatch: 'លេខកូដសម្ងាត់ទាំងពីរមិនផ្ទៀងផ្ទាត់គ្នាទេ!',
            errTerms: 'សូមយល់ព្រមតាមលក្ខខណ្ឌប្រើប្រាស់ជាមុនសិន!',
            defaultErr: 'ការចុះឈ្មោះមិនបានសម្រេច! សូមព្យាយាមម្តងទៀត។',
            coverTitle: 'ចាប់ផ្ដើមបទពិសោធន៍ថ្មី \nក្នុងការគ្រប់គ្រងការរស់នៅ',
            coverDesc: 'ចូលរួមជាមួយសហគមន៍ "ផ្ទះយើង" ដើម្បីទទួលបានភាពងាយស្រួល សុវត្ថិភាព និងប្រសិទ្ធភាពខ្ពស់ ក្នុងការស្វែងរក ឬគ្រប់គ្រងបន្ទប់ជួលរបស់អ្នក។',
            copyright: 'រក្សាសិទ្ធិគ្រប់យ៉ាង។',
            googleBtn: 'ចុះឈ្មោះជាមួយ Google',
            features: [
                { title: 'ប្រព័ន្ធគ្រប់គ្រងឌីជីថល', desc: 'ងាយស្រួលទាំងអ្នកជួល និងម្ចាស់ផ្ទះ' },
                { title: 'បង់ប្រាក់រហ័សតាម KHQR', desc: 'គណនាថ្លៃទឹក ភ្លើង និងចេញវិក្កយបត្រស្វ័យប្រវត្តិ' },
                { title: 'ការការពារទិន្នន័យ', desc: 'ប្រព័ន្ធសុវត្ថិភាពកម្រិតខ្ពស់សម្រាប់អ្នកប្រើប្រាស់' }
            ]
        },
        en: {
            backHome: 'Back to Homepage',
            title: 'Create an Account',
            subtitle: 'Choose your account type and fill in your details to get started',
            nameLabel: 'Full Name',
            namePlaceholder: 'e.g. John Doe',
            emailLabel: 'Email Address',
            emailPlaceholder: 'name@example.com',
            phoneLabel: 'Phone Number',
            phonePlaceholder: '012 345 678',
            roleLabel: 'Select Your Account Type',
            roleTenantTitle: 'Tenant (Looking to rent)',
            roleTenantDesc: 'Find rooms, request bookings, and manage rental invoices',
            roleOwnerTitle: 'Property Owner (Landlord)',
            roleOwnerDesc: 'Manage buildings, rooms, staff members, and rental income',
            passLabel: 'Password',
            passConfirmLabel: 'Confirm Password',
            passPlaceholder: '••••••••',
            passStrengthWeak: 'Weak',
            passStrengthFair: 'Medium',
            passStrengthStrong: 'Strong & secure',
            passMatch: 'Passwords match',
            passMismatch: 'Passwords do not match',
            termsText: 'I agree to the',
            termsLink: 'Terms of Service',
            andText: 'and',
            privacyLink: 'Privacy Policy',
            btnRegister: 'Create Account Now',
            btnRegistering: 'Registering...',
            alreadyHaveAccount: 'Already have an account?',
            loginHere: 'Login here',
            errEmpty: 'Please fill in all required fields!',
            errMismatch: 'Passwords do not match!',
            errTerms: 'Please accept the Terms of Service to continue!',
            defaultErr: 'Registration failed! Please try again.',
            coverTitle: 'Start a New Experience \nin Modern Living Management',
            coverDesc: 'Join the PteasYeung community for ease, security, and high efficiency in finding or managing your rental properties in Cambodia.',
            copyright: 'All rights reserved.',
            googleBtn: 'Sign up with Google',
            features: [
                { title: 'Digital Property Hub', desc: 'Convenient for both tenants and property owners' },
                { title: 'KHQR Payments', desc: 'Track utilities, automated billing, and fast receipts' },
                { title: 'Protected & Verified', desc: 'High-security role separation and verified tenants' }
            ]
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name || !email || !password || !passwordConfirmation) {
            setError(t[lang].errEmpty);
            return;
        }

        if (password !== passwordConfirmation) {
            setError(t[lang].errMismatch);
            return;
        }

        if (!agreedTerms) {
            setError(t[lang].errTerms);
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/register', {
                name,
                email,
                phone: phone || null,
                password,
                password_confirmation: passwordConfirmation,
                role
            });

            setRegisteredUser({
                name,
                email,
                role: res.data?.user?.role || role,
            });
            setShowPendingModal(true);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || t[lang].defaultErr);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
    };

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-200">

            {/* 🖼️ Left Visual / Cover Section */}
            <div className="hidden lg:flex relative flex-1 w-0 bg-slate-950 overflow-hidden flex-col justify-between p-12 xl:p-16">
                <img
                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80"
                    alt="PteasYeung Register Cover"
                    className="absolute inset-0 h-full w-full object-cover opacity-35 brightness-50 scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950/60 to-slate-950/80"></div>

                {/* Top Logo */}
                <div className="relative z-10 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3.5 group">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-lg group-hover:scale-105 transition-transform">
                            <img
                                src="/logo/PteasYeung.png"
                                alt="PteasYeung"
                                className="h-10 w-auto object-contain drop-shadow"
                            />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-white tracking-tight block leading-tight">ផ្ទះយើង</span>
                            <span className="text-[11px] font-bold text-indigo-300 tracking-wider uppercase">PteasYeung Platform</span>
                        </div>
                    </Link>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-indigo-200 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Join PteasYeung</span>
                    </div>
                </div>

                {/* Middle Content */}
                <div className="relative z-10 my-auto py-8">
                    <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4 drop-shadow-md whitespace-pre-line">
                        {t[lang].coverTitle}
                    </h2>
                    <p className="text-slate-300 text-base font-medium max-w-lg leading-relaxed drop-shadow-sm mb-8">
                        {t[lang].coverDesc}
                    </p>

                    {/* Feature Cards */}
                    <div className="space-y-4 max-w-md">
                        {t[lang].features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                                <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/20">
                                    {idx === 0 ? <Building2 className="w-4 h-4" /> : idx === 1 ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white leading-snug">{feat.title}</h4>
                                    <p className="text-xs text-slate-300 font-normal mt-0.5">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-medium pt-6 border-t border-white/10">
                    <p>© {new Date().getFullYear()} ផ្ទះយើង Platform. {t[lang].copyright}</p>
                    <div className="flex items-center gap-4 text-slate-400">
                        <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                        <span>•</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
                    </div>
                </div>
            </div>

            {/* 🚪 Register Form Section */}
            <div className="flex-1 flex flex-col justify-between py-10 px-4 sm:px-8 lg:px-16 xl:px-24 bg-white dark:bg-slate-900 relative overflow-y-auto">

                {/* Top Navigation & Language Switcher */}
                <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-6">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t[lang].backHome}</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {/* 🌓 Dark / Light Mode Toggle */}
                        <DarkModeToggle 
                            lang={lang} 
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                        />

                        {/* Language Switcher Pill */}
                        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-200/60 dark:border-slate-700/60">
                            <button
                                type="button"
                                onClick={() => handleLangToggle('kh')}
                                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${lang === 'kh' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
                            >
                                🇰🇭 ខ្មែរ
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLangToggle('en')}
                                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${lang === 'en' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
                            >
                                🇬🇧 EN
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Card */}
                <div className="w-full max-w-lg mx-auto my-auto py-2">
                    {/* Mobile Logo */}
                    <Link href="/" className="flex items-center gap-3 lg:hidden mb-6 justify-center group">
                        <img
                            src="/logo/PteasYeung.png"
                            alt="PteasYeung"
                            className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
                        />
                        <div>
                            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight block">ផ្ទះយើង</span>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">PteasYeung</span>
                        </div>
                    </Link>

                    <div className="mb-6 text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {t[lang].title}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                            {t[lang].subtitle}
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm rounded-2xl font-medium flex items-start gap-2.5 animate-shake">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
                            <div className="flex-1">{error}</div>
                            <button 
                                type="button" 
                                onClick={() => setError('')}
                                className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 text-sm font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* 🎯 Interactive Role Selector Cards */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-2 tracking-wider">
                                {t[lang].roleLabel}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Tenant Card */}
                                <div
                                    onClick={() => setRole('tenant')}
                                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                        role === 'tenant'
                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className={`p-2 rounded-xl ${role === 'tenant' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                            <User className="w-4 h-4" />
                                        </div>
                                        {role === 'tenant' && (
                                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                        {t[lang].roleTenantTitle}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-snug">
                                        {t[lang].roleTenantDesc}
                                    </p>
                                </div>

                                {/* Owner Card */}
                                <div
                                    onClick={() => setRole('owner')}
                                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                        role === 'owner'
                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className={`p-2 rounded-xl ${role === 'owner' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        {role === 'owner' && (
                                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                        {t[lang].roleOwnerTitle}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-snug">
                                        {t[lang].roleOwnerDesc}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">
                                {t[lang].nameLabel}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400"
                                    placeholder={t[lang].namePlaceholder}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Email & Phone Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">
                                    {t[lang].emailLabel}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400"
                                        placeholder={t[lang].emailPlaceholder}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">
                                    {t[lang].phoneLabel}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="tel"
                                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400"
                                        placeholder={t[lang].phonePlaceholder}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password & Confirm Password Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">
                                    {t[lang].passLabel}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="w-full pl-10 pr-10 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400"
                                        placeholder={t[lang].passPlaceholder}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                                        {t[lang].passConfirmLabel}
                                    </label>
                                    {passwordsMatch && (
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <Check className="w-3 h-3" /> {t[lang].passMatch}
                                        </span>
                                    )}
                                    {passwordsMismatch && (
                                        <span className="text-[10px] font-bold text-rose-500">
                                            {t[lang].passMismatch}
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPasswordConfirm ? 'text' : 'password'}
                                        required
                                        className={`w-full pl-10 pr-10 py-2.5 sm:py-3 border rounded-2xl text-sm bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 outline-none transition-all font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 ${
                                            passwordsMismatch 
                                                ? 'border-rose-400 focus:ring-rose-500/10 focus:border-rose-500' 
                                                : passwordsMatch 
                                                    ? 'border-emerald-400 focus:ring-emerald-500/10 focus:border-emerald-500' 
                                                    : 'border-slate-200 dark:border-slate-700/80 focus:ring-indigo-500/10 focus:border-indigo-500'
                                        }`}
                                        placeholder={t[lang].passPlaceholder}
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                                    >
                                        {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Password Strength Meter */}
                        {password && (
                            <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 space-y-1.5">
                                <div className="flex justify-between items-center text-[11px] font-semibold">
                                    <span className="text-slate-500 dark:text-slate-400">កម្រិតសុវត្ថិភាពលេខសម្ងាត់</span>
                                    <span className={
                                        passStrength <= 25 ? 'text-rose-500' :
                                        passStrength <= 50 ? 'text-amber-500' :
                                        'text-emerald-500'
                                    }>
                                        {passStrength <= 25 ? t[lang].passStrengthWeak :
                                         passStrength <= 50 ? t[lang].passStrengthFair :
                                         t[lang].passStrengthStrong}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-300 ${
                                            passStrength <= 25 ? 'bg-rose-500 w-1/4' :
                                            passStrength <= 50 ? 'bg-amber-500 w-2/4' :
                                            passStrength <= 75 ? 'bg-indigo-500 w-3/4' :
                                            'bg-emerald-500 w-full'
                                        }`}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Terms & Privacy Checkbox */}
                        <div className="pt-1">
                            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none leading-relaxed">
                                <input
                                    type="checkbox"
                                    checked={agreedTerms}
                                    onChange={(e) => setAgreedTerms(e.target.checked)}
                                    className="w-4 h-4 mt-0.5 rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer"
                                />
                                <span>
                                    {t[lang].termsText}{' '}
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer">{t[lang].termsLink}</span>{' '}
                                    {t[lang].andText}{' '}
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer">{t[lang].privacyLink}</span>
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !agreedTerms}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold py-3.5 rounded-2xl text-sm shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{t[lang].btnRegistering}</span>
                                </>
                            ) : (
                                <span>{t[lang].btnRegister}</span>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative my-3">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
                                    {lang === 'kh' ? 'ឬ' : 'Or'}
                                </span>
                            </div>
                        </div>

                        {/* Google Sign Up Button */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-2xl text-sm transition-all shadow-xs hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.99] cursor-pointer"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            <span>{t[lang].googleBtn}</span>
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="text-center mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {t[lang].alreadyHaveAccount}{' '}
                        <Link 
                            href="/login" 
                            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline ml-1 inline-flex items-center gap-1"
                        >
                            <span>{t[lang].loginHere}</span>
                            <span>→</span>
                        </Link>
                    </div>
                </div>

                {/* Mobile Bottom Footer */}
                <div className="lg:hidden text-center text-xs text-slate-400 font-medium pt-6">
                    © {new Date().getFullYear()} ផ្ទះយើង {t[lang].copyright}
                </div>
            </div>

            {/* Modal បង្ហាញការរង់ចាំការអនុម័ត និងទូទាត់ប្រាក់ */}
            <PendingApprovalModal
                isOpen={showPendingModal}
                onClose={() => setShowPendingModal(false)}
                userName={registeredUser?.name}
                userRole={registeredUser?.role}
                userEmail={registeredUser?.email}
                lang={lang}
            />
        </div>
    );
}