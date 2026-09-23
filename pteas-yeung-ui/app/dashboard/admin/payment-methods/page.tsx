'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { 
  CreditCard, QrCode, Upload, Save, CheckCircle2, AlertCircle, 
  Building2, User, Phone, Sparkles, Eye, FileText, Loader2, Copy, Check,
  Send, Users, Search, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/LanguageContext';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';
import PendingApprovalModal from '@/app/components/PendingApprovalModal';

interface LandlordUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_qr_code?: string;
  payment_instructions?: string;
  status?: string;
}

export default function AdminPaymentMethodsPage() {
  const { language } = useLanguage();
  const isKh = language === 'kh';

  const [activeTab, setActiveTab] = useState<'admin' | 'landlords'>('admin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Admin Payment Settings
  const [adminBankName, setAdminBankName] = useState('');
  const [adminBankAccountName, setAdminBankAccountName] = useState('');
  const [adminBankAccountNumber, setAdminBankAccountNumber] = useState('');
  const [adminBankQrUrl, setAdminBankQrUrl] = useState('');
  const [adminBankQrFile, setBankQrFile] = useState<File | null>(null);
  const [adminHotline, setAdminHotline] = useState('');
  const [adminHotlineSecondary, setAdminHotlineSecondary] = useState('');
  const [adminTelegram, setAdminTelegram] = useState('');
  const [adminNotesKh, setAdminNotesKh] = useState('');
  const [adminNotesEn, setAdminNotesEn] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Modal
  const [showPendingModalPreview, setShowPendingModalPreview] = useState(false);

  // Landlords Data
  const [landlords, setLandlords] = useState<LandlordUser[]>([]);
  const [landlordsLoading, setLandlordsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAdminSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      const data = res.data;
      if (data) {
        setAdminBankName(data.admin_bank_name || 'ABA Bank');
        setAdminBankAccountName(data.admin_bank_account_name || 'PTEAS YEUNG PLATFORM');
        setAdminBankAccountNumber(data.admin_bank_account_number || '001 234 567');
        setAdminBankQrUrl(data.admin_bank_qr_url || '');
        setAdminHotline(data.hotline || '+855 12 345 678');
        setAdminHotlineSecondary(data.admin_hotline_secondary || '+855 98 765 432');
        setAdminTelegram(data.telegram || '@PteasYeungAdmin');
        setAdminNotesKh(data.admin_payment_notes_kh || '');
        setAdminNotesEn(data.admin_payment_notes_en || '');
      }
    } catch (err) {
      console.error('Error fetching admin settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLandlords = async () => {
    setLandlordsLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { role: 'owner' } });
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setLandlords(list);
    } catch (err) {
      console.error('Error fetching landlords:', err);
    } finally {
      setLandlordsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'landlords' && landlords.length === 0) {
      fetchLandlords();
    }
  }, [activeTab]);

  const handleQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(isKh ? 'ទំហំរូបភាពមិនអាចលើសពី 2MB ឡើយ!' : 'File size cannot exceed 2MB!');
        return;
      }
      setBankQrFile(file);
      setAdminBankQrUrl(URL.createObjectURL(file));
    }
  };

  const handleCopy = () => {
    if (!adminBankAccountNumber) return;
    navigator.clipboard.writeText(adminBankAccountNumber);
    setCopied(true);
    toast.success(isKh ? 'បានចម្លងលេខគណនី!' : 'Account number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('admin_bank_name', adminBankName);
      formData.append('admin_bank_account_name', adminBankAccountName);
      formData.append('admin_bank_account_number', adminBankAccountNumber);
      formData.append('admin_hotline_secondary', adminHotlineSecondary);
      formData.append('telegram', adminTelegram);
      formData.append('admin_payment_notes_kh', adminNotesKh);
      formData.append('admin_payment_notes_en', adminNotesEn);

      if (adminBankQrFile) {
        formData.append('admin_bank_qr', adminBankQrFile);
      }

      const res = await api.post('/admin/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.settings?.admin_bank_qr_url) {
        setAdminBankQrUrl(res.data.settings.admin_bank_qr_url);
        setBankQrFile(null);
      }

      toast.success(isKh ? 'បានរក្សាទុកវិធីសាស្ត្រទូទាត់ជោគជ័យ!' : 'Payment settings saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isKh ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Error saving settings'));
    } finally {
      setSaving(false);
    }
  };

  const filteredLandlords = landlords.filter(l => 
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.bank_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600 mb-2" />
        <p className="text-xs font-medium">{isKh ? 'កំពុងទាញយកទិន្នន័យ...' : 'Loading payment settings...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="text-rose-600" />
            <span>{isKh ? 'វិធីសាស្ត្រទូទាត់ប្រាក់ (Payment Methods)' : 'Payment Methods Management'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isKh 
              ? 'គ្រប់គ្រងគណនីធនាគារប្រព័ន្ធ KHQR សម្រាប់ទទួលការចុះឈ្មោះ និងពិនិត្យគណនីរបស់ម្ចាស់ផ្ទះនានា' 
              : 'Configure official platform banking KHQR and inspect landlords receiving accounts'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'admin'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isKh ? 'គណនីប្រព័ន្ធ (Admin KHQR)' : 'Platform Admin KHQR'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('landlords')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'landlords'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users size={14} />
            <span>{isKh ? 'គណនីម្ចាស់ផ្ទះ (Landlords)' : 'Landlords Accounts'}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Admin Platform Payment Details */}
      {activeTab === 'admin' && (
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Main Bank Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    {isKh ? 'គណនីធនាគារផ្លូវការរបស់ប្រព័ន្ធ' : 'Official Platform Bank Credentials'}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isKh ? 'ប្រើសម្រាប់បង្ហាញលើផ្ទាំង Pending Approval ពេលម្ចាស់ផ្ទះចុះឈ្មោះថ្មី' : 'Displayed on registration pending approval modal'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPendingModalPreview(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 font-bold text-xs border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition"
              >
                <Eye size={14} />
                <span>{isKh ? 'មើលគំរូ Pending Modal' : 'Preview Pending Screen'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isKh ? 'ឈ្មោះធនាគារ (Bank Name)' : 'Bank Name'}
                </label>
                <input
                  type="text"
                  value={adminBankName}
                  onChange={(e) => setAdminBankName(e.target.value)}
                  placeholder="ABA Bank"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isKh ? 'ឈ្មោះម្ចាស់គណនី (Account Holder Name)' : 'Account Holder Name'}
                </label>
                <input
                  type="text"
                  value={adminBankAccountName}
                  onChange={(e) => setAdminBankAccountName(e.target.value)}
                  placeholder="PTEAS YEUNG PLATFORM"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isKh ? 'លេខគណនីធនាគារ (Account Number)' : 'Account Number'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={adminBankAccountNumber}
                    onChange={(e) => setAdminBankAccountNumber(e.target.value)}
                    placeholder="001 234 567"
                    className="w-full p-2.5 pr-20 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono font-bold text-rose-600 text-sm"
                  />
                  {adminBankAccountNumber && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* KHQR Upload and Preview */}
            <div className="space-y-3 pt-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                {isKh ? 'រូបភាពស្កេន KHQR ផ្លូវការ' : 'Official Platform KHQR Image'}
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleQrChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1.5 cursor-pointer overflow-hidden shadow-xs hover:border-rose-500 transition shrink-0"
                >
                  {adminBankQrUrl ? (
                    <img 
                      src={getOptimizedImageUrl(adminBankQrUrl) || adminBankQrUrl} 
                      alt="Admin KHQR" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <QrCode className="w-10 h-10 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] font-bold block">No QR Code</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    <Upload size={14} />
                    <span>{adminBankQrUrl ? (isKh ? 'ផ្លាស់ប្តូររូប QR' : 'Change QR Code') : (isKh ? 'ផ្ទុកឡើងរូប KHQR' : 'Upload KHQR Image')}</span>
                  </button>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {isKh 
                      ? 'គាំទ្រទម្រង់ JPG, PNG ទំហំអតិបរមា 2MB។ រូបភាពនេះនឹងត្រូវបង្ហាញនៅលើផ្ទាំង Pending Confirmation សម្រាប់ម្ចាស់ផ្ទះស្កេនបង់ថ្លៃសេវា។' 
                      : 'Supports JPG, PNG up to 2MB. This QR will be shown on the pending confirmation modal for owner subscription payment.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Telegram for Verification */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600">
                <Send size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  {isKh ? 'បណ្តាញផ្ទៀងផ្ទាត់ និងទំនាក់ទំនងបន្ទាន់' : 'Hotlines & Telegram Verification'}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isKh ? 'លេខទូរស័ព្ទ និងគណនី Telegram សម្រាប់ទទួលបង្កាន់ដៃពីម្ចាស់ផ្ទះ' : 'Contacts for receiving payment receipts from landlords'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isKh ? 'លេខ Hotline បន្ទាន់ទី២' : 'Secondary Hotline Number'}
                </label>
                <input
                  type="text"
                  value={adminHotlineSecondary}
                  onChange={(e) => setAdminHotlineSecondary(e.target.value)}
                  placeholder="+855 98 765 432"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isKh ? 'គណនី Telegram Admin សម្រាប់ទទួលបង្កាន់ដៃ' : 'Admin Telegram Support Handle'}
                </label>
                <input
                  type="text"
                  value={adminTelegram}
                  onChange={(e) => setAdminTelegram(e.target.value)}
                  placeholder="@PteasYeungAdmin"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isKh ? 'សេចក្តីណែនាំបង់ប្រាក់ (ភាសាខ្មែរ)' : 'Payment Instructions (Khmer)'}
                </label>
                <textarea
                  rows={2}
                  value={adminNotesKh}
                  onChange={(e) => setAdminNotesKh(e.target.value)}
                  placeholder="ឧ. សូមផ្ញើរូបភាពបង្កាន់ដៃចូល Telegram ដើម្បីបើកដំណើរការគណនី"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isKh ? 'សេចក្តីណែនាំបង់ប្រាក់ (អង់គ្លេស)' : 'Payment Instructions (English)'}
                </label>
                <textarea
                  rows={2}
                  value={adminNotesEn}
                  onChange={(e) => setAdminNotesEn(e.target.value)}
                  placeholder="e.g. Please send the payment screenshot via Telegram to activate your account."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{saving ? (isKh ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKh ? 'រក្សាទុកព័ត៌មានទូទាត់' : 'Save Payment Settings')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Landlords Accounts Overview */}
      {activeTab === 'landlords' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isKh ? 'ស្វែងរកតាមឈ្មោះ ទូរស័ព្ទ ឬធនាគារ...' : 'Search by name, phone, or bank...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium"
              />
            </div>

            <button
              type="button"
              onClick={fetchLandlords}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition self-end sm:self-auto"
            >
              <RefreshCw size={13} className={landlordsLoading ? 'animate-spin' : ''} />
              <span>{isKh ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
            </button>
          </div>

          {/* Landlords Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{isKh ? 'ម្ចាស់ផ្ទះ (Landlord)' : 'Landlord'}</th>
                    <th className="py-3 px-4">{isKh ? 'ធនាគារ & លេខគណនី' : 'Bank & Account'}</th>
                    <th className="py-3 px-4">{isKh ? 'ឈ្មោះគណនី' : 'Account Name'}</th>
                    <th className="py-3 px-4 text-center">{isKh ? 'KHQR Code' : 'KHQR Status'}</th>
                    <th className="py-3 px-4">{isKh ? 'សេចក្តីណែនាំអ្នកជួល' : 'Tenant Instructions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {landlordsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
                        <span>{isKh ? 'កំពុងទាញយកទិន្នន័យម្ចាស់ផ្ទះ...' : 'Loading landlords...'}</span>
                      </td>
                    </tr>
                  ) : filteredLandlords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        {isKh ? 'មិនមានទិន្នន័យម្ចាស់ផ្ទះឡើយ' : 'No landlords found'}
                      </td>
                    </tr>
                  ) : (
                    filteredLandlords.map((landlord) => {
                      const hasPayment = Boolean(landlord.bank_account_number);
                      const qrUrl = landlord.bank_qr_code ? getOptimizedImageUrl(landlord.bank_qr_code) : null;

                      return (
                        <tr key={landlord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{landlord.name}</p>
                            <p className="text-[10px] text-slate-400">{landlord.phone || landlord.email}</p>
                          </td>
                          <td className="py-3 px-4">
                            {hasPayment ? (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                                  {landlord.bank_name || 'Bank'}
                                </span>
                                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                                  {landlord.bank_account_number}
                                </p>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                {isKh ? 'មិនទាន់កំណត់' : 'Not configured'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold uppercase text-slate-700 dark:text-slate-300">
                            {landlord.bank_account_name || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {qrUrl ? (
                              <div className="w-10 h-10 rounded-lg bg-white p-0.5 border border-slate-200 mx-auto shadow-xs">
                                <img 
                                  src={qrUrl} 
                                  alt="KHQR" 
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                {isKh ? 'គ្មាន QR' : 'No QR'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs truncate">
                            {landlord.payment_instructions || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Live Sample Pending Modal */}
      <PendingApprovalModal
        isOpen={showPendingModalPreview}
        onClose={() => setShowPendingModalPreview(false)}
        userName="Sample Property Owner"
        userRole="owner"
        lang={isKh ? 'kh' : 'en'}
      />
    </div>
  );
}
