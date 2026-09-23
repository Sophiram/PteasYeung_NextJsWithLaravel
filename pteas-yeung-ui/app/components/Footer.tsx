'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail, Phone, MapPin, Send,
  ShieldCheck, Clock, Headphones, Building, DoorOpen,
  CreditCard, CheckCircle2, Sparkles, Loader2, ArrowUp,
  Share2, Heart, ExternalLink, HelpCircle, Check, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getOptimizedImageUrl } from './RoomCard';
import ShareModal from './ShareModal';

// Brand SVGs
const FacebookIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 0C5.395 0 .012 5.385.012 12.02c0 2.118.552 4.186 1.6 6.008L0 24l6.155-1.614a11.96 11.96 0 0 0 5.876 1.53h.005c6.634 0 12.017-5.385 12.017-12.021 0-3.21-1.25-6.226-3.523-8.5a11.94 11.94 0 0 0-8.499-3.522zm0 2.003c5.524 0 10.015 4.492 10.015 10.018 0 2.673-1.042 5.186-2.935 7.08-1.894 1.894-4.407 2.937-7.08 2.937h-.005a9.96 9.96 0 0 1-5.074-1.39l-.364-.216-3.77.989 1.006-3.673-.238-.378a9.96 9.96 0 0 1-1.54-5.349C2.016 6.495 6.507 2.003 12.031 2.003zm-2.83 5.485c-.156 0-.41.059-.625.293-.215.234-.82.8-.82 1.954 0 1.152.84 2.266.957 2.422.117.156 1.621 2.535 3.978 3.528.56.236.997.377 1.338.484.563.178 1.076.153 1.481.093.452-.068 1.387-.567 1.582-1.114.195-.547.195-1.016.137-1.114-.059-.097-.215-.156-.45-.273-.234-.117-1.387-.684-1.602-.762-.215-.078-.371-.117-.527.117-.156.234-.605.762-.742.918-.137.156-.273.176-.508.059-.234-.117-.99-.365-1.886-1.164-.697-.622-1.168-1.39-1.305-1.625-.137-.234-.015-.36.103-.477.106-.105.234-.273.352-.41.117-.137.156-.234.234-.39.078-.156.039-.293-.02-.41-.059-.117-.527-1.27-.723-1.74-.19-.456-.385-.394-.527-.401-.136-.007-.293-.008-.449-.008z"/>
  </svg>
);

const XTwitterIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

type Lang = 'kh' | 'en';

interface DynamicFooterSettings {
  system_name?: string;
  logo_url?: string;
  footer_description_kh?: string;
  footer_description_en?: string;
  footer_hotline?: string;
  footer_email?: string;
  footer_telegram?: string;
  footer_address_kh?: string;
  footer_address_en?: string;
  footer_operating_hours_kh?: string;
  footer_operating_hours_en?: string;
  footer_facebook?: string;
  footer_instagram?: string;
  footer_twitter?: string;
  footer_copyright?: string;
}

