'use client';

import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import {
    LayoutDashboard, DoorOpen, FileText, CalendarCheck, LogOut, User,
    Menu, X, Globe, Shield, Building, ChevronRight, CreditCard
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ConfirmModal from '@/app/components/ConfirmModal';
import Loading from '@/app/components/Loading';
import toast, { Toaster } from 'react-hot-toast';
import DarkModeToggle from '@/app/components/DarkModeToggle';

import { useLanguage } from '@/context/LanguageContext';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    const { user, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { lang, toggleLanguage } = useLanguage();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        if (user === undefined) return;

        if (!user || user.role !== 'staff') {
            toast.error(
                lang === 'en'
                    ? 'Access denied! Staff portal only.'
                    : 'ទំព័រនេះសម្រាប់តែបុគ្គលិកប៉ុណ្ណោះ!'
            );
            router.push('/login');
        } else {
            setIsCheckingAuth(false);
        }
    }, [user, router, lang]);

    const handleConfirmLogout = async () => {
        await authService.logout();
    };

    if (isCheckingAuth) {
        return <Loading fullScreen size="lg" text={lang === 'kh' ? 'កំពុងផ្ទៀងផ្ទាត់សិទ្ធិបុគ្គលិក...' : 'Verifying staff authorization...'} />;
    }

    const t = {
        kh: {
            portalName: 'Staff Portal',
            portalSubtitle: 'ប្រព័ន្ធការងារបុគ្គលិក',
            overview: 'ទិដ្ឋភាពទូទៅ',
            rooms: 'បន្ទប់ & ស្ថានភាព',
            invoices: 'ការទូទាត់ & វិក្កយបត្រ',
            bookings: 'ការកក់បន្ទប់',
            logout: 'ចាកចេញ',
            logoutTitle: 'ចាកចេញពីប្រព័ន្ធ',
            logoutDesc: 'តើអ្នកពិតជាចង់ចាកចេញពីគណនីបុគ្គលិកនេះមែនទេ?',
            confirmLogout: 'យល់ព្រមចាកចេញ',
            cancel: 'បោះបង់'
        },
        en: {
            portalName: 'Staff Portal',
            portalSubtitle: 'Staff Operations Workspace',
            overview: 'Overview',
            rooms: 'Rooms & Status',
            invoices: 'Invoices & Payments',
            bookings: 'Bookings',
            logout: 'Log Out',
            logoutTitle: 'Sign Out Confirmation',
            logoutDesc: 'Are you sure you want to sign out from your staff account?',
            confirmLogout: 'Sign Out',
            cancel: 'Cancel'
        }
    };

    const currentT = t[lang];

    const menuItems = [
        { 
            name: currentT.overview, 
            path: '/dashboard/staff', 
            icon: LayoutDashboard,
            visible: true
        },
        { 
            name: currentT.rooms, 
            path: '/dashboard/staff/rooms', 
            icon: DoorOpen,
            visible: true // All staff can view or inspect rooms
        },
        { 
            name: currentT.invoices, 
            path: '/dashboard/staff/invoices', 
            icon: CreditCard,
            visible: hasPermission('invoices.view')
        },
        { 
            name: currentT.bookings, 
            path: '/dashboard/staff/bookings', 
            icon: CalendarCheck,
            visible: hasPermission('bookings.view')
        },
    ];

    const isActive = (path: string) => {
        if (path === '/dashboard/staff') {
            return pathname === '/dashboard/staff';
        }
        return pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
            <Toaster position="top-right" />

            {/* Top Navbar */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    {/* Brand & Mobile Menu Button */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        <Link href="/dashboard/staff" className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-sky-500/20">
                                <Shield size={18} />
                            </div>
                            <div>
                                <span className="font-black text-base text-slate-900 dark:text-white tracking-tight leading-none block">
                                    {currentT.portalName}
                                </span>
                                <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                                    {currentT.portalSubtitle}
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {menuItems.filter(item => item.visible).map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                        active
                                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-extrabold'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                    }`}
                                >
                                    <Icon size={16} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right utilities: Language, Theme, User profile & Logout */}
                    <div className="flex items-center gap-2">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
                            title="Switch Language"
                        >
                            <Globe size={14} className="text-slate-500" />
                            <span className="uppercase">{lang}</span>
                        </button>

                        <DarkModeToggle />

                        {/* Staff User Avatar & Logout */}
                        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                            <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                {user?.name?.charAt(0).toUpperCase() || 'S'}
                            </div>
                            <button
                                onClick={() => setIsLogoutModalOpen(true)}
                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                                title={currentT.logout}
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Dropdown Navigation */}
                {isSidebarOpen && (
                    <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {menuItems.filter(item => item.visible).map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                                        active
                                            ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Icon size={16} />
                                        <span>{item.name}</span>
                                    </div>
                                    <ChevronRight size={14} className="opacity-40" />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>

            {/* Logout Confirm Modal */}
            <ConfirmModal
                isOpen={isLogoutModalOpen}
                title={currentT.logoutTitle}
                message={currentT.logoutDesc}
                confirmText={currentT.confirmLogout}
                cancelText={currentT.cancel}
                type="danger"
                onConfirm={handleConfirmLogout}
                onCancel={() => setIsLogoutModalOpen(false)}
            />
        </div>
    );
}
