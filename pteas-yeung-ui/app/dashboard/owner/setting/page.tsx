'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { 
  Settings, Building2, Zap, Droplets, Bell, Shield, 
  Save, CheckCircle2, Server, HelpCircle, Phone, Send,
  CreditCard, QrCode, Upload, Eye, FileText, Loader2,
  Database, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';
import ReceiptModal, { ReceiptInvoice } from '@/app/components/ReceiptModal';

export default function OwnerSettingsPage() {
  const { user, setUser } = useAuth();
  const [lang, setLang] = useState<'kh' | 'en'>('kh');
  const [saving, setSaving] = useState(false);

  // Settings states
  const [contactPhone, setContactPhone] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [elecRate, setElecRate] = useState('0.25');
  const [waterRate, setWaterRate] = useState('0.60');
  const [dueDay, setDueDay] = useState('5');
  const [depositMonths, setDepositMonths] = useState('1');
  const [notifyBookings, setNotifyBookings] = useState(true);
  const [notifyPayments, setNotifyPayments] = useState(true);

  // Landlord Payment Method states
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [bankQrFile, setBankQrFile] = useState<File | null>(null);
  const [bankQrPreview, setBankQrPreview] = useState<string>('');
  const bankQrInputRef = useRef<HTMLInputElement>(null);

  // Receipt Preview state
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [exportingBackup, setExportingBackup] = useState<string | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
    if (savedLang) setLang(savedLang);

    // Initialize from localStorage or user data
    const savedSettings = localStorage.getItem('owner_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setContactPhone(parsed.contactPhone || user?.phone || '');
        setTelegramHandle(parsed.telegramHandle || '');
        setElecRate(parsed.elecRate || '0.25');
        setWaterRate(parsed.waterRate || '0.60');
        setDueDay(parsed.dueDay || '5');
        setDepositMonths(parsed.depositMonths || '1');
        setNotifyBookings(parsed.notifyBookings ?? true);
        setNotifyPayments(parsed.notifyPayments ?? true);
      } catch (e) {
        // fallback
      }
    } else {
      setContactPhone(user?.phone || '');
    }

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

  const t = {
    kh: {
      title: 'ការកំណត់ប្រព័ន្ធម្ចាស់ផ្ទះ',
      subtitle: 'កំណត់តម្លៃគណនាភ្លើង-ទឹកស្វ័យប្រវត្តិ គណនីធនាគារ/KHQR ព័ត៌មានអាជីវកម្ម និងការជូនដំណឹងផ្សេងៗ',
      businessSection: 'ព័ត៌មានអាជីវកម្ម និងទំនាក់ទំនង',
      businessDesc: 'ព័ត៌មានទាំងនេះនឹងត្រូវបានបង្ហាញនៅលើវិក្កយបត្រជូនអ្នកជួល',
      bizNameLabel: 'ឈ្មោះអាជីវកម្ម / អគារស្នាក់នៅ',
      phoneLabel: 'លេខទូរស័ព្ទទាក់ទងបន្ទាន់',
      telegramLabel: 'គណនី Telegram សម្រាប់ទទួលការកក់',
      paymentSection: 'គណនីទូទាត់ប្រាក់ និង KHQR (Payment Method)',
      paymentDesc: 'កំណត់គណនីធនាគារ និងរូបភាពស្កេន KHQR ដើម្បីឱ្យអ្នកជួលអាចផ្ទេរប្រាក់ផ្ទាល់មកលោកអ្នក',
      bankNameLabel: 'ឈ្មោះធនាគារ (ឧ. ABA Bank, Wing, Canadia)',
      accNameLabel: 'ឈ្មោះម្ចាស់គណនី (Account Holder Name)',
      accNumberLabel: 'លេខគណនីធនាគារ (Account Number)',
      qrLabel: 'រូបភាពស្កេន QR Code (KHQR)',
      qrUploadBtn: 'ជ្រើសរើសរូប QR Code',
      qrChangeBtn: 'ផ្លាស់ប្តូររូបភាព',
      qrHint: 'គាំទ្រ JPG, PNG ទំហំអតិបរមា 2MB។ រូបភាពនេះនឹងបង្ហាញលើវិក្កយបត្រអ្នកជួល។',
      instructionsLabel: 'សេចក្ដីណែនាំអំពីការបង់ប្រាក់ (Payment Instructions)',
      instructionsPlaceholder: 'ឧ. សូមសរសេរលេខបន្ទប់ និងខែក្នុង Remark ពេលផ្ទេរប្រាក់',
      utilitySection: 'អត្រាតម្លៃភ្លើង-ទឹក និងវិក្កយបត្រស្វ័យប្រវត្តិ',
      utilityDesc: 'តម្លៃលំនាំដើមដែលត្រូវប្រើប្រាស់ពេលគណនាវិក្កយបត្រប្រចាំខែ',
      elecLabel: 'តម្លៃភ្លើង ($ / kWh)',
      waterLabel: 'តម្លៃទឹក ($ / m³)',
      dueDayLabel: 'ថ្ងៃផុតកំណត់បង់ប្រាក់ប្រចាំខែ (ថ្ងៃទី)',
      depositLabel: 'ប្រាក់កក់លំនាំដើម (ខែ)',
      notifySection: 'ការជូនដំណឹង (Notifications)',
      notifyBookingsLabel: 'ទទួលដំណឹងពេលមានការស្នើសុំកក់បន្ទប់ថ្មី',
      notifyPaymentsLabel: 'ទទួលដំណឹងពេលអ្នកជួលបានបង់ប្រាក់វិក្កយបត្រ',
      storageSection: 'ប្រព័ន្ធផ្ទុកឯកសារ និងរូបភាព (Storage Engine)',
      storageActive: 'កំពុងដំណើរការជាមួយ៖ MinIO / S3 Object Storage & Cloud Public Disk',
      storageHint: 'គាំទ្រការរក្សាទុករូបភាពបន្ទប់ជួលលើ MinIO, AWS S3, Cloudflare R2 ឬ Public Storage ដោយស្វ័យប្រវត្តិ។',
      previewReceiptBtn: 'មើលគំរូវិក្កយបត្រ (Preview Receipt)',
      saveBtn: 'រក្សាទុកការកំណត់',
      savingBtn: 'កំពុងរក្សាទុក...',
      savedSuccess: 'ការកំណត់ និងព័ត៌មានគណនីទូទាត់ត្រូវបានរក្សាទុកដោយជោគជ័យ!',
      backupSection: 'ទិន្នន័យបម្រុងទុក & ការទាញយក (Data Backup & Export)',
      backupDesc: 'ទាញយក និងរក្សាទុកទិន្នន័យផ្ទះជួល បន្ទប់ វិក្កយបត្រ និងការចំណាយទាំងអស់ជាទម្រង់ JSON',
      downloadFullBackupBtn: 'ទាញយកទិន្នន័យទាំងអស់ (Full Backup JSON)',
      downloadInvoicesBackupBtn: 'ទាញយកតែវិក្កយបត្រ (Invoices)',
      downloadExpensesBackupBtn: 'ទាញយកតែការចំណាយ (Expenses)',
      downloadPropertiesBackupBtn: 'ទាញយកតែអចលនទ្រព្យ (Properties)',
      backupHint: 'ឯកសារទិន្នន័យបម្រុងទុក (JSON) នេះមានផ្ទុកនូវព័ត៌មានលម្អិតទាំងអស់អំពីអចលនទ្រព្យ បន្ទប់ អ្នកជួល និងប្រវត្តិទូទាត់ប្រាក់ សម្រាប់រក្សាទុកជាសុវត្ថិភាព ឬផ្ទៀងផ្ទាត់បញ្ជីគណនេយ្យ។',
      backupSuccess: 'បានទាញយកទិន្នន័យបម្រុងទុកដោយជោគជ័យ!',
      backupError: 'មិនអាចទាញយកទិន្នន័យបម្រុងទុកបានទេ!'
    },
    en: {
      title: 'Owner System Settings',
      subtitle: 'Configure automated utility rates, landlord bank KHQR, business credentials, and notification rules',
      businessSection: 'Business & Contact Profile',
      businessDesc: 'These contact credentials will appear on formal receipts and invoices',
      bizNameLabel: 'Business / Apartment Complex Name',
      phoneLabel: 'Emergency Contact Phone',
      telegramLabel: 'Telegram Support Username',
      paymentSection: 'Landlord Payment Method & KHQR',
      paymentDesc: 'Provide your bank account and KHQR code so tenants can scan and settle rent directly',
      bankNameLabel: 'Bank Name (e.g. ABA Bank, Wing, Canadia)',
      accNameLabel: 'Account Holder Name',
      accNumberLabel: 'Bank Account Number',
      qrLabel: 'Payment QR Code Image (KHQR)',
      qrUploadBtn: 'Upload KHQR Image',
      qrChangeBtn: 'Change QR Code',
      qrHint: 'JPG, PNG up to 2MB. This QR code will appear directly on tenant invoices.',
      instructionsLabel: 'Payment Instructions / Remark Guidance',
      instructionsPlaceholder: 'e.g. Please put room number and month in transfer remark',
      utilitySection: 'Default Utility Rates & Invoicing Rules',
      utilityDesc: 'Pre-filled unit rates used for automated utility monthly billing',
      elecLabel: 'Electricity Rate ($ / kWh)',
      waterLabel: 'Water Rate ($ / m³)',
      dueDayLabel: 'Monthly Payment Due Day (Day of Month)',
      depositLabel: 'Default Deposit Requirement (Months)',
      notifySection: 'Notification Preferences',
      notifyBookingsLabel: 'Receive alerts when a new booking request is made',
      notifyPaymentsLabel: 'Receive notifications when tenants settle invoices',
      storageSection: 'File & Image Storage Engine',
      storageActive: 'Operating Mode: MinIO / S3 Object Storage & Cloud Public Storage',
      storageHint: 'Supports automated room image syncing with MinIO, AWS S3, Cloudflare R2, or local public storage.',
      previewReceiptBtn: 'Preview Invoice / Receipt',
      saveBtn: 'Save Settings',
      savingBtn: 'Saving...',
      savedSuccess: 'Settings and payment information updated successfully!',
      backupSection: 'Data Backup & Export',
      backupDesc: 'Download and archive your properties, rooms, invoices, and expenses in structured JSON format',
      downloadFullBackupBtn: 'Download Full Rental Backup (JSON)',
      downloadInvoicesBackupBtn: 'Export Invoices Only',
      downloadExpensesBackupBtn: 'Export Expenses Only',
      downloadPropertiesBackupBtn: 'Export Properties Only',
      backupHint: 'This comprehensive backup file contains your full property inventory, room records, tenant bookings, and payment history for secure offline record-keeping and auditing.',
      backupSuccess: 'Backup downloaded successfully!',
      backupError: 'Failed to download backup data!'
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // 1. Save general owner settings to localStorage
    const settingsData = {
      contactPhone,
      telegramHandle,
      elecRate,
      waterRate,
      dueDay,
      depositMonths,
      notifyBookings,
      notifyPayments
    };
    localStorage.setItem('owner_settings', JSON.stringify(settingsData));

    // 2. Save payment methods and contact phone to backend user profile
    try {
      const formData = new FormData();
      if (user?.name) formData.append('name', user.name);
      if (user?.email) formData.append('email', user.email);
      if (contactPhone || user?.phone) formData.append('phone', contactPhone || user?.phone || '');
      
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
      toast.success(currentT.savedSuccess);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async (type: string = 'all') => {
    setExportingBackup(type);
    try {
      const res = await api.get(`/owner/backup/export?type=${type}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pteasyeung_owner_backup_${type}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(currentT.backupSuccess);
    } catch (err) {
      toast.error(currentT.backupError);
    } finally {
      setExportingBackup(null);
    }
  };

  // Mock invoice for live receipt preview
  const mockInvoice: ReceiptInvoice = {
    id: 108,
    invoice_number: 'INV-00108',
    total_amount: 150 + Number(elecRate || 0.25) * 45 + Number(waterRate || 0.60) * 8,
    payment_status: 'unpaid',
    due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    electricity_start_unit: 100,
    electricity_end_unit: 145,
    water_unit: 8,
    booking: {
      id: 55,
      room: {
        id: 12,
        room_number: '302',
        price: 150,
        type: 'បន្ទប់គេង ១ (1 Bedroom)',
        property: {
          id: 3,
          title: 'អគារស្នាក់នៅ (Sample Property)',
          address: 'ផ្លូវលេខ ២៧១, សង្កាត់បឹងទំពុន, ខណ្ឌមានជ័យ',
          city: 'រាជធានីភ្នំពេញ',
          owner: {
            id: user?.id || 1,
            name: user?.name || 'ម្ចាស់ផ្ទះ / Landlord',
            phone: contactPhone || user?.phone || '012 345 678',
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
        id: 8,
        name: 'កែវ វិបុល (Sample Tenant)',
        phone: '098 765 432',
        email: 'vibol.tenant@gmail.com'
      },
      owner: {
        id: user?.id || 1,
        name: user?.name || 'ម្ចាស់ផ្ទះ / Landlord',
        phone: contactPhone || user?.phone || '012 345 678',
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
    <div className="space-y-6 w-full mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="text-indigo-600" />
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

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Business Profile */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {currentT.businessSection}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{currentT.businessDesc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {currentT.phoneLabel}
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="012 345 678"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {currentT.telegramLabel}
              </label>
              <input
                type="text"
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                placeholder="@username ឬ លីងឆាត"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Landlord Payment Method & KHQR */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {currentT.paymentSection}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{currentT.paymentDesc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {currentT.bankNameLabel}
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="ABA Bank / ACLEDA / Wing"
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
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="001 234 567"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono font-bold text-indigo-600 dark:text-indigo-400"
              />
            </div>

            {/* KHQR Code Image Upload */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                {currentT.qrLabel}
              </label>

              <input
                type="file"
                ref={bankQrInputRef}
                onChange={handleBankQrChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700">
                <div 
                  onClick={() => bankQrInputRef.current?.click()}
                  className="w-28 h-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1 cursor-pointer overflow-hidden shadow-xs hover:border-indigo-500 transition shrink-0"
                >
                  {bankQrPreview ? (
                    <img 
                      src={bankQrPreview} 
                      alt="Landlord KHQR" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <QrCode className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] font-bold block">Scan QR</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <button
                    type="button"
                    onClick={() => bankQrInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition"
                  >
                    <Upload size={14} />
                    <span>{bankQrPreview ? currentT.qrChangeBtn : currentT.qrUploadBtn}</span>
                  </button>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {currentT.qrHint}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
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

        {/* Utility Defaults */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {currentT.utilitySection}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{currentT.utilityDesc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Zap size={13} className="text-amber-500" />
                <span>{currentT.elecLabel}</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={elecRate}
                onChange={(e) => setElecRate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-indigo-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">~1,000 KHR / គីឡូវ៉ាត់ម៉ោង</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Droplets size={13} className="text-sky-500" />
                <span>{currentT.waterLabel}</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={waterRate}
                onChange={(e) => setWaterRate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-indigo-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">~2,500 KHR / ម៉ែត្រគូប</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {currentT.dueDayLabel}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {currentT.depositLabel}
              </label>
              <input
                type="number"
                min="0"
                value={depositMonths}
                onChange={(e) => setDepositMonths(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Notifications & Storage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Notifications */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
                <Bell size={20} />
              </div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {currentT.notifySection}
              </h2>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyBookings}
                  onChange={(e) => setNotifyBookings(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {currentT.notifyBookingsLabel}
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyPayments}
                  onChange={(e) => setNotifyPayments(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {currentT.notifyPaymentsLabel}
                </span>
              </label>
            </div>
          </div>

          {/* Storage Status */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                <Server size={20} />
              </div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {currentT.storageSection}
              </h2>
            </div>

            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 size={16} />
                <span>{currentT.storageActive}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {currentT.storageHint}
              </p>
            </div>
          </div>
        </div>

        {/* Data Backup & Export Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {currentT.backupSection}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{currentT.backupDesc}</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {currentT.backupHint}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <button
              type="button"
              disabled={!!exportingBackup}
              onClick={() => handleDownloadBackup('all')}
              className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
            >
              {exportingBackup === 'all' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{currentT.downloadFullBackupBtn}</span>
            </button>

            <button
              type="button"
              disabled={!!exportingBackup}
              onClick={() => handleDownloadBackup('invoices')}
              className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
            >
              {exportingBackup === 'invoices' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{currentT.downloadInvoicesBackupBtn}</span>
            </button>

            <button
              type="button"
              disabled={!!exportingBackup}
              onClick={() => handleDownloadBackup('expenses')}
              className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
            >
              {exportingBackup === 'expenses' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{currentT.downloadExpensesBackupBtn}</span>
            </button>

            <button
              type="button"
              disabled={!!exportingBackup}
              onClick={() => handleDownloadBackup('properties')}
              className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
            >
              {exportingBackup === 'properties' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{currentT.downloadPropertiesBackupBtn}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
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

      {/* Live Sample Receipt Modal for Landlord */}
      <ReceiptModal
        isOpen={showReceiptPreview}
        onClose={() => setShowReceiptPreview(false)}
        invoice={mockInvoice}
        lang={lang}
      />
    </div>
  );
}
