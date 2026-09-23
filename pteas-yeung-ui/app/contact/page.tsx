'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PhoneCall, Mail, MapPin, Send, Clock, Headphones, 
  MessageSquare, CheckCircle2, Loader2, Sparkles, Building,
  ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';

interface SystemSettings {
  system_name?: string;
  footer_hotline?: string;
  footer_email?: string;
  footer_telegram?: string;
  footer_address_kh?: string;
  footer_address_en?: string;
  footer_operating_hours_kh?: string;
  footer_operating_hours_en?: string;
}

export default function ContactPage() {
  const { lang, setLang } = useLanguage();
  const isKh = lang === 'kh';

  const [settings, setSettings] = useState<SystemSettings>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.data) setSettings(res.data);
      } catch {
        // Fallback
      }
    };
    fetchSettings();
  }, []);

  const t = {
    kh: {
      badge: 'មជ្ឈមណ្ឌលទំនាក់ទំនង & ជំនួយ',
      title: 'ទំនាក់ទំនងមកកាន់',
      titleHighlight: 'ក្រុមការងារ Pteas Yeung',
      subtitle: 'យើងរីករាយនឹងជួយឆ្លើយតបរាល់ចម្ងល់របស់អ្នក អំពីការស្វែងរកបន្ទប់ ការគ្រប់គ្រងផ្ទះជួល ឬបញ្ហាបច្ចេកទេសផ្សេងៗ។',
      
      // Cards
      phoneTitle: 'ទូរស័ព្ទ / Hotline',
      phoneDesc: 'ទំនាក់ទំនងផ្ទាល់ក្នុងម៉ោងធ្វើការ',
      emailTitle: 'អ៊ីមែលផ្លូវការ',
      emailDesc: 'ឆ្លើយតបយ៉ាងលឿនក្នុងរយៈពេល ២៤ ម៉ោង',
      telegramTitle: 'Telegram Channel',
      telegramDesc: 'ប្រឹក្សារហ័សតាមប្រព័ន្ធអនឡាញ',
      addressTitle: 'ទីតាំងការិយាល័យ',
      addressDesc: 'រាជធានីភ្នំពេញ, ព្រះរាជាណាចក្រកម្ពុជា',
      hoursTitle: 'ម៉ោងបម្រើការងារ',
      hoursDesc: 'ច័ន្ទ - អាទិត្យ (8:00 ព្រឹក - 9:00 យប់)',

      // Form
      formTitle: 'ផ្ញើសារមកកាន់ពួកយើង',
      formSubtitle: 'សូមបំពេញព័ត៌មានខាងក្រោម ក្រុមការងារយើងនឹងទាក់ទងត្រឡប់ទៅវិញឆាប់ៗនេះ។',
      nameLabel: 'ឈ្មោះពេញរបស់អ្នក',
      namePlaceholder: 'ឧ. សុខ ចាន់ដារ៉ា',
      emailLabel: 'អាសយដ្ឋានអ៊ីមែល',
      emailPlaceholder: 'example@gmail.com',
      phoneLabel: 'លេខទូរស័ព្ទ',
      phonePlaceholder: '012 345 678',
      subjectLabel: 'ប្រធានបទ / មូលហេតុនៃការទាក់ទង',
      subGeneral: 'សាកសួរព័ត៌មានទូទៅ',
      subBooking: 'ជំនួយក្នុងការកក់បន្ទប់ជួល',
      subOwner: 'ការចុះឈ្មោះដាក់ផ្ទះជួល (Landlord)',
      subBilling: 'បញ្ហាវិក្កយបត្រ ឬការទូទាត់ប្រាក់',
      subTech: 'រាយការណ៍បញ្ហាបច្ចេកទេស Website',
      messageLabel: 'សាររបស់អ្នក',
      messagePlaceholder: 'សរសេរសារ ឬចម្ងល់របស់អ្នកនៅទីនេះ...',
      sendBtn: 'ផ្ញើសារឥឡូវនេះ',
      sendingBtn: 'កំពុងផ្ញើសារ...',
      successMsg: 'សាររបស់អ្នកត្រូវបានផ្ញើដោយជោគជ័យ! យើងនឹងទាក់ទងទៅវិញឆាប់ៗ។',

      // Side Info
      faqTitle: 'សំណួរដែលសួរញឹកញាប់',
      faq1Q: 'តើខ្ញុំអាចកក់បន្ទប់ជួលដោយរបៀបណា?',
      faq1A: 'អ្នកអាចចុចលើបន្ទប់ដែលពេញចិត្ត រួចចុចប៊ូតុង "កក់បន្ទប់" និងជ្រើសរើសកាលបរិច្ឆេទចូលស្នាក់នៅ។',
      faq2Q: 'តើខ្ញុំជាម្ចាស់ផ្ទះ អាចដាក់បន្ទប់ជួលដោយរបៀបណា?',
      faq2A: 'ចុះឈ្មោះគណនីជា "ម្ចាស់ផ្ទះ (Owner)" រួចចូលទៅកាន់ Owner Panel ដើម្បីបន្ថែមអគារ និងបន្ទប់របស់អ្នក។',
      aboutLink: 'ស្វែងយល់បន្ថែមអំពីពួកយើង',
    },
    en: {
      badge: 'CONTACT & SUPPORT CENTER',
      title: 'Get in Touch with',
      titleHighlight: 'Pteas Yeung Team',
      subtitle: 'We are here to answer all your questions about finding rental rooms, managing properties, or technical assistance.',
      
      // Cards
      phoneTitle: 'Direct Hotline',
      phoneDesc: 'Call us directly during business hours',
      emailTitle: 'Official Email',
      emailDesc: 'Prompt reply within 24 hours',
      telegramTitle: 'Telegram Channel',
      telegramDesc: 'Quick online advisory & chat',
      addressTitle: 'Office Address',
      addressDesc: 'Phnom Penh, Kingdom of Cambodia',
      hoursTitle: 'Operating Hours',
      hoursDesc: 'Mon - Sun (8:00 AM - 9:00 PM)',

      // Form
      formTitle: 'Send Us a Message',
      formSubtitle: 'Fill out the form below and our team will get back to you promptly.',
      nameLabel: 'Full Name',
      namePlaceholder: 'e.g. John Doe',
      emailLabel: 'Email Address',
      emailPlaceholder: 'example@gmail.com',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '012 345 678',
      subjectLabel: 'Inquiry Subject',
      subGeneral: 'General Inquiry',
      subBooking: 'Room Booking Assistance',
      subOwner: 'List Rental Property (Landlord)',
      subBilling: 'Invoice & Payment Queries',
      subTech: 'Technical or Website Support',
      messageLabel: 'Your Message',
      messagePlaceholder: 'Please type your questions or details here...',
      sendBtn: 'Send Message Now',
      sendingBtn: 'Sending Message...',
      successMsg: 'Your message has been sent successfully! We will contact you soon.',

      // Side Info
      faqTitle: 'Frequently Asked Questions',
      faq1Q: 'How do I book a rental room?',
      faq1A: 'Browse the available rooms, click on your preferred room, and choose "Book Room" with your intended move-in date.',
      faq2Q: 'How do I list my property as a landlord?',
      faq2A: 'Register an "Owner" account, then access your Owner Panel to add your property units and set utility rates.',
      aboutLink: 'Learn more about our platform',
    }
  };

  const currentT = isKh ? t.kh : t.en;

  const hotline = settings.footer_hotline || '+855 12 345 678';
  const email = settings.footer_email || 'support@pteasyeung.com';
  const telegram = settings.footer_telegram || 'https://t.me/pteasyeung_support';
  const telegramHandle = telegram.replace(/^https?:\/\/t\.me\//, '@');
  const address = isKh 
    ? (settings.footer_address_kh || currentT.addressDesc)
    : (settings.footer_address_en || currentT.addressDesc);
  const hours = isKh
    ? (settings.footer_operating_hours_kh || currentT.hoursDesc)
    : (settings.footer_operating_hours_en || currentT.hoursDesc);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error(isKh ? 'សូមបំពេញព័ត៌មានដែលចាំបាច់!' : 'Please fill in required fields!');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success(currentT.successMsg, { icon: '✉️' });
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'general',
        message: '',
      });
      setTimeout(() => setSubmitted(false), 5000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div>
        {/* Navigation Bar */}
        <Navbar currentLang={lang} onLangChange={setLang} />

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20 border-b border-slate-100 dark:border-slate-800/80 bg-linear-to-b from-slate-50 via-white to-white dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-6 sm:px-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider shadow-xs">
              <Headphones size={14} />
              <span>{currentT.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.2]">
              {currentT.title}{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-emerald-500 dark:from-indigo-400 dark:to-emerald-400">
                {currentT.titleHighlight}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              {currentT.subtitle}
            </p>
          </div>
        </section>

        {/* Contact Information Cards */}
        <section className="py-12 max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Phone Card */}
            <a 
              href={`tel:${hotline.replace(/[^+\d]/g, '')}`}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 group-hover:scale-110 transition-transform">
                <PhoneCall size={22} />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">{currentT.phoneTitle}</h3>
              <p className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">{hotline}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{currentT.phoneDesc}</p>
            </a>

            {/* Email Card */}
            <a 
              href={`mailto:${email}`}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 group-hover:scale-110 transition-transform">
                <Mail size={22} />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">{currentT.emailTitle}</h3>
              <p className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 truncate">{email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{currentT.emailDesc}</p>
            </a>

            {/* Telegram Card */}
            <a 
              href={telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-400 dark:hover:border-sky-600 transition group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800 group-hover:scale-110 transition-transform">
                <Send size={22} />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">{currentT.telegramTitle}</h3>
              <p className="font-mono font-bold text-sm text-sky-600 dark:text-sky-400 truncate">{telegramHandle}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{currentT.telegramDesc}</p>
            </a>

            {/* Hours Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <Clock size={22} />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">{currentT.hoursTitle}</h3>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 leading-snug">{hours}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin size={12} className="text-rose-500 shrink-0" />
                <span className="truncate">{address}</span>
              </p>
            </div>
          </div>
        </section>

        {/* Form & Support Side-by-Side */}
        <section className="py-8 sm:py-12 max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Contact Form (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare size={22} className="text-indigo-600" />
                  <span>{currentT.formTitle}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{currentT.formSubtitle}</p>
              </div>

              {submitted && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>{currentT.successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-slate-300 font-bold">{currentT.nameLabel} *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={currentT.namePlaceholder}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-slate-300 font-bold">{currentT.emailLabel} *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={currentT.emailPlaceholder}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-slate-300 font-bold">{currentT.phoneLabel}</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={currentT.phonePlaceholder}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-slate-300 font-bold">{currentT.subjectLabel}</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                    >
                      <option value="general">{currentT.subGeneral}</option>
                      <option value="booking">{currentT.subBooking}</option>
                      <option value="owner">{currentT.subOwner}</option>
                      <option value="billing">{currentT.subBilling}</option>
                      <option value="tech">{currentT.subTech}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">{currentT.messageLabel} *</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={currentT.messagePlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{currentT.sendingBtn}</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>{currentT.sendBtn}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Support & Quick Answers (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Quick FAQ Box */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-5">
                <div className="flex items-center gap-2">
                  <HelpCircle size={20} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-black text-slate-900 dark:text-white text-base">{currentT.faqTitle}</h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 space-y-1.5">
                    <p className="font-bold text-slate-900 dark:text-white">{currentT.faq1Q}</p>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{currentT.faq1A}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 space-y-1.5">
                    <p className="font-bold text-slate-900 dark:text-white">{currentT.faq2Q}</p>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{currentT.faq2A}</p>
                  </div>
                </div>

                <Link
                  href="/about"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                >
                  <span>{currentT.aboutLink}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Verified Trust Card */}
              <div className="p-6 rounded-3xl bg-linear-to-br from-indigo-900 to-slate-900 text-white space-y-3 border border-indigo-800/40">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={18} />
                  <span>Pteas Yeung Trust Guarantee</span>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed">
                  {isKh 
                    ? 'រាល់ព័ត៌មានបន្ទប់ជួល និងវិក្កយបត្រត្រូវបានត្រួតពិនិត្យ និងការពារយ៉ាងម៉ត់ចត់។ ប្រសិនបើមានបញ្ហាណាមួយកើតឡើង ក្រុមការងារយើងនឹងជួយអន្តរាគមន៍ដោះស្រាយភ្លាមៗ។'
                    : 'Every listed rental room and payment receipt is strictly audited. Our support team is ready to intervene and assist if any discrepancies arise.'}
                </p>
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
