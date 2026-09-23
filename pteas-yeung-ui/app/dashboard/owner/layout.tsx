'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { authService } from '@/services/authService';
import {
    LayoutDashboard, Home, DoorOpen, FileText, Wallet, Users2, LogOut, User, FileChartColumn,
    Menu, X, ChevronDown, Globe, Bell, Settings, ExternalLink, CalendarCheck, PanelLeftClose, PanelLeft,
    CreditCard, QrCode, Database, Building2, Shield
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import ConfirmModal from '@/app/components/ConfirmModal';
import Loading from '@/app/components/Loading';
import toast, { Toaster } from 'react-hot-toast';
import DarkModeToggle from '@/app/components/DarkModeToggle';
import NotificationDropdown from '@/app/components/NotificationDropdown';

interface NavSingleItem {
    type: 'item';
    id: string;
    name: string;
    path: string;
    icon: React.ElementType;
}

interface NavAccordionGroup {
    type: 'group';
    id: string;
    name: string;
    icon: React.ElementType;
    children: {
        name: string;
        path: string;
        icon: React.ElementType;
    }[];
}

type NavEntry = NavSingleItem | NavAccordionGroup;

interface NavSection {
    id: string;
    label: string;
    items: NavEntry[];
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const { lang, toggleLanguage } = useLanguage();
    const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
        'property-group': true,
        'finance-group': true,
        'system-group': false,
    });

    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        if (user === undefined) return;

        if (!user || user.role !== 'owner') {
            toast.error(
                lang === 'en'
                    ? 'This page is for property owners only!'
                    : 'ទំព័រនេះសម្រាប់តែម្ចាស់អចលនទ្រព្យប៉ុណ្ណោះ!'
            );
            router.push('/login');
        } else {
            setIsCheckingAuth(false);
        }
    }, [user, router, lang]);

    useEffect(() => {
        setImgError(false);
    }, [user?.profile_picture]);

    // 🟢 Translation សម្រាប់ Header Icons, Section Headers, Navigation និង Homepage Link
    const t = {
        kh: {
            panel: 'OWNER PANEL',
            title: 'ប្រព័ន្ធគ្រប់គ្រងផ្ទះជួលរបស់ខ្ញុំ',
            logout: 'ចាកចេញ',
            logoutTitle: 'បញ្ជាក់ការចាកចេញ',
            logoutMsg: 'តើបងពិតជាចង់ចាកចេញពីគណនីប្រព័ន្ធគ្រប់គ្រងនេះមែនទេ?',
            cancel: 'បោះបង់',
            loginAs: 'បានចូលប្រើប្រាស់ជា៖',
            myProfile: 'ប្រវត្តិរូបផ្ទាល់ខ្លួន',
            loadingText: 'កំពុងផ្ទៀងផ្ទាត់សិទ្ធិប្រព័ន្ធ...',
            homePage: 'ទៅកាន់ទំព័រដើម',
            // Tooltips
            switchLang: 'ប្តូរភាសា',
            apps: 'កម្មវិធី',
            notifications: 'ការជូនដំណឹង',
            // Section Headers
            secMain: 'MAIN',
            secProperty: 'PROPERTY',
            secFinance: 'FINANCE',
            secAnalytics: 'ANALYTICS',
            secSystem: 'SYSTEM',
            // Sidebar Menu
            bizDash: 'Business Dashboard',
            groupProperty: 'Property Management',
            manageHouse: 'Manage Properties',
            manageRoom: 'Manage Rooms',
            manageBooking: 'Manage Bookings',
            groupFinance: 'Finance',
            monthlyTracker: 'Monthly Rent Tracker',
            invoice: 'All Invoices',
            paymentMethod: 'Payment Methods',
            expense: 'Expenses',
            report: 'Reports',
            groupSystem: 'Staff & System',
            staff: 'Staff Management',
            backup: 'Data Backup',
            setting: 'Settings'
        },
        en: {
            panel: 'OWNER PANEL',
            title: 'My Rental Management System',
            logout: 'Logout',
            logoutTitle: 'Confirm Logout',
            logoutMsg: 'Are you sure you want to log out from the management system?',
            cancel: 'Cancel',
            loginAs: 'Logged in as:',
            myProfile: 'My Profile',
            loadingText: 'Verifying authorization...',
            homePage: 'Go to Homepage',
            // Tooltips
            switchLang: 'Switch Language',
            apps: 'Apps',
            notifications: 'Notifications',
            // Section Headers
            secMain: 'MAIN',
            secProperty: 'PROPERTY',
            secFinance: 'FINANCE',
            secAnalytics: 'ANALYTICS',
            secSystem: 'SYSTEM',
            // Sidebar Menu
            bizDash: 'Business Dashboard',
            groupProperty: 'Property Management',
            manageHouse: 'Manage Properties',
            manageRoom: 'Manage Rooms',
            manageBooking: 'Manage Bookings',
            groupFinance: 'Finance',
            monthlyTracker: 'Monthly Rent Tracker',
            invoice: 'All Invoices',
            paymentMethod: 'Payment Methods',
            expense: 'Expenses',
            report: 'Reports',
            groupSystem: 'Staff & System',
            staff: 'Staff Management',
            backup: 'Data Backup',
            setting: 'Settings'
        }
    };

    const handleConfirmLogout = async () => {
        await authService.logout();
    };

    const isPathActive = (path: string) => {
        if (path === '/dashboard/owner') {
            return pathname === '/dashboard/owner';
        }
        return pathname === path || pathname.startsWith(path + '/');
    };

    const groupHasActiveChild = (group: NavAccordionGroup) => {
        return group.children.some(child => isPathActive(child.path));
    };

    const navSections: NavSection[] = [
        {
            id: 'main',
            label: t[lang].secMain,
            items: [
                {
                    type: 'item',
                    id: 'bizDash',
                    name: t[lang].bizDash,
                    path: '/dashboard/owner',
                    icon: LayoutDashboard
                }
            ]
        },
        {
            id: 'property',
            label: t[lang].secProperty,
            items: [
                {
                    type: 'group',
                    id: 'property-group',
                    name: t[lang].groupProperty,
                    icon: Building2,
                    children: [
                        { name: t[lang].manageHouse, path: '/dashboard/owner/properties', icon: Home },
                        { name: t[lang].manageRoom, path: '/dashboard/owner/rooms', icon: DoorOpen },
                        { name: t[lang].manageBooking, path: '/dashboard/owner/bookings', icon: CalendarCheck }
                    ]
                }
            ]
        },
        {
            id: 'finance',
            label: t[lang].secFinance,
            items: [
                {
                    type: 'group',
                    id: 'finance-group',
                    name: t[lang].groupFinance,
                    icon: Wallet,
                    children: [
                        { name: t[lang].monthlyTracker, path: '/dashboard/owner/payments', icon: CreditCard },
                        { name: t[lang].invoice, path: '/dashboard/owner/invoices', icon: FileText },
                        { name: t[lang].paymentMethod, path: '/dashboard/owner/payment-methods', icon: QrCode },
                        { name: t[lang].expense, path: '/dashboard/owner/expenses', icon: Wallet }
                    ]
                }
            ]
        },
        {
            id: 'analytics',
            label: t[lang].secAnalytics,
            items: [
                {
                    type: 'item',
                    id: 'report',
                    name: t[lang].report,
                    path: '/dashboard/owner/report',
                    icon: FileChartColumn
                }
            ]
        },
        {
            id: 'system',
            label: t[lang].secSystem,
            items: [
                {
                    type: 'group',
                    id: 'system-group',
                    name: t[lang].groupSystem,
                    icon: Shield,
                    children: [
                        { name: t[lang].staff, path: '/dashboard/owner/staff', icon: Users2 },
                        { name: t[lang].backup, path: '/dashboard/owner/backup', icon: Database },
                        { name: t[lang].setting, path: '/dashboard/owner/setting', icon: Settings }
                    ]
                }
            ]
        }
    ];

    // 🟢 Auto-expand accordion if any child route is currently active
    useEffect(() => {
        navSections.forEach(section => {
            section.items.forEach(item => {
                if (item.type === 'group' && groupHasActiveChild(item)) {
                    setOpenAccordions(prev => {
                        if (prev[item.id]) return prev;
                        return { ...prev, [item.id]: true };
                    });
                }
            });
        });
    }, [pathname]);

    const toggleAccordion = (groupId: string) => {
        if (isSidebarCollapsed) {
            setIsSidebarCollapsed(false);
            setOpenAccordions(prev => ({
                ...prev,
                [groupId]: true
            }));
        } else {
            setOpenAccordions(prev => ({
                ...prev,
                [groupId]: !prev[groupId]
            }));
        }
    };

    if (isCheckingAuth) {
        return <Loading fullScreen size="lg" text={t[lang].loadingText} />;
    }

    const storageBaseUrl = (process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:8000/storage').replace(/\/$/, '');
    const profileImageUrl = user?.profile_picture ? `${storageBaseUrl}/${user.profile_picture}` : null;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* Backdrop for Mobile Sidebar */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
                    aria-hidden="true"
                />
            )}
            <Toaster position="top-right" reverseOrder={false} />

            {/* Owner Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white transform transition-all duration-300 ease-in-out md:static md:h-screen md:translate-x-0 border-r border-slate-800/80 flex flex-col overflow-hidden shadow-2xl md:shadow-none flex-shrink-0 ${isSidebarOpen ? 'translate-x-0 w-64' : (isSidebarCollapsed ? '-translate-x-full md:translate-x-0 w-20' : '-translate-x-full md:translate-x-0 w-64')}`}
            >
                <div className={`sticky top-0 z-10 flex-shrink-0 bg-slate-900 dark:bg-slate-950 flex items-center px-4 py-3.5 border-b border-slate-800/80 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <Link href="/dashboard/owner" className="flex items-center gap-3 hover:opacity-90 transition group" title={t[lang].title}>
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
                                    <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded font-bold uppercase">Owner</span>
                                </div>
                                <p className="text-[10px] text-indigo-400 mt-0.5 font-medium">Management</p>
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

                <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-2.5 custom-scrollbar">
                    {navSections.map((section, sectionIdx) => (
                        <div key={section.id} className="space-y-1">
                            {/* Section Header */}
                            {!isSidebarCollapsed ? (
                                <div className={`px-2.5 pb-0.5 flex items-center select-none ${sectionIdx === 0 ? 'pt-0.5' : 'pt-2.5'}`}>
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400/80 dark:text-slate-500 uppercase">
                                        {section.label}
                                    </span>
                                </div>
                            ) : (
                                sectionIdx > 0 && <div className="my-2 mx-auto w-6 border-t border-slate-800/80" />
                            )}

                            {/* Section Items */}
                            <div className="space-y-0.5">
                                {section.items.map((item) => {
                                    if (item.type === 'item') {
                                        const active = isPathActive(item.path);
                                        return (
                                            <Link
                                                key={item.id}
                                                href={item.path}
                                                onClick={() => setIsSidebarOpen(false)}
                                                title={isSidebarCollapsed ? item.name : undefined}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition duration-200 group ${
                                                    isSidebarCollapsed ? 'justify-center px-0' : ''
                                                } ${
                                                    active 
                                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold shadow-md shadow-indigo-950/40' 
                                                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                                                }`}
                                            >
                                                <item.icon className={`w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'group-hover:text-indigo-400'}`} />
                                                {!isSidebarCollapsed && (
                                                    <>
                                                        <span className="text-xs sm:text-sm whitespace-nowrap">{item.name}</span>
                                                        {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 animate-pulse" />}
                                                    </>
                                                )}
                                            </Link>
                                        );
                                    }

                                    // Accordion Group
                                    const isOpen = !!openAccordions[item.id];
                                    const hasActiveChild = groupHasActiveChild(item);

                                    return (
                                        <div key={item.id} className="space-y-0.5">
                                            {/* Accordion Parent Header */}
                                            <button
                                                type="button"
                                                onClick={() => toggleAccordion(item.id)}
                                                title={isSidebarCollapsed ? item.name : undefined}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition duration-200 group text-xs sm:text-sm select-none ${
                                                    isSidebarCollapsed ? 'justify-center px-0 relative' : ''
                                                } ${
                                                    hasActiveChild
                                                        ? 'text-indigo-300 font-medium hover:text-white hover:bg-slate-800/60'
                                                        : 'text-slate-400 font-normal hover:text-white hover:bg-slate-800/60'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <item.icon className={`w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0 transition-all duration-200 ${
                                                        hasActiveChild ? 'text-indigo-400 scale-105' : 'text-slate-400 group-hover:text-indigo-400 group-hover:scale-105'
                                                    }`} />
                                                    {!isSidebarCollapsed && (
                                                        <span className="truncate">{item.name}</span>
                                                    )}
                                                </div>
                                                {!isSidebarCollapsed && (
                                                    <ChevronDown
                                                        className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 flex-shrink-0 ${
                                                            isOpen ? 'rotate-180 text-indigo-400' : ''
                                                        }`}
                                                    />
                                                )}
                                                {isSidebarCollapsed && hasActiveChild && (
                                                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-900" />
                                                )}
                                            </button>

                                            {/* Accordion Submenu (Catalog indented with vertical guide line) */}
                                            {!isSidebarCollapsed && (
                                                <div
                                                    className={`grid transition-all duration-200 ease-in-out ${
                                                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                                                    }`}
                                                >
                                                    <div className="overflow-hidden">
                                                        <div className="ml-4 pl-3 my-0.5 space-y-0.5 border-l border-slate-800/80">
                                                            {item.children.map((child) => {
                                                                const active = isPathActive(child.path);
                                                                return (
                                                                    <Link
                                                                        key={child.path}
                                                                        href={child.path}
                                                                        onClick={() => setIsSidebarOpen(false)}
                                                                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition duration-150 group ${
                                                                            active
                                                                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold shadow-sm shadow-indigo-950/40'
                                                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                                        }`}
                                                                    >
                                                                        <child.icon className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                                                                            active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-300 group-hover:scale-110'
                                                                        }`} />
                                                                        <span className="truncate">{child.name}</span>
                                                                        {active && (
                                                                            <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 animate-pulse" />
                                                                        )}
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="sticky bottom-0 bg-slate-900 dark:bg-slate-950 p-3 border-t border-slate-800/80 space-y-2">
                    {/* 🟢 បន្ថែម Link ទៅ Homepage លើ Sidebar Bottom */}
                    <Link
                        href="/"
                        title={isSidebarCollapsed ? t[lang].homePage : undefined}
                        className={`w-full flex items-center gap-3 px-3.5 py-2 text-slate-400 hover:bg-slate-800/80 hover:text-white rounded-xl transition duration-200 font-semibold text-xs sm:text-sm ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                    >
                        <ExternalLink className="w-4 h-4 flex-shrink-0 text-indigo-400" />
                        {!isSidebarCollapsed && <span className="whitespace-nowrap">{t[lang].homePage}</span>}
                    </Link>

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
                            <p className="font-semibold text-slate-400 text-[11px] mb-0.5">{t[lang].loginAs}</p>
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
                                    {t[lang].title}
                                </h2>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60">
                                    Owner
                                </span>
                            </div>
                        </div>

                        <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {/* Link to Homepage */}
                            <Link
                                href="/"
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title={t[lang].homePage}
                            >
                                <Home className="w-4 h-4 text-slate-400" />
                                <span>{t[lang].homePage}</span>
                            </Link>

                            {/* Language Toggle */}
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title={t[lang].switchLang}
                            >
                                <Globe className="w-4 h-4 text-slate-400" />
                                <span className="tracking-wide">{lang === 'kh' ? 'KH' : 'EN'}</span>
                            </button>

                            <DarkModeToggle lang={lang} />

                            <NotificationDropdown lang={lang} accentColor="indigo" />

                            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

                            {/* User Dropdown Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="p-0.5 rounded-full hover:ring-2 hover:ring-indigo-500/30 transition-all outline-none focus:outline-none"
                                    title={user?.name || 'Owner'}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-9 h-9 bg-indigo-600 rounded-full border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-xs overflow-hidden transition-all">
                                            {profileImageUrl && !imgError ? (
                                                <img
                                                    src={profileImageUrl}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover rounded-full"
                                                    onError={() => setImgError(true)}
                                                />
                                            ) : (
                                                user?.name?.charAt(0) || 'O'
                                            )}
                                        </div>
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                                    </div>
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                {user?.name || 'Owner User'}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                {user?.email}
                                            </p>
                                        </div>

                                        {/* 🟢 បន្ថែម Link ទៅ Homepage ក្នុង Dropdown Menu */}
                                        <Link
                                            href="/"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-medium"
                                        >
                                            <ExternalLink size={16} className="text-slate-400" />
                                            <span>{t[lang].homePage}</span>
                                        </Link>

                                        <Link
                                            href="/dashboard/owner/profile"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-medium"
                                        >
                                            <User size={16} className="text-slate-400" />
                                            <span>{t[lang].myProfile}</span>
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                setIsLogoutModalOpen(true);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition flex items-center gap-2 font-medium border-t border-slate-100 dark:border-slate-800"
                                        >
                                            <LogOut size={16} />
                                            <span>{t[lang].logout}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 min-w-0 w-full custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={isLogoutModalOpen}
                title={t[lang].logoutTitle}
                message={t[lang].logoutMsg}
                confirmText={t[lang].logout}
                cancelText={t[lang].cancel}
                type="danger"
                onConfirm={handleConfirmLogout}
                onCancel={() => setIsLogoutModalOpen(false)}
            />
        </div>
    );
}