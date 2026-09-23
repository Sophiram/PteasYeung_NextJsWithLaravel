'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import PendingApprovalModal from '@/app/components/PendingApprovalModal';
import DarkModeToggle from '@/app/components/DarkModeToggle';
import { 
    Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, 
    AlertCircle, CheckCircle2, Shield, Sparkles, Building2
} from 'lucide-react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect'); 

    const { setUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [pendingUser, setPendingUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);
    const [lang, setLang] = useState<'kh' | 'en'>('kh');

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);

        const errorParam = searchParams.get('error');
        if (errorParam === 'google_auth_failed') {
            const msg = searchParams.get('msg');
            setError(msg ? `Google Login Error: ${decodeURIComponent(msg)}` : (savedLang === 'en' ? 'Google login failed! Please try again.' : 'ការចូលប្រើតាម Google បរាជ័យ! សូមព្យាយាមម្តងទៀត។'));
        } else if (errorParam === 'account_suspended') {
            setError(savedLang === 'en' ? 'Your account is suspended or pending approval!' : 'គណនីរបស់អ្នកត្រូវបានផ្អាក ឬកំពុងរង់ចាំការអនុម័ត!');
        } else if (errorParam === 'auth_failed') {
            setError(savedLang === 'en' ? 'Authentication failed! Please try again.' : 'ការផ្ទៀងផ្ទាត់បរាជ័យ! សូមចូលម្តងទៀត។');
        }
    }, [searchParams]);

    const handleLangToggle = (newLang: 'kh' | 'en') => {
        setLang(newLang);
        localStorage.setItem('lang', newLang);
    };

    const t = {
        kh: {
            backHome: 'ត្រឡប់ទៅទំព័រដើម',
            title: 'ស្វាគមន៍មកកាន់ប្រព័ន្ធ',
            subtitle: 'សូមបញ្ចូលគណនីរបស់អ្នកដើម្បីបន្តការគ្រប់គ្រង',
            email: 'អ៊ីមែល',
            emailPlaceholder: 'ឈ្មោះ@example.com',
            password: 'លេខកូដសម្ងាត់',
            passwordPlaceholder: 'បញ្ចូលលេខកូដសម្ងាត់',
            rememberMe: 'ចងចាំគណនីខ្ញុំ',
            forgot: 'ភ្លេចលេខកូដសម្ងាត់?',
            btn: 'ចូលប្រើប្រាស់',
            verifying: 'កំពុងផ្ទៀងផ្ទាត់...',
            noAccount: 'មិនទាន់មានគណនីមែនទេ?',
            register: 'បង្កើតគណនីថ្មីនៅទីនេះ',
            emptyErr: 'សូមបញ្ចូលអ៊ីមែល និងលេខកូដសម្ងាត់!',
            welcomeAgain: 'រីករាយដែលបានជួបអ្នក \nម្ដងទៀត!',
            coverDesc: 'ចូលប្រើប្រាស់គណនីរបស់អ្នក ដើម្បីបន្តការគ្រប់គ្រងបន្ទប់ ពិនិត្យមើលការកក់ និងតាមដានរាល់ប្រតិបត្តិការផ្សេងៗយ៉ាងងាយស្រួល។',
            footer: 'Platform. រក្សាសិទ្ធិគ្រប់យ៉ាង។',
            quickDemo: 'សាកល្បងចូលរហ័ស (Demo Accounts):',
            googleBtn: 'បន្តជាមួយ Google',
            features: [
                { title: 'គ្រប់គ្រងបន្ទប់ឆ្លាតវៃ', desc: 'ពិនិត្យមើលស្ថានភាព និងកក់បន្ទប់យ៉ាងរហ័ស' },
                { title: 'វិក្កយបត្រ & ការទូទាត់', desc: 'ប្រព័ន្ធទូទាត់ប្រាក់តាម QR Code ងាយស្រួល' },
                { title: 'សុវត្ថិភាពខ្ពស់', desc: 'ការពារទិន្នន័យផ្ទាល់ខ្លួន និងការផ្ទៀងផ្ទាត់ត្រឹមត្រូវ' },
            ]
        },
        en: {
            backHome: 'Back to Homepage',
            title: 'Welcome Back',
            subtitle: 'Please enter your credentials to access your account',
            email: 'Email Address',
            emailPlaceholder: 'name@example.com',
            password: 'Password',
            passwordPlaceholder: 'Enter your password',
            rememberMe: 'Remember me',
            forgot: 'Forgot Password?',
            btn: 'Sign In',
            verifying: 'Verifying...',
            noAccount: "Don't have an account?",
            register: 'Create a new account here',
            emptyErr: 'Please enter both email and password!',
            welcomeAgain: 'Welcome Back \nTo PteasYeung!',
            coverDesc: 'Access your account to continue managing rooms, tracking tenant bookings, and monitoring operations seamlessly.',
            footer: 'Platform. All rights reserved.',
            quickDemo: 'Quick Demo Access:',
            googleBtn: 'Continue with Google',
            features: [
                { title: 'Smart Room Management', desc: 'Check room statuses and manage bookings fast' },
                { title: 'Invoices & Payments', desc: 'Seamless QR code payments and automated billing' },
                { title: 'High Security', desc: 'Role-based protection and safe authentication' },
            ]
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError(t[lang].emptyErr);
            return;
        }

        setLoading(true);

        try {
            const data = await authService.login(email, password);
            const { user } = data;

            if (user) {
                setUser(user);

                if (redirectUrl) {
                    router.push(redirectUrl);
                    return;
                }
                
                const role = user.role?.toLowerCase();

                if (role === 'super_admin' || role === 'admin') {
                    router.push('/dashboard/admin');
                } else if (role === 'owner') {
                    router.push('/dashboard/owner');
                } else if (role === 'staff') {
                    router.push('/dashboard/staff');
                } else if (role === 'tenant') {
                    router.push('/dashboard/tenant');
                } else {
                    router.push('/');
                }
            }
        } catch (err: any) {
            console.error(err);
            const resData = err.response?.data;
            if (resData?.status === 'pending' || resData?.message?.includes('រង់ចាំការត្រួតពិនិត្យ')) {
                setPendingUser({
                    name: resData?.user?.name || email.split('@')[0],
                    email: resData?.user?.email || email,
                    role: resData?.user?.role || 'tenant',
                });
                setShowPendingModal(true);
            } else {
                setError(resData?.message || (lang === 'kh' ? 'ការចូលប្រព័ន្ធបរាជ័យ! សូមពិនិត្យមើលអ៊ីមែល ឬលេខសម្ងាត់ឡើងវិញ។' : 'Login failed! Please check your email or password.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
    };

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-200">

            {/* 🖼️ Left Visual / Branding Section */}
            <div className="hidden lg:flex relative flex-1 w-0 bg-slate-950 overflow-hidden flex-col justify-between p-12 xl:p-16">
                <img
                    src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80"
                    alt="PteasYeung Login Cover"
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
                        <span>v2.0 Smart Living</span>
                    </div>
                </div>

                {/* Middle Content & Highlights */}
                <div className="relative z-10 my-auto py-8">
                    <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4 drop-shadow-md whitespace-pre-line">
                        {t[lang].welcomeAgain}
                    </h2>
                    <p className="text-slate-300 text-base font-medium max-w-lg leading-relaxed drop-shadow-sm mb-8">
                        {t[lang].coverDesc}
                    </p>

                    {/* Features List */}
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

                {/* Bottom Footer info */}
                <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-medium pt-6 border-t border-white/10">
                    <p>© {new Date().getFullYear()} ផ្ទះយើង {t[lang].footer}</p>
                    <div className="flex items-center gap-4 text-slate-400">
                        <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                        <span>•</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
                    </div>
                </div>
            </div>

            {/* 🚪 Login Form Section */}
            <div className="flex-1 flex flex-col justify-between py-10 px-4 sm:px-8 lg:px-16 xl:px-24 bg-white dark:bg-slate-900 relative">

                {/* Top Navigation & Language Switcher */}
                <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
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

                {/* Main Card Content */}
                <div className="w-full max-w-md mx-auto my-auto">
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

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">
                                {t[lang].email}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400"
                                    placeholder={t[lang].emailPlaceholder}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                                    {t[lang].password}
                                </label>
                                <Link 
                                    href="/forgot-password" 
                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-all"
                                >
                                    {t[lang].forgot}
                                </Link>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full pl-10 pr-11 py-3 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400"
                                    placeholder={t[lang].passwordPlaceholder}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-600 dark:text-slate-400">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/30"
                                />
                                <span>{t[lang].rememberMe}</span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold py-3.5 rounded-2xl text-sm shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{t[lang].verifying}</span>
                                </>
                            ) : (
                                <span>{t[lang].btn}</span>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
                                    {lang === 'kh' ? 'ឬ' : 'Or'}
                                </span>
                            </div>
                        </div>

                        {/* Google Login Button */}
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

                    {/* Register Link */}
                    <div className="text-center mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {t[lang].noAccount}{' '}
                        <Link 
                            href="/register" 
                            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline ml-1 inline-flex items-center gap-1"
                        >
                            <span>{t[lang].register}</span>
                            <span>→</span>
                        </Link>
                    </div>
                </div>

                {/* Mobile Bottom Footer */}
                <div className="lg:hidden text-center text-xs text-slate-400 font-medium pt-6">
                    © {new Date().getFullYear()} ផ្ទះយើង {t[lang].footer}
                </div>
            </div>

            {/* Modal បង្ហាញការរង់ចាំការអនុម័ត និងទូទាត់ប្រាក់ */}
            <PendingApprovalModal
                isOpen={showPendingModal}
                onClose={() => setShowPendingModal(false)}
                userName={pendingUser?.name}
                userRole={pendingUser?.role}
                userEmail={pendingUser?.email}
                lang={lang}
            />
        </div>
    );
}

export default function LoginPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <LoginForm />
        </React.Suspense>
    );
}