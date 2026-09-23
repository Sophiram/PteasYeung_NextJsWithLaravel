'use client';

import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { 
    CalendarDays, FileText, LogOut, Home, User as UserIcon, 
    ExternalLink, Globe, LayoutDashboard, Menu, X, PanelLeft, 
    PanelLeftClose, ChevronDown, CheckCircle2, CreditCard 
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import DarkModeToggle from '../../components/DarkModeToggle';
import NotificationDropdown from '@/app/components/NotificationDropdown';
import ConfirmModal from '@/app/components/ConfirmModal';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';

import { useLanguage } from '@/context/LanguageContext';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { lang, toggleLanguage } = useLanguage();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else {
                const role = user.role?.toLowerCase();
                if (role !== 'tenant' && role !== 'user') {
                    toast.error(lang === 'en' ? 'Access denied!' : 'គ្មានសិទ្ធិចូលប្រើប្រាស់!');
                    router.push('/');
                }
            }
        }
    }, [user, loading, router, lang]);

    const t = {
        kh: {
            portal: 'ផ្ទាំងគ្រប់គ្រងអ្នកជួល',
            dashboard: 'ផ្ទាំងគ្រប់គ្រង',
            goHome: 'ទៅកាន់ទំព័រដើម',
            myBookings: 'ការកក់របស់ខ្ញុំ',
            myInvoices: 'ការទូទាត់ & វិក្កយបត្រ',
            myProfile: 'ប្រវត្តិរូបផ្ទាល់ខ្លួន',
            logout: 'ចាកចេញ',
            logoutConfirmTitle: 'បញ្ជាក់ការចាកចេញ',
            logoutConfirmMsg: 'តើអ្នកពិតជាចង់ចាកចេញពីគណនីអ្នកជួលមែនទេ?',
            cancel: 'បោះបង់',
            loggedInAs: 'បានចូលប្រើប្រាស់ជា៖',
        },
        en: {
            portal: 'Tenant Portal',
            dashboard: 'Dashboard',
            goHome: 'Go to Homepage',
            myBookings: 'My Bookings',
            myInvoices: 'Payments & Invoices',
            myProfile: 'My Profile',
            logout: 'Logout',
            logoutConfirmTitle: 'Confirm Logout',
            logoutConfirmMsg: 'Are you sure you want to log out from the tenant portal?',
            cancel: 'Cancel',
            loggedInAs: 'Logged in as:',
        }
    };

    const handleConfirmLogout = async () => {
        await authService.logout();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isActive = (path: string) => {
        if (path === '/dashboard/tenant') return pathname === '/dashboard/tenant';
        return pathname.startsWith(path);
    };

    const menuItems = [
        { name: t[lang].dashboard, path: '/dashboard/tenant', icon: LayoutDashboard },
        { name: t[lang].myBookings, path: '/dashboard/tenant/bookings', icon: CalendarDays },
        { name: t[lang].myInvoices, path: '/dashboard/tenant/invoices', icon: CreditCard },
        { name: t[lang].myProfile, path: '/dashboard/tenant/profile', icon: UserIcon },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
            <Toaster position="top-right" />

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 backdrop-blur-xs"
                    aria-hidden="true"
                />
            )}

            {/* Tenant Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white transform transition-all duration-300 ease-in-out md:static md:h-screen md:translate-x-0 border-r border-slate-800/80 flex flex-col overflow-hidden shadow-2xl md:shadow-none flex-shrink-0 ${
                    isSidebarOpen 
                        ? 'translate-x-0 w-64' 
                        : (isSidebarCollapsed ? '-translate-x-full md:translate-x-0 w-20' : '-translate-x-full md:translate-x-0 w-64')
                }`}
            >
                {/* Logo & Brand Header */}
                <div className={`sticky top-0 z-10 flex-shrink-0 bg-slate-900 dark:bg-slate-950 flex items-center px-4 py-3.5 border-b border-slate-800/80 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <Link href="/dashboard/tenant" className="flex items-center gap-3 hover:opacity-90 transition group" title={t[lang].portal}>
                        <img
                            src="/logo/PteasYeung.png"
                            alt="PteasYeung"
                            className={`${isSidebarCollapsed ? 'h-10' : 'h-12'} w-auto object-contain flex-shrink-0 group-hover:scale-105 transition-transform drop-shadow-sm`}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/logo/PteasYeung.png';
                            }}
                        />
                        {!isSidebarCollapsed && (
                            <div className="whitespace-nowrap transition-opacity duration-300">
                                <div className="flex items-center gap-1.5">
                                    <h1 className="font-black text-sm leading-none text-white tracking-tight">PteasYeung</h1>
                                    <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded font-bold uppercase">
                                        Tenant
                                    </span>
                                </div>
                                <p className="text-[10px] text-indigo-400 mt-0.5 font-medium">Rental Portal</p>
                            </div>
                        )}
                    </Link>
                    {!isSidebarCollapsed && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white flex-shrink-0"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Sidebar Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
                    {menuItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                title={isSidebarCollapsed ? item.name : undefined}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition duration-200 group ${
                                    isSidebarCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    active
                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold shadow-md shadow-indigo-950/40'
                                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'group-hover:text-indigo-400'}`} />
                                {!isSidebarCollapsed && (
                                    <>
                                        <span className="text-xs sm:text-sm whitespace-nowrap">{item.name}</span>
                                        {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 animate-pulse" />}
                                    </>
                                )}
                            </Link>
                        );
                    })}

                    {/* Quick link to Homepage */}
                    <div className="pt-2 border-t border-slate-800/60 my-2">
                        <Link
                            href="/"
                            title={isSidebarCollapsed ? t[lang].goHome : undefined}
                            className={`flex items-center gap-3 px-3.5 py-2 text-slate-400 hover:bg-slate-800/70 hover:text-white rounded-xl transition duration-200 text-xs sm:text-sm font-semibold ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                        >
                            <Home className="w-5 h-5 flex-shrink-0 text-indigo-400" />
                            {!isSidebarCollapsed && <span className="whitespace-nowrap">{t[lang].goHome}</span>}
                        </Link>
                    </div>
                </nav>

                {/* Sidebar Bottom Footer */}
                <div className="sticky bottom-0 flex-shrink-0 bg-slate-900 dark:bg-slate-950 p-3 border-t border-slate-800/80 space-y-2">
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        title={isSidebarCollapsed ? t[lang].logout : undefined}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-400 hover:bg-rose-600/20 hover:text-rose-400 rounded-xl transition duration-200 font-semibold text-xs sm:text-sm group ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0 transition-transform group-hover:-translate-x-0.5" />
                        {!isSidebarCollapsed && <span className="whitespace-nowrap">{t[lang].logout}</span>}
                    </button>
                    {user && !isSidebarCollapsed && (
                        <div className="px-3.5 py-2 text-xs text-slate-500 whitespace-nowrap bg-slate-950/40 rounded-xl border border-slate-800/50">
                            <p className="font-semibold text-slate-400 text-[11px] mb-0.5">{t[lang].loggedInAs}</p>
                            <p className="text-slate-300 truncate w-48 text-xs">{user.name || user.email}</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area with Scroll Panel */}
            <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
                {/* Sticky Top Header */}
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 shadow-xs flex-shrink-0 z-30 w-full">
                    <div className="h-[72px] px-4 md:px-8 flex items-center justify-between gap-4 w-full">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Mobile Hamburger Toggle */}
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-slate-600 dark:text-slate-400 flex-shrink-0"
                                aria-label="Open Sidebar"
                            >
                                <Menu size={20} />
                            </button>

                            {/* Desktop Sidebar Collapse Toggle */}
                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="hidden md:block p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-slate-500 dark:text-slate-400 flex-shrink-0"
                                title="Toggle Sidebar"
                            >
                                {isSidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                            </button>

                            <div className="hidden sm:flex items-center gap-2.5">
                                <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight truncate">
                                    {t[lang].portal}
                                </h2>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60">
                                    Tenant
                                </span>
                            </div>
                        </div>

                        <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {/* Homepage Link */}
                            <Link
                                href="/"
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title={t[lang].goHome}
                            >
                                <Home className="w-4 h-4 text-slate-400" />
                                <span>{t[lang].goHome}</span>
                            </Link>

                            {/* Language Switch */}
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Change Language"
                            >
                                <Globe size={15} className="text-slate-400" />
                                <span className="tracking-wide">{lang === 'kh' ? 'KH' : 'EN'}</span>
                            </button>

                            {/* Dark Mode */}
                            <DarkModeToggle lang={lang} />

                            {/* Notifications Dropdown */}
                            <NotificationDropdown lang={lang} accentColor="indigo" />

                            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

                            {/* User Avatar & Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="p-0.5 rounded-full hover:ring-2 hover:ring-indigo-500/30 transition-all outline-none focus:outline-none"
                                    title={user?.name || 'Tenant'}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-9 h-9 bg-indigo-600 rounded-full border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-xs overflow-hidden transition-all">
                                            {user?.profile_picture ? (
                                                <img
                                                    src={getOptimizedImageUrl(user.profile_picture) || ''}
                                                    alt={user.name || 'Tenant'}
                                                    className="w-full h-full object-cover rounded-full"
                                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                />
                                            ) : user?.name ? (
                                                user.name.charAt(0).toUpperCase()
                                            ) : (
                                                'T'
                                            )}
                                        </div>
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                                {user?.name || 'Tenant'}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                {user?.email}
                                            </p>
                                        </div>

                                        <Link
                                            href="/"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                                        >
                                            <Home size={15} className="text-slate-400" />
                                            <span>{t[lang].goHome}</span>
                                        </Link>

                                        <Link
                                            href="/dashboard/tenant/profile"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-t border-slate-100 dark:border-slate-800"
                                        >
                                            <UserIcon size={15} className="text-slate-400" />
                                            <span>{t[lang].myProfile}</span>
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                setIsLogoutModalOpen(true);
                                            }}
                                            className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition flex items-center gap-2 border-t border-slate-100 dark:border-slate-800"
                                        >
                                            <LogOut size={15} />
                                            <span>{t[lang].logout}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Dedicated Scroll Panel */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 min-w-0 w-full custom-scrollbar pb-24 md:pb-8">
                    <div className="max-w-6xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation Bar (Tabs for 1-tap thumb navigation) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-1.5 px-3 flex items-center justify-around shadow-lg">
                {menuItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                                active
                                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <item.icon size={18} className={active ? 'scale-110 transition-transform' : ''} />
                            <span className="text-[10px] mt-1 font-medium">{item.name}</span>
                            {active && <span className="w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-0.5" />}
                        </Link>
                    );
                })}
            </div>

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={isLogoutModalOpen}
                title={t[lang].logoutConfirmTitle}
                message={t[lang].logoutConfirmMsg}
                confirmText={t[lang].logout}
                cancelText={t[lang].cancel}
                type="danger"
                onConfirm={handleConfirmLogout}
                onCancel={() => setIsLogoutModalOpen(false)}
            />
        </div>
    );
}