const translations = {
  kh: {
    tagline: 'ប្រព័ន្ធគ្រប់គ្រងផ្ទះជួល និងបន្ទប់ជួលឆ្លាតវៃឈានមុខគេនៅកម្ពុជា',
    desc: 'ផ្ទះយើង (Pteas Yeung) គឺជាវេទិកាឌីជីថលទំនើបជួយសម្រួលដល់ម្ចាស់ផ្ទះក្នុងការគ្រប់គ្រងអចលនទ្រព្យ បន្ទប់ជួល គណនាវិក្កយបត្រភ្លើង-ទឹក និងចំណូលចំណាយយ៉ាងមានប្រសិទ្ធភាព ព្រមទាំងផ្តល់ភាពងាយស្រួលដល់អ្នកជួលក្នុងការស្វែងរក និងកក់បន្ទប់ប្រកបដោយទំនុកចិត្ត។',
    trustBadge: 'សុវត្ថិភាពខ្ពស់ និងផ្ទៀងផ្ទាត់ត្រឹមត្រូវ',
    forTenantsTitle: 'សម្រាប់អ្នកជួល',
    forOwnersTitle: 'សម្រាប់ម្ចាស់ផ្ទះ',
    companyTitle: 'ក្រុមហ៊ុន & ផ្លូវច្បាប់',
    supportTitle: 'ជំនួយ & ទំនាក់ទំនង',
    searchRooms: 'ស្វែងរកបន្ទប់ជួលទំនេរ',
    exploreProperties: 'មើលអគារ និងផ្ទះជួលទាំងអស់',
    howToBook: 'របៀបស្វែងរក និងកក់បន្ទប់',
    tenantPortal: 'គណនីអ្នកជួលផ្ទាល់ខ្លួន',
    invoicePayGuide: 'ការបង់ប្រាក់ & ពិនិត្យវិក្កយបត្រ',
    tenantRights: 'គោលការណ៍ និងកិច្ចសន្យាជួល',
    listProperty: 'ចុះឈ្មោះដាក់ផ្ទះជួល',
    ownerDashboard: 'ផ្ទាំងគ្រប់គ្រងម្ចាស់ផ្ទះ',
    billingSystem: 'ប្រព័ន្ធគណនាភ្លើង-ទឹកស្វ័យប្រវត្តិ',
    expenseTracking: 'ការតាមដានចំណូល និងចំណាយ',
    staffManagement: 'ការគ្រប់គ្រងបុគ្គលិកអគារ',
    ownerSupport: 'សេវាកម្មប្រឹក្សាសម្រាប់ម្ចាស់ផ្ទះ',
    contactHeading: 'មជ្ឈមណ្ឌលជំនួយ ២៤/៧',
    address: 'រាជធានីភ្នំពេញ, ព្រះរាជាណាចក្រកម្ពុជា',
    hotline: '+855 12 345 678',
    email: 'support@pteasyeung.com',
    telegram: 'Telegram: @pteasyeung_support',
    hours: 'ម៉ោងធ្វើការ៖ ច័ន្ទ - អាទិត្យ (8:00 ព្រឹក - 9:00 យប់)',
    sundaySupport: 'ជំនួយបន្ថែមតាមប្រព័ន្ធ Online (Telegram)',
    feat1: 'កក់បន្ទប់ភ្លាមៗ មិនបាច់រង់ចាំយូរ',
    feat2: 'ម្ចាស់ផ្ទះ និងបន្ទប់ត្រូវបានផ្ទៀងផ្ទាត់',
    feat3: 'វិក្កយបត្រច្បាស់លាស់ មិនមានកម្រៃលាក់កំបាំង',
    feat4: 'ជំនួយបច្ចេកទេស និងការដោះស្រាយ ២៤/៧',
    newsletterBadge: 'ព្រឹត្តិបត្រព័ត៌មាន & ប្រូម៉ូសិន',
    newsletterTitle: 'ទទួលបានដំណឹងបន្ទប់ទំនេរ & ប្រូម៉ូសិនពិសេសមុនគេ',
    newsletterDesc: 'ចុះឈ្មោះដើម្បីទទួលបានការជូនដំណឹងពីបន្ទប់ជួលទំនេរ ការបញ្ចុះតម្លៃ និងព័ត៌មានអចលនទ្រព្យថ្មីៗជារៀងរាល់សប្តាហ៍។',
    newsletterPrivacy: '🔒 ធានារក្សាការសម្ងាត់។ គ្មានសាររំខាន (No spam)។ អាចឈប់ជាវបានគ្រប់ពេល។',
    enterEmail: 'បញ្ចូលអាសយដ្ឋានអ៊ីមែលរបស់អ្នក...',
    subscribeBtn: 'ជាវព័ត៌មាន',
    subscribeSuccess: 'សូមអរគុណ! អ្នកបានចុះឈ្មោះទទួលព័ត៌មានដោយជោគជ័យ។',
    rights: 'រក្សាសិទ្ធិគ្រប់យ៉ាង។',
    madeIn: 'ផលិតឡើងដោយក្តីស្រឡាញ់នៅកម្ពុជា 🇰🇭',
    aboutUs: 'អំពីយើង',
    contactUs: 'ទំនាក់ទំនង',
    privacyPolicy: 'គោលការណ៍ឯកជនភាព',
    termsOfService: 'លក្ខខណ្ឌប្រើប្រាស់',
    security: 'សុវត្ថិភាពប្រព័ន្ធ',
    sitemap: 'ប្លង់គេហទំព័រ',
    scrollTop: 'ត្រឡប់ទៅលើ',
    shareWebsite: 'ចែករំលែកវេទិកា',
    shareTooltip: 'ចែករំលែកតំណភ្ជាប់ដូច ChatGPT',
    systemOperational: 'ប្រព័ន្ធដំណើរការធម្មតា ១០០%',
    callNow: 'ទូរស័ព្ទឥឡូវនេះ',
    socialHeading: 'តាមដានបណ្តាញសង្គម',
  },
  en: {
    tagline: 'Leading Smart Rental Housing & Room Management Platform in Cambodia',
    desc: 'Pteas Yeung is a modern digital platform designed to simplify property and room tracking, automated electricity-water billing, and income-expense control for landlords, while delivering a seamless, trustworthy room discovery and booking experience for tenants.',
    trustBadge: 'High Security & Verified Listings',
    forTenantsTitle: 'For Tenants',
    forOwnersTitle: 'For Landlords',
    companyTitle: 'Company & Legal',
    supportTitle: 'Help & Contact',
    searchRooms: 'Search Available Rooms',
    exploreProperties: 'Browse All Properties',
    howToBook: 'How to Book & Move In',
    tenantPortal: 'Tenant Portal',
    invoicePayGuide: 'Payment & Invoice Guide',
    tenantRights: 'Tenant Rights & Agreements',
    listProperty: 'List Your Rental Property',
    ownerDashboard: 'Owner Admin Dashboard',
    billingSystem: 'Automated Utility Billing',
    expenseTracking: 'Expense & Revenue Tracking',
    staffManagement: 'Building Staff Management',
    ownerSupport: 'Landlord Advisory Support',
    contactHeading: '24/7 Support Center',
    address: 'Phnom Penh, Kingdom of Cambodia',
    hotline: '+855 12 345 678',
    email: 'support@pteasyeung.com',
    telegram: 'Telegram: @pteasyeung_support',
    hours: 'Business Hours: Mon - Sun (8:00 AM - 9:00 PM)',
    sundaySupport: 'Dedicated Telegram Online Support',
    feat1: 'Instant room booking without wait times',
    feat2: 'Verified landlords and legit room records',
    feat3: 'Transparent billing with zero hidden fees',
    feat4: 'Responsive 24/7 customer assistance',
    newsletterBadge: 'Newsletter & Rental Updates',
    newsletterTitle: 'Get Instant Vacancy Alerts & Exclusive Deals',
    newsletterDesc: 'Subscribe to receive notifications when prime rooms open up, special landlord discounts, and rental market insights.',
    newsletterPrivacy: '🔒 Privacy protected. Zero spam. Unsubscribe anytime.',
    enterEmail: 'Enter your email address...',
    subscribeBtn: 'Subscribe',
    subscribeSuccess: 'Thank you! You have subscribed to our vacancy updates.',
    rights: 'All rights reserved.',
    madeIn: 'Proudly built in Cambodia 🇰🇭',
    aboutUs: 'About Us',
    contactUs: 'Contact',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    security: 'Security',
    sitemap: 'Sitemap',
    scrollTop: 'Back to top',
    shareWebsite: 'Share Platform',
    shareTooltip: 'Share platform link like ChatGPT',
    systemOperational: 'All Systems 100% Operational',
    callNow: 'Call Now',
    socialHeading: 'Official Channels',
  }
};

