'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Globe, Menu, X, User as UserIcon, LayoutDashboard, LogOut, 
  ChevronDown, Home, DoorOpen, Building, PhoneCall, Sparkles,
  FileText, CalendarCheck, Settings, PlusCircle, Info
} from 'lucide-react';
import api from '@/lib/api';
import DarkModeToggle from './DarkModeToggle';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { getOptimizedImageUrl } from './RoomCard';
import NotificationDropdown from './NotificationDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps {
  currentLang: 'kh' | 'en';
  onLangChange: (lang: 'kh' | 'en') => void;
}

export default function Navbar({ currentLang, onLangChange }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const [systemName, setSystemName] = useState('PteasYeung');
  const [logoUrl, setLogoUrl] = useState('/logo/PteasYeung.png');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState('');

  const t = {
    kh: {
      home: 'ទំព័រដើម',
      rooms: 'បន្ទប់ជួល',
      about: 'អំពីយើង',
      contact: 'ទំនាក់ទំនង',
      login: 'ចូលប្រើ',
      register: 'ចុះឈ្មោះ',
      getStarted: 'ចុះឈ្មោះ',
      dashboard: 'ផ្ទាំងគ្រប់គ្រង',
      logout: 'ចាកចេញ',
      account: 'គណនីប្រើប្រាស់',
      myProfile: 'ប្រវត្តិរូបផ្ទាល់ខ្លួន',
      myBookings: 'ការកក់របស់ខ្ញុំ',
      myInvoices: 'វិក្កយបត្ររបស់ខ្ញុំ',
      manageProperties: 'គ្រប់គ្រងផ្ទះជួល',
      manageRooms: 'គ្រប់គ្រងបន្ទប់',
      ownerPanel: 'ផ្ទាំងម្ចាស់ផ្ទះ',
      adminPanel: 'ផ្ទាំងគ្រប់គ្រងទូទៅ',
      listProperty: 'ដាក់ផ្ទះជួល',
      roleOwner: 'ម្ចាស់ផ្ទះ',
      roleAdmin: 'អ្នកគ្រប់គ្រង',
      roleTenant: 'អ្នកជួល',
      subtitle: 'ROOM MANAGEMENT PLATFORM',
    },
    en: {
      home: 'Home',
      rooms: 'Rooms',
      about: 'About Us',
      contact: 'Contact',
      login: 'Log In',
      register: 'Get Started',
      getStarted: 'Get Started',
      dashboard: 'Dashboard',
      logout: 'Log Out',
      account: 'Account',
      myProfile: 'My Profile',
      myBookings: 'My Bookings',
      myInvoices: 'My Invoices',
      manageProperties: 'Manage Properties',
      manageRooms: 'Manage Rooms',
      ownerPanel: 'Owner Panel',
      adminPanel: 'Admin Panel',
      listProperty: 'List Property',
      roleOwner: 'Owner',
      roleAdmin: 'Administrator',
      roleTenant: 'Tenant',
      subtitle: 'ROOM MANAGEMENT PLATFORM',
    }
  };

  const lang = t[currentLang];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateHash = () => {
      setActiveHash(window.location.hash);
    };
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        if (response.data) {
          if (response.data.system_name) setSystemName(response.data.system_name);
          if (response.data.logo_url) setLogoUrl(response.data.logo_url);
        }
      } catch {
        // Fallback default
      }
    };
    fetchSystemSettings();

    const handleSettingsUpdated = () => {
      fetchSystemSettings();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdated);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdated);
  }, []);

  const toggleLanguage = () => {
    const newLang = currentLang === 'kh' ? 'en' : 'kh';
    onLangChange(newLang);
    localStorage.setItem('lang', newLang);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    const role = user.role?.toLowerCase();
    if (role === 'super_admin' || role === 'admin' || role === 'staff') {
      return '/dashboard/admin';
    } else if (role === 'owner') {
      return '/dashboard/owner';
    } else {
      return '/dashboard/tenant/bookings';
    }
  };

  const getProfileLink = () => {
    if (!user) return '/login';
    const role = user.role?.toLowerCase();
    if (role === 'super_admin' || role === 'admin') {
      return '/dashboard/admin/profile';
    } else if (role === 'owner') {
      return '/dashboard/owner/profile';
    } else {
      return '/dashboard/tenant/profile';
    }
  };

  const getRoleLabel = () => {
    if (!user?.role) return '';
    const role = user.role.toLowerCase();
    if (role === 'owner') return lang.roleOwner;
    if (role === 'super_admin' || role === 'admin') return lang.roleAdmin;
    return lang.roleTenant;
  };

  const handleLogout = () => {
    authService.logout();
  };

  const navLinks = [
    { label: lang.home, href: '/', icon: Home },
    { label: lang.rooms, href: '/#rooms-section', icon: DoorOpen },
    { label: lang.about, href: '/about', icon: Info },
    { label: lang.contact, href: '/contact', icon: PhoneCall },
  ];

  const isLinkActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' && (!activeHash || activeHash === '#');
    }
    if (href.startsWith('/#')) {
      const hash = href.replace('/', '');
      return pathname === '/' && activeHash === hash;
    }
    return pathname === href || (href !== '/' && pathname?.startsWith(href));
  };

  const isOwner = user?.role?.toLowerCase() === 'owner';
  const isTenant = user?.role?.toLowerCase() === 'tenant';

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled 
          ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 dark:border-slate-800/80' 
          : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-[72px] flex items-center justify-between">
        
        {/* ========================================================================= */}
        {/* LEFT: Brand Area (Dominant title + accent subtitle, clean logo) */}
        {/* ========================================================================= */}
        <div className="flex items-center flex-shrink-0">
          <Link 
            href="/" 
            className="flex items-center gap-3 group focus:outline-none"
            onClick={() => setActiveHash('')}
          >
            <img
              src={getOptimizedImageUrl(logoUrl) || '/logo/PteasYeung.png'}
              alt={systemName}
              className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo/PteasYeung.png';
              }}
            />
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {systemName || 'PteasYeung'}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase leading-none mt-1">
                {lang.subtitle}
              </span>
            </div>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* CENTER: Primary Navigation (Clean text links, no heavy pill capsule) */}
        {/* ========================================================================= */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon size={16} className={`transition-transform ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ========================================================================= */}
        {/* RIGHT: Controls & Profile Hierarchy */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          
          {/* Language Switcher - Compact, Minimal */}
          <button
            onClick={toggleLanguage}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-lg transition"
            title={currentLang === 'kh' ? "Switch to English" : "ប្តូរទៅភាសាខ្មែរ"}
          >
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="tracking-wide">{currentLang === 'kh' ? 'KH' : 'EN'}</span>
          </button>

          {/* Theme Toggle - Pure sun/moon icon */}
          <DarkModeToggle lang={currentLang} />

          {/* Authenticated State */}
          {!loading && user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <NotificationDropdown lang={currentLang} accentColor="indigo" />

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

              {/* Standout Profile Dropdown Trigger */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="p-0.5 rounded-full hover:ring-2 hover:ring-indigo-500/30 transition-all outline-none group focus:outline-none flex-shrink-0"
                    title={user.name || user.email}
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 group-hover:border-indigo-500 bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs transition-all flex-shrink-0">
                      {user.profile_picture ? (
                        <img
                          src={getOptimizedImageUrl(user.profile_picture) || ''}
                          alt={user.name || 'User'}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : user.name ? (
                        user.name.charAt(0).toUpperCase()
                      ) : (
                        <UserIcon size={16} />
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-60 p-2 shadow-xl border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                  <DropdownMenuLabel className="font-normal p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg mb-1">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer font-medium text-xs text-slate-700 dark:text-slate-200 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition">
                      <LayoutDashboard size={15} className="text-indigo-500" />
                      <span>{lang.dashboard}</span>
                    </Link>
                  </DropdownMenuItem>

                  {isOwner && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/owner/properties" className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer font-medium text-xs text-slate-700 dark:text-slate-200 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition">
                          <Building size={15} className="text-indigo-500" />
                          <span>{lang.manageProperties}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/owner/rooms" className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer font-medium text-xs text-slate-700 dark:text-slate-200 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition">
                          <DoorOpen size={15} className="text-indigo-500" />
                          <span>{lang.manageRooms}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/owner/invoices" className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer font-medium text-xs text-slate-700 dark:text-slate-200 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition">
                          <FileText size={15} className="text-indigo-500" />
                          <span>{lang.myInvoices}</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {isTenant && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/tenant/bookings" className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer font-medium text-xs text-slate-700 dark:text-slate-200 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition">
                          <CalendarCheck size={15} className="text-indigo-500" />
                          <span>{lang.myBookings}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/tenant/invoices" className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer font-medium text-xs text-slate-700 dark:text-slate-200 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition">
                          <FileText size={15} className="text-indigo-500" />
                          <span>{lang.myInvoices}</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuItem asChild>
                    <Link href={getProfileLink()} className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer font-medium text-xs text-slate-700 dark:text-slate-200 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition">
                      <Settings size={15} className="text-indigo-500" />
                      <span>{lang.myProfile}</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                  
                  {/* Logout inside Profile Dropdown */}
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer font-medium text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30 rounded-lg transition"
                  >
                    <LogOut size={15} />
                    <span>{lang.logout}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : !loading && (
            /* Unauthenticated / Guest State - Single Primary CTA + Subtle Login */
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />
              
              <Link 
                href="/login" 
                className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
              >
                {lang.login}
              </Link>
              
              <Link 
                href="/register" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all duration-200"
              >
                {lang.getStarted}
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            type="button"
            className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition ml-1"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Mobile Drawer Menu (Responsive, Clean Hierarchy) */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-6 pt-3 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 shadow-xl">
          
          {/* User Status Card */}
          {!loading && user && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 overflow-hidden">
                  {user.profile_picture ? (
                    <img
                      src={getOptimizedImageUrl(user.profile_picture) || ''}
                      alt={user.name || 'User'}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : user.name ? (
                    user.name.charAt(0).toUpperCase()
                  ) : (
                    <UserIcon size={18} />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate">{getRoleLabel()}</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 shrink-0">
                {user.role}
              </span>
            </div>
          )}

          {/* Primary Navigation Links */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
              Menu
            </p>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Authenticated User Quick Actions */}
          {!loading && user && (
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href={getDashboardLink()}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition text-sm shadow-xs"
              >
                <LayoutDashboard size={16} />
                <span>{lang.dashboard}</span>
              </Link>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-semibold transition text-sm"
              >
                <LogOut size={16} />
                <span>{lang.logout}</span>
              </button>
            </div>
          )}

          {/* Guest Auth Buttons */}
          {!loading && !user && (
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 rounded-xl text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm"
              >
                {lang.login}
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition text-sm shadow-xs"
              >
                {lang.getStarted}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}