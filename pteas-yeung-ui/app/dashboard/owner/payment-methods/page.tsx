'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { 
  CreditCard, QrCode, Upload, Save, CheckCircle2, AlertCircle, 
  Building2, User, Phone, Sparkles, Eye, FileText, Loader2, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';
import ReceiptModal, { ReceiptInvoice } from '@/app/components/ReceiptModal';

export default function OwnerPaymentMethodsPage() {
  const { user, setUser } = useAuth();
  const [lang, setLang] = useState<'kh' | 'en'>('kh');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [bankQrFile, setBankQrFile] = useState<File | null>(null);
  const [bankQrPreview, setBankQrPreview] = useState<string>('');
  const bankQrInputRef = useRef<HTMLInputElement>(null);

  // Receipt Preview
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
    if (savedLang) setLang(savedLang);

    if (user) {
      if (user.bank_name) setBankName(user.bank_name);
      if (user.bank_account_name) setBankAccountName(user.bank_account_name);
      if (user.bank_account_number) setBankAccountNumber(user.bank_account_number);
      if (user.payment_instructions) setPaymentInstructions(user.payment_instructions);
      if (user.bank_qr_code) {
        setBankQrPreview(getOptimizedImageUrl(user.bank_qr_code) || user.bank_qr_code);
      }
    }
  }, [user]);

  const bankPresets = [
    'ABA Bank',
    'ACLEDA Bank',
    'Wing Bank',
    'Canadia Bank',
    'Chip Mong Bank',
    'Sathapana Bank'
  ];

  const t = {
    kh: {
      title: 'វិធីសាស្ត្រទូទាត់ប្រាក់ (Payment Method)',
      subtitle: 'កំណត់គណនីធនាគារ និងរូបភាពស្កេន KHQR ដើម្បីឱ្យអ្នកជួលអាចទូទាត់ថ្លៃបន្ទប់បានលឿន និងត្រឹមត្រូវ',
      activeStatus: 'គណនីបានរៀបចំរួចរាល់',
      incompleteStatus: 'មិនទាន់បានបំពេញព័ត៌មានគ្រប់គ្រាន់',
      statusDescActive: 'ព័ត៌មានគណនី និង KHQR នឹងត្រូវបង្ហាញដោយស្វ័យប្រវត្តិនឹងវិក្កយបត្ររបស់អ្នកជួល។',
      statusDescIncomplete: 'សូមបំពេញឈ្មោះធនាគារ លេខគណនី និងរូបភាព KHQR ដើម្បីឱ្យអ្នកជួលអាចស្កេនទូទាត់។',
      formTitle: 'ព័ត៌មានគណនីធនាគារទទួលប្រាក់',
      bankNameLabel: 'ឈ្មោះធនាគារ (Bank Name)',
      selectPreset: 'ជ្រើសរើសធនាគារពេញនិយម៖',
      accNameLabel: 'ឈ្មោះម្ចាស់គណនី (Account Holder Name)',
      accNumberLabel: 'លេខគណនីធនាគារ (Account Number)',
      instructionsLabel: 'សេចក្ដីណែនាំអំពីការបង់ប្រាក់ (Payment Instructions / Remarks)',
      instructionsPlaceholder: 'ឧ. សូមបញ្ជាក់លេខបន្ទប់ក្នុង Remark ពេលផ្ញើប្រាក់ដើម្បីងាយស្រួលផ្ទៀងផ្ទាត់',
      qrTitle: 'រូបភាពស្កេន KHQR Code',
      qrDesc: 'ផ្ទុកឡើងរូបភាព KHQR ពី App ធនាគាររបស់លោកអ្នក (JPG, PNG អតិបរមា 2MB)',
      uploadBtn: 'ជ្រើសរើសរូប QR Code',
      changeBtn: 'ផ្លាស់ប្តូររូបភាពថ្មី',
      removeBtn: 'លុបរូបភាព',
      previewSectionTitle: 'ទម្រង់គំរូដែលអ្នកជួលនឹងបានឃើញ',
      previewReceiptBtn: 'មើលគំរូវិក្កយបត្រ (Preview Invoice)',
      saveBtn: 'រក្សាទុកព័ត៌មានទូទាត់',
      savingBtn: 'កំពុងរក្សាទុក...',
      savedSuccess: 'ព័ត៌មានគណនីទូទាត់ប្រាក់ត្រូវបានរក្សាទុកដោយជោគជ័យ!',
      copyToast: 'បានចម្លងលេខគណនីរួចរាល់!'
    },
    en: {
      title: 'Landlord Payment Methods',
      subtitle: 'Configure your bank account and KHQR code so tenants can scan and settle rent directly',
      activeStatus: 'Payment Method Configured',
      incompleteStatus: 'Setup Incomplete',
      statusDescActive: 'Your bank account and KHQR code will automatically display on tenant invoices and receipts.',
      statusDescIncomplete: 'Please fill in bank name, account number, and upload your KHQR code.',
      formTitle: 'Receiving Bank Account Details',
      bankNameLabel: 'Bank Name',
      selectPreset: 'Quick Bank Presets:',
      accNameLabel: 'Account Holder Name',
      accNumberLabel: 'Bank Account Number',
      instructionsLabel: 'Payment Remarks & Instructions',
      instructionsPlaceholder: 'e.g. Please include your room number in the transaction remark',
      qrTitle: 'KHQR Payment Code Image',
      qrDesc: 'Upload your official KHQR code exported from your mobile banking app (JPG, PNG up to 2MB)',
      uploadBtn: 'Upload KHQR Image',
      changeBtn: 'Change QR Image',
      removeBtn: 'Remove Image',
      previewSectionTitle: 'Live Tenant Payment Preview',
      previewReceiptBtn: 'Preview Sample Invoice / Receipt',
      saveBtn: 'Save Payment Details',
      savingBtn: 'Saving...',
      savedSuccess: 'Payment method updated successfully!',
      copyToast: 'Account number copied!'
    }
  };

  const currentT = t[lang];

  const handleBankQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(lang === 'kh' ? 'ទំហំរូបភាព QR មិនអាចលើសពី 2MB ឡើយ!' : 'QR code image size cannot exceed 2MB!');
        return;
      }
      setBankQrFile(file);
      setBankQrPreview(URL.createObjectURL(file));
    }
  };

  const handleCopyNumber = () => {
    if (!bankAccountNumber) return;
    navigator.clipboard.writeText(bankAccountNumber);
    setCopied(true);
    toast.success(currentT.copyToast);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      if (user?.name) formData.append('name', user.name);
      if (user?.email) formData.append('email', user.email);
      if (user?.phone) formData.append('phone', user.phone);

      formData.append('bank_name', bankName);
      formData.append('bank_account_name', bankAccountName);
      formData.append('bank_account_number', bankAccountNumber);
      formData.append('payment_instructions', paymentInstructions);
      if (bankQrFile) {
        formData.append('bank_qr_code', bankQrFile);
      }

      const res = await api.post('/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data?.user) {
        if (setUser) setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setBankQrFile(null);
        if (res.data.user.bank_qr_code) {
          setBankQrPreview(getOptimizedImageUrl(res.data.user.bank_qr_code) || res.data.user.bank_qr_code);
        }
      }

      toast.success(currentT.savedSuccess);
    } catch (err: any) {
      toast.error(err.response?.data?.message || (lang === 'kh' ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Error updating payment method'));
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = Boolean(bankAccountNumber && (bankName || bankAccountName));

  // Mock invoice for live receipt preview
  const mockInvoice: ReceiptInvoice = {
    id: 201,
    invoice_number: 'INV-00201',
    total_amount: 175.50,
    payment_status: 'unpaid',
    due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    electricity_start_unit: 120,
    electricity_end_unit: 170,
    water_unit: 10,
    booking: {
      id: 70,
      room: {
        id: 15,
        room_number: '204',
        price: 150,
        type: 'បន្ទប់គេង ១ (1 Bedroom)',
        property: {
          id: 4,
          title: 'អគារស្នាក់នៅ ផ្ទះយើង (Pteas Yeung)',
          address: 'រាជធានីភ្នំពេញ',
          owner: {
            id: user?.id || 1,
            name: user?.name || 'ម្ចាស់ផ្ទះ / Landlord',
            phone: user?.phone || '012 345 678',
            email: user?.email || 'owner@pteasyeung.com',
            bank_name: bankName || 'ABA Bank',
            bank_account_name: bankAccountName || user?.name || 'CHHENG SOPHIRAM',
            bank_account_number: bankAccountNumber || '001 234 567',
            bank_qr_code: bankQrPreview || user?.bank_qr_code || '',
            payment_instructions: paymentInstructions || 'សូមបញ្ជាក់លេខបន្ទប់ក្នុង remark ពេលផ្ទេរប្រាក់'
          }
        }
      },
      tenant: {
        id: 12,
        name: 'សួស ចាន់ថន (Chanthon Sous)',
        phone: '098 123 456',
        email: 'chanthon@gmail.com'
      },
      owner: {
        id: user?.id || 1,
        name: user?.name || 'ម្ចាស់ផ្ទះ / Landlord',
        phone: user?.phone || '012 345 678',
        email: user?.email || 'owner@pteasyeung.com',
        bank_name: bankName || 'ABA Bank',
        bank_account_name: bankAccountName || user?.name || 'CHHENG SOPHIRAM',
        bank_account_number: bankAccountNumber || '001 234 567',
        bank_qr_code: bankQrPreview || user?.bank_qr_code || '',
        payment_instructions: paymentInstructions || 'សូមបញ្ជាក់លេខបន្ទប់ក្នុង remark ពេលផ្ទេរប្រាក់'
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="text-indigo-600" />
            {currentT.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {currentT.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowReceiptPreview(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-bold text-xs border border-sky-200 dark:border-sky-800 shadow-xs transition"
        >
          <FileText size={15} />
          <span>{currentT.previewReceiptBtn}</span>
        </button>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-3xl border flex items-center gap-3.5 ${
        isConfigured 
          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300' 
          : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
      }`}>
        <div className={`p-2.5 rounded-2xl ${isConfigured ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600'}`}>
          {isConfigured ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
        </div>
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="text-xs font-black">
            {isConfigured ? currentT.activeStatus : currentT.incompleteStatus}
          </p>
          <p className="text-[11px] opacity-90 leading-relaxed">
            {isConfigured ? currentT.statusDescActive : currentT.statusDescIncomplete}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Main Details */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {currentT.formTitle}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">ABA, ACLEDA, Wing, Canadia, Sathapana</p>
            </div>
          </div>

          {/* Bank Presets */}
          <div className="space-y-2">
            <span className="font-bold text-slate-500 text-[11px] block">{currentT.selectPreset}</span>
            <div className="flex flex-wrap gap-2">
              {bankPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBankName(preset)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                    bankName === preset
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {currentT.bankNameLabel}
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="ABA Bank"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {currentT.accNameLabel}
              </label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="CHHENG SOPHIRAM"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {currentT.accNumberLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="001 234 567"
                  className="w-full p-2.5 pr-20 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm"
                />
                {bankAccountNumber && (
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-[10px] font-bold flex items-center gap-1 transition"
                  >
                    {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {currentT.instructionsLabel}
              </label>
              <textarea
                rows={2}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder={currentT.instructionsPlaceholder}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
              />
            </div>
          </div>
        </div>

        {/* KHQR Image Card & Preview */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600">
              <QrCode size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {currentT.qrTitle}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{currentT.qrDesc}</p>
            </div>
          </div>

          <input
            type="file"
            ref={bankQrInputRef}
            onChange={handleBankQrChange}
            accept="image/*"
            className="hidden"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
            {/* Upload Area */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              <div 
                onClick={() => bankQrInputRef.current?.click()}
                className="w-36 h-36 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1.5 cursor-pointer overflow-hidden shadow-xs hover:border-indigo-500 transition group"
              >
                {bankQrPreview ? (
                  <img 
                    src={bankQrPreview} 
                    alt="KHQR Preview" 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="text-center p-3 text-slate-400">
                    <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <span className="text-[11px] font-bold block">No QR Uploaded</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => bankQrInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
                >
                  <Upload size={14} />
                  <span>{bankQrPreview ? currentT.changeBtn : currentT.uploadBtn}</span>
                </button>
              </div>
            </div>

            {/* Mobile Tenant Card Mockup */}
            <div className="space-y-2">
              <span className="font-bold text-slate-400 text-[11px] flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-500" />
                <span>{currentT.previewSectionTitle}</span>
              </span>

              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-sky-800 dark:text-sky-400 flex items-center gap-1.5">
                    <CreditCard size={12} />
                    <span>{bankName || 'ABA Bank'}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border text-[9px] font-bold text-sky-700 font-mono">
                    KHQR Pay
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-black font-mono text-indigo-700 dark:text-indigo-400">
                      {bankAccountNumber || '001 234 567'}
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                      {bankAccountName || user?.name || 'CHHENG SOPHIRAM'}
                    </p>
                    {paymentInstructions && (
                      <p className="text-[10px] text-slate-500 italic pt-1">
                        💡 {paymentInstructions}
                      </p>
                    )}
                  </div>

                  {bankQrPreview && (
                    <div className="w-16 h-16 rounded-xl bg-white p-1 border border-sky-200 shadow-xs shrink-0">
                      <img 
                        src={bankQrPreview} 
                        alt="KHQR Mini" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => setShowReceiptPreview(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
          >
            <Eye size={15} />
            <span>{currentT.previewReceiptBtn}</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? currentT.savingBtn : currentT.saveBtn}</span>
          </button>
        </div>
      </form>

      {/* Live Sample Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptPreview}
        onClose={() => setShowReceiptPreview(false)}
        invoice={mockInvoice}
        lang={lang}
      />
    </div>
  );
}