export default function Footer({ currentLang = 'kh' }: { currentLang?: 'kh' | 'en' }) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'subscribed'>('idle');
  const [dynamicSettings, setDynamicSettings] = useState<DynamicFooterSettings>({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const lang = translations[currentLang as Lang] || translations.kh;

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response.data) {
        setDynamicSettings(response.data);
      }
    } catch {
      // Keep fallbacks
    }
  };

  useEffect(() => {
    fetchSettings();

    const handleSettingsUpdated = () => {
      fetchSettings();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdated);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdated);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      toast.error(currentLang === 'kh' ? 'សូមបញ្ចូលអ៊ីមែលឱ្យបានត្រឹមត្រូវ!' : 'Please enter a valid email address!');
      return;
    }

    setStatus('loading');
    setTimeout(() => {
      setStatus('subscribed');
      toast.success(lang.subscribeSuccess, { icon: '📬' });
      setNewsletterEmail('');
      setTimeout(() => setStatus('idle'), 4000);
    }, 600);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const trustHighlights = [
    { icon: DoorOpen, label: lang.feat1, sub: currentLang === 'kh' ? 'ងាយស្រួល និងរហ័ស' : 'Fast & effortless' },
    { icon: ShieldCheck, label: lang.feat2, sub: currentLang === 'kh' ? 'ទំនុកចិត្តខ្ពស់' : '100% Reliable' },
    { icon: CreditCard, label: lang.feat3, sub: currentLang === 'kh' ? 'ទូទាត់ប្រកបដោយតម្លាភាព' : 'Zero hidden charges' },
    { icon: Headphones, label: lang.feat4, sub: currentLang === 'kh' ? 'សេវាកម្មរហ័ស' : 'Always responsive' }
  ];

  const systemName = dynamicSettings.system_name || (currentLang === 'kh' ? 'ផ្ទះយើង' : 'Pteas Yeung');
  const platformBio = currentLang === 'kh'
    ? (dynamicSettings.footer_description_kh || lang.desc)
    : (dynamicSettings.footer_description_en || lang.desc);

  const hotline = dynamicSettings.footer_hotline || lang.hotline;
  const email = dynamicSettings.footer_email || lang.email;
  const telegramLink = dynamicSettings.footer_telegram || 'https://t.me/pteasyeung_support';
  const telegramHandle = telegramLink.replace(/^https?:\/\/t\.me\//, '@');

  const address = currentLang === 'kh'
    ? (dynamicSettings.footer_address_kh || lang.address)
    : (dynamicSettings.footer_address_en || lang.address);

  const operatingHours = currentLang === 'kh'
    ? (dynamicSettings.footer_operating_hours_kh || lang.hours)
    : (dynamicSettings.footer_operating_hours_en || lang.hours);

  const copyrightText = dynamicSettings.footer_copyright || 'ផ្ទះយើង (Pteas Yeung) Platform';
  const logoSrc = getOptimizedImageUrl(dynamicSettings.logo_url) || '/logo/PteasYeung.png';

  return (
    <footer id="contact-section" className="relative border-t border-slate-900 bg-gradient-to-b from-slate-950 via-slate-900 to-black font-sans text-slate-300 scroll-mt-20 overflow-hidden">
      
      {/* Top Ambient Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      
      {/* Background radial highlights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">

        {/* 🟢 TOP SHOWCASE: Modern Newsletter & Community Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/40 p-6 sm:p-8 md:p-10 shadow-2xl mb-12 backdrop-blur-sm">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Newsletter Copy */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={13} className="text-amber-400 animate-pulse" />
                <span>{lang.newsletterBadge}</span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                {lang.newsletterTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
                {lang.newsletterDesc}
              </p>
            </div>

            {/* Newsletter Input Box */}
            <div className="lg:col-span-5 space-y-2">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={lang.enterEmail}
                    disabled={status !== 'idle'}
                    className="w-full pl-10 pr-3 py-3 rounded-2xl border border-slate-700 bg-slate-950/80 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status !== 'idle'}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-indigo-600/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer shrink-0"
                >
                  {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                  {status === 'subscribed' && <CheckCircle2 size={16} className="text-emerald-300" />}
                  {status === 'idle' && <Send size={15} />}
                  <span>{status === 'subscribed' ? (currentLang === 'kh' ? 'បានជាវ!' : 'Subscribed!') : lang.subscribeBtn}</span>
                </button>
              </form>
              <p className="text-[11px] text-slate-500 pl-1">
                {lang.newsletterPrivacy}
              </p>
            </div>
          </div>
        </div>

        {/* 🟢 Trust Highlights Bar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-14">
          {trustHighlights.map(({ icon: Icon, label, sub }, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 transition-all duration-300 hover:border-indigo-500/40 hover:bg-slate-900 hover:shadow-lg hover:shadow-indigo-950/30 group"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-600/10 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-white truncate">{label}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 🟢 Main Navigation Grid (5 Balanced Columns) */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 pb-12">
          
          {/* Column 1: Brand, Bio & ChatGPT-Style Share Action (4 cols) */}
          <div className="space-y-4 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3.5 group outline-none" title={systemName}>
              <img
                src={logoSrc}
                alt={systemName}
                className="h-14 sm:h-16 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-md flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo/PteasYeung.png';
                }}
              />
              <div>
                <span className="flex items-center gap-2 text-xl sm:text-2xl font-black tracking-tight text-white">
                  {systemName}
                  <span className="rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-400 uppercase">
                    VERIFIED
                  </span>
                </span>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{lang.tagline}</p>
              </div>
            </Link>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-400 pr-2">
              {platformBio}
            </p>

            {/* Live System Operational Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{lang.systemOperational}</span>
            </div>

            {/* 🟢 ChatGPT-Style Share Platform Action Pill */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                title={lang.shareTooltip}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 hover:from-indigo-600 hover:to-purple-600 border border-indigo-500/40 hover:border-transparent text-indigo-300 hover:text-white transition-all duration-300 text-xs sm:text-sm font-bold shadow-md hover:shadow-indigo-600/30 active:scale-95 group cursor-pointer"
              >
                <div className="p-1 rounded-lg bg-indigo-500/20 group-hover:bg-white/20 transition text-indigo-300 group-hover:text-white">
                  <Share2 size={15} className="group-hover:scale-110 transition-transform" />
                </div>
                <span>{lang.shareWebsite}</span>
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-[9px] text-indigo-300 font-bold uppercase tracking-wider group-hover:bg-white/20 group-hover:text-white transition">
                  SHARE
                </span>
              </button>
            </div>
          </div>

          {/* Column 2: For Tenants (2 cols) */}
          <div className="lg:col-span-2 sm:col-span-1 space-y-3.5">
            <h4 className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              <DoorOpen size={16} className="text-indigo-400" />
              <span>{lang.forTenantsTitle}</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <Link href="/#rooms-section" className="hover:text-indigo-400 transition-colors">
                  {lang.searchRooms}
                </Link>
              </li>
              <li>
                <Link href="/#rooms-section" className="hover:text-indigo-400 transition-colors">
                  {lang.exploreProperties}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-400 transition-colors">
                  {lang.tenantPortal}
                </Link>
              </li>
              <li>
                <Link href="/#rooms-section" className="hover:text-indigo-400 transition-colors">
                  {lang.howToBook}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-400 transition-colors">
                  {lang.invoicePayGuide}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-indigo-400 transition-colors">
                  {lang.tenantRights}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Landlords (2 cols) */}
          <div className="lg:col-span-2 sm:col-span-1 space-y-3.5">
            <h4 className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              <Building size={16} className="text-emerald-400" />
              <span>{lang.forOwnersTitle}</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                  + {lang.listProperty}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/owner" className="hover:text-emerald-400 transition-colors">
                  {lang.ownerDashboard}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/owner/invoices" className="hover:text-emerald-400 transition-colors">
                  {lang.billingSystem}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/owner/expenses" className="hover:text-emerald-400 transition-colors">
                  {lang.expenseTracking}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/owner/staff" className="hover:text-emerald-400 transition-colors">
                  {lang.staffManagement}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-400 transition-colors">
                  {lang.ownerSupport}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company & Legal (2 cols) */}
          <div className="lg:col-span-2 sm:col-span-1 space-y-3.5">
            <h4 className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              <ShieldCheck size={16} className="text-sky-400" />
              <span>{lang.companyTitle}</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <Link href="/about" className="hover:text-sky-400 transition-colors">
                  {lang.aboutUs}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-sky-400 transition-colors">
                  {lang.contactUs}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-sky-400 transition-colors">
                  {lang.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-sky-400 transition-colors">
                  {lang.termsOfService}
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-sky-400 transition-colors">
                  {lang.security}
                </Link>
              </li>
              <li>
                <Link href="/#rooms-section" className="hover:text-sky-400 transition-colors">
                  {lang.sitemap}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Support & Social Hub (2 cols) */}
          <div className="lg:col-span-2 sm:col-span-1 space-y-3.5">
            <h4 className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              <Headphones size={16} className="text-purple-400" />
              <span>{lang.supportTitle}</span>
            </h4>
            
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="mt-0.5 text-indigo-400 shrink-0" />
                <span className="line-clamp-2">{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="text-emerald-400 shrink-0" />
                <a href={`tel:${hotline.replace(/[^+\d]/g, '')}`} className="font-semibold text-slate-300 hover:text-emerald-400 transition">
                  {hotline}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="text-indigo-400 shrink-0" />
                <a href={`mailto:${email}`} className="truncate hover:text-indigo-400 transition">
                  {email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Send size={14} className="text-sky-400 shrink-0" />
                <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
                  {telegramHandle}
                </a>
              </li>
            </ul>

            {/* Operating Hours Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                <Clock size={12} />
                <span>{operatingHours}</span>
              </div>
              <p className="text-[10px] text-slate-500">{lang.sundaySupport}</p>
            </div>

            {/* 🟢 Social Media Icons Row + Quick Share */}
            <div className="pt-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {lang.socialHeading}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {/* Facebook */}
                <a
                  href={dynamicSettings.footer_facebook || "https://facebook.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 shadow-sm transition-all hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white"
                >
                  <FacebookIcon size={15} />
                </a>

                {/* Telegram */}
                <a
                  href={telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 shadow-sm transition-all hover:border-[#229ED9] hover:bg-[#229ED9] hover:text-white"
                >
                  <Send size={14} />
                </a>

                {/* WhatsApp */}
                <a
                  href="https://whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 shadow-sm transition-all hover:border-[#25D366] hover:bg-[#25D366] hover:text-white"
                >
                  <WhatsAppIcon size={15} />
                </a>

                {/* Instagram */}
                <a
                  href={dynamicSettings.footer_instagram || "https://instagram.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 shadow-sm transition-all hover:border-pink-500 hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-500 hover:to-amber-500 hover:text-white"
                >
                  <InstagramIcon size={15} />
                </a>

                {/* X / Twitter */}
                <a
                  href={dynamicSettings.footer_twitter || "https://twitter.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X / Twitter"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 shadow-sm transition-all hover:border-slate-400 hover:bg-white hover:text-slate-950"
                >
                  <XTwitterIcon size={14} />
                </a>

                {/* Quick Share Trigger Icon Button */}
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  title={lang.shareTooltip}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-500/40 bg-indigo-600/10 text-indigo-400 shadow-sm transition-all hover:border-indigo-500 hover:bg-indigo-600 hover:text-white cursor-pointer"
                  aria-label="Share platform"
                >
                  <Share2 size={14} />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* 🟢 Bottom Bar */}
        <div className="border-t border-slate-800/80 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row text-xs text-slate-400">
            
            {/* Copyright & Made In */}
            <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
              <p className="font-medium text-slate-300">
                © {new Date().getFullYear()} {copyrightText}. {lang.rights}
              </p>
              <span className="hidden sm:inline text-slate-700">•</span>
              <span className="font-semibold text-indigo-400/90">{lang.madeIn}</span>
            </div>

            {/* Quick Links & Back to Top */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link href="/about" className="hover:text-indigo-400 transition">{lang.aboutUs}</Link>
              <Link href="/contact" className="hover:text-indigo-400 transition">{lang.contactUs}</Link>
              <Link href="/privacy" className="hover:text-indigo-400 transition">{lang.privacyPolicy}</Link>
              <Link href="/terms" className="hover:text-indigo-400 transition">{lang.termsOfService}</Link>
              <Link href="/security" className="hover:text-indigo-400 transition">{lang.security}</Link>
              
              <button 
                onClick={scrollToTop} 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer ml-2"
                title={lang.scrollTop}
              >
                <ArrowUp size={12} className="text-indigo-400" />
                <span>{lang.scrollTop}</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* 🟢 ChatGPT-Style Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentLang={currentLang}
      />

    </footer>
  );
}