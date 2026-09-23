'use client';

import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import {
    Users, Building2, ShieldAlert, Settings, LogOut, User,
    FileText, DollarSign, BarChart3, LayoutDashboard, Menu, X, ChevronDown,
    Globe, Grid, Bell, PanelLeftClose, PanelLeft, Home, TrendingUp, FileCode,
    CreditCard, QrCode, Database
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import ConfirmModal from '@/app/components/ConfirmModal';
import Loading from '@/app/components/Loading';
import toast, { Toaster } from 'react-hot-toast';
import DarkModeToggle from '@/app/components/DarkModeToggle';
import NotificationDropdown from '@/app/components/NotificationDropdown';

import { useLanguage } from '@/lib/LanguageContext';
import { translations } from '@/lib/translations';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const { language, toggleLanguage } = useLanguage();
    const t = translations[language];

    useEffect(() => {
        if (user === undefined) return;

        if (!user || user.role !== 'super_admin') {
            toast.error(language === 'en' ? 'Access denied! Admin panel only.' : 'អ្នកគ្មានសិទ្ធិចូលកាន់ផ្នែក Admin ឡើយ!');
            router.push('/login');
        } else {
            setIsCheckingAuth(false);
        }
    }, [user, router, language]);

    const handleConfirmLogout = async () => {
        await authService.logout();
    };

    if (isCheckingAuth) {
        return <Loading fullScreen size="lg" text={language === 'kh' ? 'កំពុងផ្ទៀងផ្ទាត់សិទ្ធិប្រព័ន្ធ...' : 'Verifying authorization...'} />;
    }

    const isActive = (path: string) => {
        if (path === '/dashboard/admin/payments') {
            return pathname === '/dashboard/admin/payments' || pathname === '/dashboard/admin/invoices';
        }
        return pathname === path;
    };

    const menuItems = [
        { name: t.adminNav?.dash || (language === 'kh' ? 'Dashboard' : 'Dashboard'), path: '/dashboard/admin', icon: LayoutDashboard },
        { name: t.adminNav?.users || (language === 'kh' ? 'អ្នកប្រើប្រាស់' : 'Users'), path: '/dashboard/admin/users', icon: Users },
        { name: t.adminNav?.props || (language === 'kh' ? 'អចលនទ្រព្យ' : 'Properties'), path: '/dashboard/admin/properties', icon: Building2 },
        { name: t.adminNav?.payments || (language === 'kh' ? 'ការទូទាត់ប្រាក់' : 'Payments'), path: '/dashboard/admin/payments', icon: CreditCard },
        { name: t.adminNav?.paymentMethods || (language === 'kh' ? 'វិធីសាស្ត្រទូទាត់' : 'Payment Methods'), path: '/dashboard/admin/payment-methods', icon: QrCode },
        { name: t.adminNav?.income || (language === 'kh' ? 'ចំណូល' : 'Income'), path: '/dashboard/admin/income', icon: TrendingUp },
        { name: t.adminNav?.expenses || (language === 'kh' ? 'ការចំណាយ' : 'Expenses'), path: '/dashboard/admin/expenses', icon: DollarSign },
        { name: t.adminNav?.reports || (language === 'kh' ? 'របាយការណ៍' : 'Reports'), path: '/dashboard/admin/reports', icon: BarChart3 },
        { name: t.adminNav?.auditLogs || (language === 'kh' ? 'កំណត់ហេតុសុវត្ថិភាព' : 'Security Logs'), path: '/dashboard/admin/audit-logs', icon: ShieldAlert },
        { name: t.adminNav?.backup || (language === 'kh' ? 'ការបម្រុងទុកទិន្នន័យ' : 'Data Backup'), path: '/dashboard/admin/backup', icon: Database },
        { name: t.adminNav?.myProfile || (language === 'kh' ? 'ប្រវត្តិរូបផ្ទាល់ខ្លួន' : 'My Profile'), path: '/dashboard/admin/profile', icon: User },
        { name: t.adminNav?.settings || (language === 'kh' ? 'កំណត់ប្រព័ន្ធ' : 'Settings'), path: '/dashboard/admin/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
                    aria-hidden="true"
                />
            )}
            <Toaster position="top-right" reverseOrder={false} />

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white transform transition-all duration-300 ease-in-out md:static md:h-screen md:translate-x-0 border-r border-slate-800/80 flex flex-col overflow-hidden shadow-2xl md:shadow-none flex-shrink-0 ${isSidebarOpen ? 'translate-x-0 w-64' : (isSidebarCollapsed ? '-translate-x-full md:translate-x-0 w-20' : '-translate-x-full md:translate-x-0 w-64')}`}
            >
                <div className={`sticky top-0 z-10 flex-shrink-0 bg-slate-900 dark:bg-slate-950 flex items-center px-4 py-3.5 border-b border-slate-800/80 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <Link href="/dashboard/admin" className="flex items-center gap-3 hover:opacity-90 transition group" title="Admin Panel">
                        <img
                            src="/logo/PteasYeung.png"
                            alt="PteasYeung Logo"
                            className={`${isSidebarCollapsed ? 'h-10' : 'h-12'} w-auto object-contain flex-shrink-0 group-hover:scale-105 transition-transform drop-shadow-sm`}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/logo/PteasYeung.png';
                            }}
                        />
                        {!isSidebarCollapsed && (
                            <div className="whitespace-nowrap transition-opacity duration-300">
                                <div className="flex items-center gap-1.5">
                                    <h1 className="font-black text-sm leading-none text-white tracking-tight">PteasYeung</h1>
                                    <span className="text-[9px] px-1.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-bold uppercase">Admin</span>
                                </div>
                                <p className="text-[10px] text-rose-400 mt-0.5 font-medium">Control Center</p>
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

                <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
                    {menuItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                title={isSidebarCollapsed ? item.name : undefined}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition duration-200 group ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${
                                    active 
                                        ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white font-semibold shadow-md shadow-rose-950/40' 
                                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'group-hover:text-rose-400'}`} />
                                {!isSidebarCollapsed && (
                                    <>
                                        <span className="text-xs sm:text-sm whitespace-nowrap">{item.name}</span>
                                        {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 animate-pulse" />}
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sticky bottom-0 bg-slate-900 dark:bg-slate-950 p-3 border-t border-slate-800/80 space-y-2">


                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        title={isSidebarCollapsed ? (language === 'kh' ? 'ចាកចេញ' : 'Logout') : undefined}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-400 hover:bg-rose-600/20 hover:text-rose-400 rounded-xl transition duration-200 font-semibold text-xs sm:text-sm group ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0 transition-transform group-hover:-translate-x-0.5" />
                        {!isSidebarCollapsed && <span className="whitespace-nowrap">{language === 'kh' ? 'ចាកចេញ' : 'Logout'}</span>}
                    </button>
                    {user && !isSidebarCollapsed && (
                        <div className="px-3.5 py-2 text-xs text-slate-500 whitespace-nowrap bg-slate-950/40 rounded-xl border border-slate-800/50">
                            <p className="font-semibold text-slate-400 text-[11px] mb-0.5">{language === 'kh' ? 'បានចូលប្រើប្រាស់ជា៖' : 'Logged in as:'}</p>
                            <p className="text-slate-300 truncate w-48 text-xs">{user.email}</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 shadow-xs flex-shrink-0 z-40 w-full">
                    <div className="h-[72px] px-4 md:px-8 flex items-center justify-between gap-4 w-full">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-slate-600 dark:text-slate-400 flex-shrink-0"
                            >
                                <Menu size={20} />
                            </button>

                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="hidden md:block p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-slate-500 dark:text-slate-400 flex-shrink-0"
                                title="Toggle Sidebar"
                            >
                                {isSidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                            </button>

                            <div className="hidden sm:flex items-center gap-2.5">
                                <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight truncate">
                                    {language === 'kh' ? 'ផ្ទាំងគ្រប់គ្រងប្រព័ន្ធ' : 'System Dashboard'}
                                </h2>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60">
                                    Admin
                                </span>
                            </div>
                        </div>

                        <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {/* Link ទៅកាន់ទំព័រដើម (Homepage) */}
                            <Link
                                href="/"
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title={language === 'kh' ? 'ទៅកាន់ទំព័រដើម' : 'Go to Homepage'}
                            >
                                <Home className="w-4 h-4 text-slate-400" />
                                <span>{language === 'kh' ? 'ទំព័រដើម' : 'Homepage'}</span>
                            </Link>

                            {/* Switch Language */}
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Switch Language"
                            >
                                <Globe className="w-4 h-4 text-slate-400" />
                                <span className="tracking-wide">{language === 'kh' ? 'KH' : 'EN'}</span>
                            </button>

                            {/* Dark Mode */}
                            <DarkModeToggle lang={language} />

                            {/* Notifications */}
                            <NotificationDropdown lang={language} accentColor="rose" />

                            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

                            {/* User Menu Button */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="p-0.5 rounded-full hover:ring-2 hover:ring-rose-500/30 transition-all outline-none focus:outline-none"
                                    title={user?.name || 'Admin'}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-9 h-9 bg-rose-600 rounded-full border-2 border-slate-200 dark:border-slate-700 hover:border-rose-500 flex items-center justify-center text-white font-bold text-xs shadow-xs overflow-hidden transition-all">
                                            {user?.profile_picture ? (
                                                <img
                                                    src={getOptimizedImageUrl(user.profile_picture) || ''}
                                                    alt={user?.name || 'Admin'}
                                                    className="w-full h-full object-cover rounded-full"
                                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                />
                                            ) : user?.name ? (
                                                user.name.charAt(0).toUpperCase()
                                            ) : (
                                                'A'
                                            )}
                                        </div>
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                {user?.name || 'Admin User'}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                {user?.email}
                                            </p>
                                        </div>

                                        <Link
                                            href="/"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-medium"
                                        >
                                            <Home size={16} className="text-slate-400" />
                                            <span>{language === 'kh' ? 'ទៅកាន់ទំព័រដើម' : 'Go to Homepage'}</span>
                                        </Link>

                                        <Link
                                            href="/dashboard/admin/profile"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-medium border-t border-slate-100 dark:border-slate-800"
                                        >
                                            <User size={16} className="text-slate-400" />
                                            <span>{language === 'kh' ? 'ប្រវត្តិរូបផ្ទាល់ខ្លួន' : 'My Profile'}</span>
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                setIsLogoutModalOpen(true);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition flex items-center gap-2 font-medium border-t border-slate-100 dark:border-slate-800"
                                        >
                                            <LogOut size={16} />
                                            <span>{language === 'kh' ? 'ចាកចេញ' : 'Logout'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 min-w-0 w-full custom-scrollbar">
                    {children}
                </main>
            </div>

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                title={language === 'kh' ? 'បញ្ជាក់ការចាកចេញ' : 'Confirm Logout'}
                message={language === 'kh' ? 'តើបងពិតជាចង់ចាកចេញពីគណនីប្រព័ន្ធគ្រប់គ្រងនេះមែនទេ?' : 'Are you sure you want to log out from the management system?'}
                confirmText={language === 'kh' ? 'ចាកចេញ' : 'Logout'}
                cancelText={language === 'kh' ? 'បោះបង់' : 'Cancel'}
                type="danger"
                onConfirm={handleConfirmLogout}
                onCancel={() => setIsLogoutModalOpen(false)}
            />
        </div>
    );
}