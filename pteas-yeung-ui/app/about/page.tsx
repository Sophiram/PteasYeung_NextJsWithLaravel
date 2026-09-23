'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, DoorOpen, ShieldCheck, Zap, Droplets, Users, 
  PhoneCall, Mail, MapPin, Send, ArrowRight, CheckCircle2, 
  Sparkles, Target, Compass, HeartHandshake, Shield, Clock,
  FileText, Award, Layers
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutPage() {
  const { lang, setLang } = useLanguage();
  const isKh = lang === 'kh';

  const t = {
    kh: {
      badge: 'អំពីវេទិកា ផ្ទះយើង',
      heroTitlePrefix: 'ការផ្លាស់ប្តូរបទពិសោធន៍',
      heroTitleHighlight: 'គ្រប់គ្រងផ្ទះជួល & បន្ទប់ជួល',
      heroTitleSuffix: 'នៅកម្ពុជា',
      heroDesc: 'ផ្ទះយើង (Pteas Yeung) គឺជាវេទិកាបច្ចេកវិទ្យាឌីជីថលឆ្លាតវៃដែលបង្កើតឡើងដើម្បីជួយសម្រួលដល់ម្ចាស់ផ្ទះជួល អគារស្នាក់នៅ និងអ្នកជួលក្នុងការស្វែងរកបន្ទប់ គ្រប់គ្រងកុងទ័រភ្លើង-ទឹកស្វ័យប្រវត្ត ចេញវិក្កយបត្រផ្លូវការ និងតាមដានចំណូលចំណាយប្រកបដោយតម្លាភាព។',
      contactBtn: 'ទំនាក់ទំនងមកយើង',
      browseBtn: 'ស្វែងរកបន្ទប់ជួល',

      // Mission & Vision
      missionTitle: 'បេសកកម្មរបស់យើង (Our Mission)',
      missionDesc: 'ផ្តល់ជូននូវដំណោះស្រាយបច្ចេកវិទ្យាគ្រប់គ្រងអចលនទ្រព្យជួលដ៏សាមញ្ញ ច្បាស់លាស់ និងមានសុវត្ថិភាពបំផុត ដើម្បីជួយម្ចាស់ផ្ទះសន្សំពេលវេលា និងបង្កើនទំនុកចិត្តជាមួយអ្នកជួល។',
      visionTitle: 'ចក្ខុវិស័យរបស់យើង (Our Vision)',
      visionDesc: 'ក្លាយជាវេទិកាអេកូឡូស៊ីឈានមុខគេនៅកម្ពុជាសម្រាប់ការជួល និងគ្រប់គ្រងបន្ទប់ជួល ផ្ទះល្វែង និងខុនដូ ដោយប្រើប្រាស់ប្រព័ន្ធស្វ័យប្រវត្តិកម្មទំនើប។',

      // Values
      valuesTitle: 'គុណតម្លៃស្នូលរបស់យើង',
      valuesSubtitle: 'គោលការណ៍ដែលយើងប្រកាន់ខ្ជាប់ក្នុងគ្រប់ជំហាននៃការអភិវឌ្ឍប្រព័ន្ធ',
      val1Title: 'តម្លាភាព និងភាពត្រឹមត្រូវ',
      val1Desc: 'ការគណនាថ្លៃជួល បន្ទុកអគ្គិសនី និងទឹកមានតួលេខច្បាស់លាស់ មិនមានកម្រៃលាក់បាំង។',
      val2Title: 'ភាពងាយស្រួល និងរហ័ស',
      val2Desc: 'រចនាឡើងដើម្បីផ្តល់ភាពងាយស្រួល ប្រើប្រាស់បានទាំងលើកុំព្យូទ័រ និងទូរស័ព្ទដៃគ្រប់ពេលវេលា។',
      val3Title: 'សុវត្ថិភាពទិន្នន័យកម្រិតខ្ពស់',
      val3Desc: 'ការពារព័ត៌មានផ្ទាល់ខ្លួន និងប្រវត្តិប្រតិបត្តិការជាមួយប្រព័ន្ធសុវត្ថិភាពទំនើប និង Audit Logs។',
      val4Title: 'សេវាកម្មយកចិត្តទុកដាក់',
      val4Desc: 'ក្រុមការងារបច្ចេកទេស និងជំនួយការត្រៀមជួយសម្របសម្រួល និងដោះស្រាយបញ្ហា ២៤/៧។',

      // Stats
      stat1Number: '100+',
      stat1Label: 'អគារ និងផ្ទះជួល',
      stat2Number: '1,200+',
      stat2Label: 'បន្ទប់ត្រូវបានគ្រប់គ្រង',
      stat3Number: '99.9%',
      stat3Label: 'ភាពត្រឹមត្រូវនៃវិក្កយបត្រ',
      stat4Number: '24/7',
      stat4Label: 'ជំនួយបច្ចេកទេស & ប្រឹក្សា',

      // Solutions
      solutionsTitle: 'ដំណោះស្រាយឆ្លាតវៃសម្រាប់មនុស្សគ្រប់គ្នា',
      solutionsSubtitle: 'ប្រព័ន្ធ Pteas Yeung ត្រូវបានរចនាឡើងដើម្បីឆ្លើយតបគ្រប់តម្រូវការ',
      forTenants: 'សម្រាប់អ្នកជួល (Tenants)',
      forTenantsDesc: 'ស្វែងរកបន្ទប់ជួលដែលទុកចិត្តបាន ពិនិត្យតម្លៃបន្ទប់ពិតប្រាកដ កក់បន្ទប់ភ្លាមៗ និងទទួលវិក្កយបត្រ/បង្កាន់ដៃផ្លូវការតាមប្រព័ន្ធឌីជីថល។',
      forOwners: 'សម្រាប់ម្ចាស់ផ្ទះ (Landlords & Owners)',
      forOwnersDesc: 'គ្រប់គ្រងអគារ បន្ទប់ និងអ្នកជួលនៅកន្លែងតែមួយ។ គណនាកុងទ័រភ្លើង-ទឹកស្វ័យប្រវត្ត បង្កើតវិក្កយបត្របង់ប្រាក់ និងតាមដានចំណូលចំណាយច្បាស់លាស់។',
      forStaff: 'សម្រាប់បុគ្គលិកអគារ (Building Staff)',
      forStaffDesc: 'កត់ត្រាការប្រមូលប្រាក់ពីអ្នកជួល ចេញបង្កាន់ដៃទទួលប្រាក់ជាផ្លូវការ និងពិនិត្យស្ថានភាពបន្ទប់បានឆាប់រហ័ស។',

      // Contact CTA
      contactCtaBadge: 'ត្រូវការជំនួយ ឬចង់សាកសួរ?',
      contactCtaTitle: 'ត្រៀមខ្លួនក្នុងការបង្កើនប្រសិទ្ធភាពគ្រប់គ្រងផ្ទះជួលហើយឬនៅ?',
      contactCtaDesc: 'ទាក់ទងមកកាន់ក្រុមការងារ Pteas Yeung ដើម្បីទទួលបានការណែនាំពីការប្រើប្រាស់ ការចុះឈ្មោះដាក់ផ្ទះជួល ឬដំណោះស្រាយបន្ថែម។',
      contactCtaBtn: 'ទៅកាន់ទំព័រទំនាក់ទំនង',
      directContact: 'ឬទាក់ទងមកយើងដោយផ្ទាល់៖',
    },
    en: {
      badge: 'ABOUT PTEAS YEUNG PLATFORM',
      heroTitlePrefix: 'Transforming',
      heroTitleHighlight: 'Rental Property & Room Management',
      heroTitleSuffix: 'in Cambodia',
      heroDesc: 'Pteas Yeung is a modern, smart property technology platform built to streamline room discovery, automated utility calculations (electricity & water), dynamic official receipt & invoice issuance, and transparent income-expense tracking for landlords and tenants.',
      contactBtn: 'Contact Us',
      browseBtn: 'Browse Rooms',

      // Mission & Vision
      missionTitle: 'Our Mission',
      missionDesc: 'To deliver simple, transparent, and secure technology solutions for rental management that save property owners time and build lasting trust with tenants.',
      visionTitle: 'Our Vision',
      visionDesc: 'To become Cambodia’s leading digital ecosystem for rental housing, apartment, and room management through intelligent automation.',

      // Values
      valuesTitle: 'Our Core Values',
      valuesSubtitle: 'The foundational principles guiding every feature we create',
      val1Title: 'Transparency & Accuracy',
      val1Desc: 'Accurate utility meter records and itemized billing with zero hidden fees.',
      val2Title: 'Speed & Simplicity',
      val2Desc: 'Intuitive interface accessible anytime from desktops, tablets, and smartphones.',
      val3Title: 'High-Level Data Security',
      val3Desc: 'Comprehensive security measures, role-based access, and enterprise audit logging.',
      val4Title: 'Dedicated 24/7 Support',
      val4Desc: 'Responsive team always ready to assist landlords, building managers, and tenants.',

      // Stats
      stat1Number: '100+',
      stat1Label: 'Managed Properties',
      stat2Number: '1,200+',
      stat2Label: 'Rooms Listed & Handled',
      stat3Number: '99.9%',
      stat3Label: 'Billing Accuracy Rate',
      stat4Number: '24/7',
      stat4Label: 'Technical Support',

      // Solutions
      solutionsTitle: 'Smart Solutions for Everyone',
      solutionsSubtitle: 'Tailored specifically for the Cambodian rental ecosystem',
      forTenants: 'For Tenants',
      forTenantsDesc: 'Effortlessly discover verified rooms, book leases without stress, and receive authentic digital invoices & official stamped payment receipts.',
      forOwners: 'For Landlords & Owners',
      forOwnersDesc: 'Manage multiple buildings, units, and tenants seamlessly. Calculate meter readings automatically, track expenses, and view live revenue metrics.',
      forStaff: 'For Building Staff',
      forStaffDesc: 'Collect rental payments smoothly, print official receipts, and manage daily property operations with confidence.',

      // Contact CTA
      contactCtaBadge: 'NEED ASSISTANCE OR HAVE QUESTIONS?',
      contactCtaTitle: 'Ready to elevate your property management experience?',
      contactCtaDesc: 'Reach out to the Pteas Yeung team for personalized onboarding, listing your properties, or answering any technical questions.',
      contactCtaBtn: 'Go to Contact Page',
      directContact: 'Or contact us directly via:',
    }
  };

  const currentT = isKh ? t.kh : t.en;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div>
        {/* Navigation Bar */}
        <Navbar currentLang={lang} onLangChange={setLang} />

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-100 dark:border-slate-800/80 bg-linear-to-b from-slate-50 via-white to-white dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950">
          {/* Subtle Ambient Background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 dark:bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-emerald-500/10 dark:bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles size={14} />
              <span>{currentT.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.2]">
              {currentT.heroTitlePrefix}{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 via-indigo-500 to-emerald-500 dark:from-indigo-400 dark:via-sky-400 dark:to-emerald-400">
                {currentT.heroTitleHighlight}
              </span>{' '}
              {currentT.heroTitleSuffix}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
              {currentT.heroDesc}
            </p>

            {/* Quick Action Navigation with Contact & Browse */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 hover:shadow-lg transition flex items-center gap-2 group"
              >
                <PhoneCall size={16} />
                <span>{currentT.contactBtn}</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/#rooms-section"
                className="px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-xs transition flex items-center gap-2"
              >
                <DoorOpen size={16} className="text-indigo-500" />
                <span>{currentT.browseBtn}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-br from-indigo-50/70 via-white to-white dark:from-slate-900/90 dark:via-slate-900/40 dark:to-slate-950 border border-indigo-100 dark:border-indigo-900/40 shadow-sm relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-800 transition duration-300">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <Target size={28} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-3">
                {currentT.missionTitle}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {currentT.missionDesc}
              </p>
            </div>

            {/* Vision Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-br from-emerald-50/70 via-white to-white dark:from-slate-900/90 dark:via-slate-900/40 dark:to-slate-950 border border-emerald-100 dark:border-emerald-900/40 shadow-sm relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-800 transition duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Compass size={28} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-3">
                {currentT.visionTitle}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {currentT.visionDesc}
              </p>
            </div>
          </div>
        </section>

        {/* Key Platform Solutions (Who We Serve) */}
        <section className="py-16 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200/70 dark:border-slate-800/70">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
                {currentT.solutionsTitle}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
                {currentT.solutionsSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Tenant Solution */}
              <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800">
                  <DoorOpen size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentT.forTenants}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {currentT.forTenantsDesc}
                </p>
              </div>

              {/* Owner Solution */}
              <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-4 hover:shadow-md transition relative">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  <Building2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentT.forOwners}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {currentT.forOwnersDesc}
                </p>
              </div>

              {/* Staff Solution */}
              <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentT.forStaff}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {currentT.forStaffDesc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
              {currentT.valuesTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
              {currentT.valuesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-3 hover:border-indigo-400 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">{currentT.val1Title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{currentT.val1Desc}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-3 hover:border-indigo-400 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Zap size={20} />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">{currentT.val2Title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{currentT.val2Desc}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-3 hover:border-indigo-400 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Shield size={20} />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">{currentT.val3Title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{currentT.val3Desc}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-3 hover:border-indigo-400 transition">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">{currentT.val4Title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{currentT.val4Desc}</p>
            </div>
          </div>
        </section>

        {/* Metrics & Platform Stats */}
        <section className="py-12 bg-slate-950 text-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              <div className="pt-4 lg:pt-0">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-indigo-400">{currentT.stat1Number}</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">{currentT.stat1Label}</p>
              </div>
              <div className="pt-4 lg:pt-0">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400">{currentT.stat2Number}</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">{currentT.stat2Label}</p>
              </div>
              <div className="pt-4 lg:pt-0">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-sky-400">{currentT.stat3Number}</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">{currentT.stat3Label}</p>
              </div>
              <div className="pt-4 lg:pt-0">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-400">{currentT.stat4Number}</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">{currentT.stat4Label}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Contact CTA Section (Links with Contact) */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-6 sm:px-8">
          <div className="rounded-3xl p-8 sm:p-12 lg:p-16 bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-2xl relative overflow-hidden border border-indigo-800/50">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
            <div className="relative max-w-3xl mx-auto text-center space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-bold uppercase tracking-wider">
                <HeartHandshake size={14} />
                <span>{currentT.contactCtaBadge}</span>
              </span>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                {currentT.contactCtaTitle}
              </h2>

              <p className="text-sm sm:text-base text-indigo-200 leading-relaxed font-normal">
                {currentT.contactCtaDesc}
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 group"
                >
                  <PhoneCall size={18} />
                  <span>{currentT.contactCtaBtn}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform text-indigo-600" />
                </Link>
                <a
                  href="https://t.me/pteasyeung_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-indigo-400/40 bg-indigo-900/40 hover:bg-indigo-900/70 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} className="text-sky-400" />
                  <span>Telegram Support</span>
                </a>
              </div>

              {/* Quick direct contact badges */}
              <div className="pt-8 border-t border-indigo-800/60 flex flex-wrap items-center justify-center gap-6 text-xs text-indigo-200">
                <a href="tel:+85512345678" className="flex items-center gap-1.5 hover:text-white transition">
                  <PhoneCall size={14} className="text-emerald-400" />
                  <span>+855 12 345 678</span>
                </a>
                <span className="hidden sm:inline opacity-40">•</span>
                <a href="mailto:support@pteasyeung.com" className="flex items-center gap-1.5 hover:text-white transition">
                  <Mail size={14} className="text-indigo-400" />
                  <span>support@pteasyeung.com</span>
                </a>
                <span className="hidden sm:inline opacity-40">•</span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-rose-400" />
                  <span>Phnom Penh, Cambodia</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Component */}
      <Footer currentLang={lang} />
    </div>
  );
}
