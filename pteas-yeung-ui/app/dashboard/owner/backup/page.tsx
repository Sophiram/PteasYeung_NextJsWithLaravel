'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import {
  Database, Download, RefreshCw, HardDrive, ShieldCheck,
  Building2, DoorOpen, CreditCard, Wallet, CalendarCheck,
  RotateCcw, Upload, FileText, FileSpreadsheet, Loader2,
  Trash2, ArrowDownToLine, CheckCircle, AlertTriangle,
  Info, Users, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OwnerStats {
  counts: {
    properties: number;
    rooms: number;
    bookings: number;
    invoices: number;
    expenses: number;
    staff: number;
  };
  snapshots: {
    count: number;
    total_size: string;
    total_size_bytes: number;
    latest: string | null;
  };
  last_generated: string;
}

interface SnapshotItem {
  filename: string;
  size: string;
  size_bytes: number;
  created_at: string;
  type: string;
}

export default function OwnerBackupPage() {
  const { language } = useLanguage();
  const isKh = language === 'kh';

  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'snapshots' | 'exports'>('snapshots');

  // Restore states
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreTargetSnapshot, setRestoreTargetSnapshot] = useState<string | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreSummary, setRestoreSummary] = useState<Record<string, number> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch telemetry & snapshots
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, listRes] = await Promise.all([
        api.get('/owner/backup/stats'),
        api.get('/owner/backup/list'),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (listRes.data?.success) {
        setSnapshots(listRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load owner backup data', err);
      toast.error(isKh ? 'មិនអាចទាញយកទិន្នន័យបម្រុងទុកបានទេ' : 'Failed to load business backup data');
    } finally {
      setLoading(false);
    }
  }, [isKh]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create Business Snapshot
  const handleCreateSnapshot = async () => {
    try {
      setCreating(true);
      const res = await api.post('/owner/backup/create');
      if (res.data?.success) {
        toast.success(isKh ? 'បានបង្កើត Snapshot អាជីវកម្មជោគជ័យ!' : 'Business backup snapshot saved successfully!');
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isKh ? 'បរាជ័យក្នុងការបង្កើត Snapshot' : 'Failed to save snapshot'));
    } finally {
      setCreating(false);
    }
  };

  // Download Snapshot
  const handleDownloadSnapshot = async (filename: string) => {
    try {
      const res = await api.get(`/owner/backup/download/${filename}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(isKh ? 'ទាញយកឯកសារជោគជ័យ' : 'Snapshot downloaded successfully');
    } catch (err) {
      toast.error(isKh ? 'មិនអាចទាញយក Snapshot បានទេ' : 'Failed to download snapshot');
    }
  };

  // Delete Snapshot
  const handleDeleteSnapshot = async (filename: string) => {
    if (!confirm(isKh ? `តើលោកអ្នកចង់លុប Snapshot "${filename}" នេះមែនទេ?` : `Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      setDeletingFilename(filename);
      const res = await api.delete(`/owner/backup/${filename}`);
      if (res.data?.success) {
        toast.success(isKh ? 'បានលុប Snapshot ជោគជ័យ' : 'Snapshot deleted successfully');
        setSnapshots((prev) => prev.filter((s) => s.filename !== filename));
        if (stats) {
          setStats({
            ...stats,
            snapshots: {
              ...stats.snapshots,
              count: Math.max(0, stats.snapshots.count - 1),
            },
          });
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isKh ? 'មិនអាចលុប Snapshot បានទេ' : 'Failed to delete snapshot'));
    } finally {
      setDeletingFilename(null);
    }
  };

  // Instant Export (JSON or CSV)
  const handleExport = async (type: string, format: 'json' | 'csv') => {
    const key = `${type}_${format}`;
    try {
      setExportingKey(key);
      const res = await api.get(`/owner/backup/export?type=${type}&format=${format}`, {
        responseType: 'blob',
      });

      const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json';
      const extension = format === 'csv' ? 'csv' : 'json';
      const blob = new Blob([res.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pteasyeung_owner_${type}_${new Date().toISOString().slice(0, 10)}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(isKh ? `ទាញយកទិន្នន័យ (${format.toUpperCase()}) ជោគជ័យ` : `Exported (${format.toUpperCase()}) successfully`);
    } catch (err) {
      toast.error(isKh ? 'មានបញ្ហាក្នុងការទាញយកទិន្នន័យ' : 'Export failed');
    } finally {
      setExportingKey(null);
    }
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!confirmRestore) {
      toast.error(isKh ? 'សូមគូសធីកយល់ព្រមជាមុនសិន' : 'Please check the confirmation box');
      return;
    }

    try {
      setRestoring(true);
      const formData = new FormData();
      if (restoreFile) {
        formData.append('backup_file', restoreFile);
      } else if (restoreTargetSnapshot) {
        formData.append('filename', restoreTargetSnapshot);
      } else {
        toast.error(isKh ? 'សូមជ្រើសរើសឯកសារ ឬ Snapshot' : 'Please select a file or snapshot to restore');
        return;
      }

      const res = await api.post('/owner/backup/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        toast.success(isKh ? 'ស្ដារទិន្នន័យអាជីវកម្មជោគជ័យ!' : 'Business data restored successfully!');
        setRestoreSummary(res.data.data?.restored_counts || null);
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isKh ? 'បរាជ័យក្នុងការស្ដារទិន្នន័យ' : 'Failed to restore business data'));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4 pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 text-xs font-black tracking-wide">
              <ShieldCheck size={14} />
              <span>{isKh ? 'ការការពារទិន្នន័យផ្ទះជួលរបស់លោកអ្នក' : 'Landlord Business Data Protection'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isKh ? 'ការបម្រុងទុកទិន្នន័យអាជីវកម្ម (Business Backups)' : 'Business Data Backup & Export Hub'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl leading-relaxed">
              {isKh
                ? 'រក្សាទុកសុវត្ថិភាពទិន្នន័យផ្ទះជួល បន្ទប់ វិក្កយបត្រ និងការចំណាយរបស់លោកអ្នក។ ទាញយកជាឯកសារ Excel/CSV សម្រាប់គណនេយ្យ ឬស្ដារឡើងវិញគ្រប់ពេលវេលា។'
                : 'Safeguard your rental properties, tenant contracts, billing invoices, and expenses. Export accounting-ready Excel/CSV files or restore anytime.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title={isKh ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh'}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={() => {
                setRestoreTargetSnapshot(null);
                setRestoreFile(null);
                setConfirmRestore(false);
                setRestoreSummary(null);
                setRestoreModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition active:scale-95 shadow-sm"
            >
              <RotateCcw size={16} />
              <span>{isKh ? 'ស្ដារទិន្នន័យ (Restore)' : 'Restore Data'}</span>
            </button>

            <button
              type="button"
              disabled={creating}
              onClick={handleCreateSnapshot}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition active:scale-95 disabled:opacity-50"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <HardDrive size={16} />}
              <span>{creating ? (isKh ? 'កំពុងរក្សាទុក...' : 'Saving Snapshot...') : (isKh ? 'រក្សាទុក Business Snapshot' : 'Save Business Snapshot')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Properties & Rooms */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isKh ? 'ផ្ទះជួល & បន្ទប់សរុប' : 'Properties & Rooms'}
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats?.counts.properties || 0} <span className="text-sm font-semibold text-slate-400">/ {stats?.counts.rooms || 0} {isKh ? 'បន្ទប់' : 'rooms'}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Building2 size={22} />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            {isKh ? 'បុគ្គលិកគ្រប់គ្រង:' : 'Staff accounts:'} <span className="font-semibold text-indigo-600 dark:text-indigo-400">{stats?.counts.staff || 0}</span>
          </p>
        </div>

        {/* Bookings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isKh ? 'កិច្ចសន្យា & ការកក់' : 'Bookings & Tenants'}
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats?.counts.bookings || 0}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <CalendarCheck size={22} />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            {isKh ? 'ទិន្នន័យអ្នកជួលសរុប' : 'Active and past tenant records'}
          </p>
        </div>

        {/* Invoices */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isKh ? 'វិក្កយបត្រ & ចំណូល' : 'Billing & Invoices'}
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats?.counts.invoices || 0}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <CreditCard size={22} />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            {isKh ? 'ការចំណាយអាជីវកម្ម:' : 'Operating expenses:'} <span className="font-semibold text-amber-600">{stats?.counts.expenses || 0}</span>
          </p>
        </div>

        {/* Saved Snapshots */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isKh ? 'Snapshot ផ្ទាល់ខ្លួន' : 'My Saved Backups'}
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {snapshots.length}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
              <HardDrive size={22} />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            {isKh ? 'ទំហំបម្រុងទុក:' : 'Archive size:'} <span className="font-semibold text-sky-600">{stats?.snapshots.total_size || '0 B'}</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('snapshots')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition ${
            activeTab === 'snapshots'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HardDrive size={16} />
          <span>{isKh ? 'Snapshot ផ្ទាល់ខ្លួនលើ Server' : 'My Saved Snapshots'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'snapshots' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {snapshots.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exports')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition ${
            activeTab === 'exports'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowDownToLine size={16} />
          <span>{isKh ? 'ទាញយករបាយការណ៍ Excel / CSV & JSON' : 'Export Center (Excel & JSON)'}</span>
        </button>
      </div>

      {/* TAB 1: SAVED SNAPSHOTS */}
      {activeTab === 'snapshots' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isKh ? 'ឯកសារបម្រុងទុករបស់លោកអ្នក' : 'Your Private Business Snapshots'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isKh
                  ? 'ឯកសារទាំងនេះត្រូវបានញែកដាច់ដោយឡែក និងមានសុវត្ថិភាព សម្រាប់តែគណនីម្ចាស់ផ្ទះរបស់លោកអ្នកប៉ុណ្ណោះ។'
                  : 'Isolated and encrypted storage specifically for your rental business properties and invoices.'}
              </p>
            </div>

            <button
              type="button"
              disabled={creating}
              onClick={handleCreateSnapshot}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <HardDrive size={14} />}
              <span>{isKh ? 'រក្សាទុក Snapshot ឥឡូវនេះ' : 'Take Business Snapshot'}</span>
            </button>
          </div>

          {snapshots.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <HardDrive size={28} />
              </div>
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">
                {isKh ? 'មិនទាន់មាន Snapshot អាជីវកម្មនៅឡើយទេ' : 'No snapshots saved yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isKh
                  ? 'ចុចប៊ូតុង "រក្សាទុក Business Snapshot" ដើម្បីបង្កើតឯកសារបម្រុងទុកដំបូងសម្រាប់ផ្ទះជួលរបស់លោកអ្នក។'
                  : 'Click "Save Business Snapshot" to create a complete copy of your properties, rooms, and tenant records.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="py-3.5 px-6">{isKh ? 'ឈ្មោះឯកសារ' : 'Snapshot File'}</th>
                    <th className="py-3.5 px-4">{isKh ? 'ទំហំ' : 'File Size'}</th>
                    <th className="py-3.5 px-4">{isKh ? 'កាលបរិច្ឆេទ' : 'Created Date'}</th>
                    <th className="py-3.5 px-6 text-right">{isKh ? 'សកម្មភាព' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {snapshots.map((s) => (
                    <tr key={s.filename} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                            <FileText size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-xs sm:max-w-md">
                              {s.filename}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isKh ? 'ទម្រង់ទិន្នន័យ៖ JSON' : 'Format: Structured JSON'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {s.size}
                      </td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadSnapshot(s.filename)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                            title={isKh ? 'ទាញយកឯកសារ' : 'Download'}
                          >
                            <Download size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRestoreTargetSnapshot(s.filename);
                              setRestoreFile(null);
                              setConfirmRestore(false);
                              setRestoreSummary(null);
                              setRestoreModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 transition"
                            title={isKh ? 'ស្ដារទិន្នន័យពី Snapshot នេះ' : 'Restore from snapshot'}
                          >
                            <RotateCcw size={15} />
                          </button>

                          <button
                            type="button"
                            disabled={deletingFilename === s.filename}
                            onClick={() => handleDeleteSnapshot(s.filename)}
                            className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition disabled:opacity-50"
                            title={isKh ? 'លុប Snapshot' : 'Delete'}
                          >
                            {deletingFilename === s.filename ? (
                              <Loader2 size={15} className="animate-spin text-rose-600" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPORTS (SPREADSHEETS & JSON) */}
      {activeTab === 'exports' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {isKh ? 'ទាញយករបាយការណ៍គណនេយ្យ & ទិន្នន័យ (Excel / CSV & JSON)' : 'Accounting Spreadsheets & Business Archives'}
            </h2>
            <p className="text-xs text-slate-400">
              {isKh
                ? 'ទាញយកទិន្នន័យផ្ទះជួលរបស់លោកអ្នកជាឯកសារ Excel (CSV) សម្រាប់គណនាពន្ធ ធ្វើគណនេយ្យ ឬទុកជាឯកសារយោង។'
                : 'Download clean Excel-ready CSV spreadsheets for monthly accounting, tax records, or offline tenant management.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Full Business Archive */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  <Database size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isKh ? 'ទិន្នន័យអាជីវកម្មទាំងមូល' : 'Full Business Archive'}
                  </h3>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                    Complete Backup JSON
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isKh
                  ? 'រួមបញ្ចូលរាល់ផ្ទះជួល បន្ទប់ អ្នកជួល វិក្កយបត្រ ការចំណាយ និងបុគ្គលិករបស់លោកអ្នក។'
                  : 'Includes all properties, rooms, tenant bookings, monthly invoices, expenses, and staff.'}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={exportingKey === 'all_json'}
                  onClick={() => handleExport('all', 'json')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  {exportingKey === 'all_json' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>{isKh ? 'ទាញយក Full JSON Backup' : 'Download Full JSON Archive'}</span>
                </button>
              </div>
            </div>

            {/* 2. Invoices & Billing (Excel) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isKh ? 'វិក្កយបត្រ & ចំណូល' : 'Invoices & Billing'}
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {stats?.counts.invoices || 0} {isKh ? 'វិក្កយបត្រ' : 'invoices'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isKh
                  ? 'ទិន្នន័យប្រមូលថ្លៃបន្ទប់ ថ្លៃភ្លើង ថ្លៃទឹក និងកាលបរិច្ឆេទទូទាត់។'
                  : 'Monthly billing records, electricity and water utility readings, and payment status.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={exportingKey === 'invoices_csv'}
                  onClick={() => handleExport('invoices', 'csv')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'invoices_csv' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                  <span>Excel / CSV</span>
                </button>

                <button
                  type="button"
                  disabled={exportingKey === 'invoices_json'}
                  onClick={() => handleExport('invoices', 'json')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'invoices_json' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* 3. Expenses */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                  <Wallet size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isKh ? 'ការចំណាយអាជីវកម្ម' : 'Operating Expenses'}
                  </h3>
                  <span className="text-[10px] text-amber-600 font-bold">
                    {stats?.counts.expenses || 0} {isKh ? 'កំណត់ត្រា' : 'records'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isKh
                  ? 'របាយការណ៍ចំណាយថ្លៃជួសជុល ថែទាំ និងទិញសម្ភារៈក្នុងផ្ទះជួល។'
                  : 'Maintenance, renovation, utilities, and general operational expense records.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={exportingKey === 'expenses_csv'}
                  onClick={() => handleExport('expenses', 'csv')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'expenses_csv' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                  <span>Excel / CSV</span>
                </button>

                <button
                  type="button"
                  disabled={exportingKey === 'expenses_json'}
                  onClick={() => handleExport('expenses', 'json')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'expenses_json' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* 4. Bookings & Tenants */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600">
                  <CalendarCheck size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isKh ? 'អ្នកជួល & កិច្ចសន្យា' : 'Tenants & Bookings'}
                  </h3>
                  <span className="text-[10px] text-sky-600 font-bold">
                    {stats?.counts.bookings || 0} {isKh ? 'កិច្ចសន្យា' : 'contracts'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isKh
                  ? 'ឈ្មោះអ្នកជួល លេខទូរស័ព្ទ បន្ទប់ជួល ថ្ងៃចូលនៅ និងប្រាក់កក់។'
                  : 'Tenant directory, contact phone, room number, check-in date, and deposit.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={exportingKey === 'bookings_csv'}
                  onClick={() => handleExport('bookings', 'csv')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-400 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'bookings_csv' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                  <span>Excel / CSV</span>
                </button>

                <button
                  type="button"
                  disabled={exportingKey === 'bookings_json'}
                  onClick={() => handleExport('bookings', 'json')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'bookings_json' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* 5. Properties & Rooms */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isKh ? 'ផ្ទះជួល & បន្ទប់' : 'Properties & Rooms'}
                  </h3>
                  <span className="text-[10px] text-purple-600 font-bold">
                    {stats?.counts.properties || 0} {isKh ? 'ផ្ទះ' : 'props'} • {stats?.counts.rooms || 0} {isKh ? 'បន្ទប់' : 'rooms'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isKh
                  ? 'បញ្ជីអាសយដ្ឋានផ្ទះជួល ចំនួនបន្ទប់ និងតម្លៃជួលប្រចាំខែ។'
                  : 'Property locations, room inventory, rental prices, and room statuses.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={exportingKey === 'properties_csv'}
                  onClick={() => handleExport('properties', 'csv')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-400 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'properties_csv' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                  <span>Excel / CSV</span>
                </button>

                <button
                  type="button"
                  disabled={exportingKey === 'properties_json'}
                  onClick={() => handleExport('properties', 'json')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'properties_json' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE MODAL */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-5 p-6 relative">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isKh ? 'ស្ដារទិន្នន័យអាជីវកម្មឡើងវិញ' : 'Restore Business Data'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isKh ? 'ស្ដារឡើងវិញពីឯកសារ JSON ឬ Snapshot' : 'Import properties, rooms, and expenses from backup'}
                </p>
              </div>
            </div>

            {/* Hint Box */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-3 text-xs text-indigo-800 dark:text-indigo-300">
              <Info size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                {isKh
                  ? 'ការស្ដារទិន្នន័យនឹងបង្កើត ឬធ្វើបច្ចុប្បន្នភាពផ្ទះជួល បន្ទប់ និងការចំណាយរបស់លោកអ្នកដោយសុវត្ថិភាព។'
                  : 'Restoring will safely synchronize your properties, rooms, and expenses under your owner account.'}
              </p>
            </div>

            {/* Option A: Server Snapshot */}
            {snapshots.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isKh ? 'ជម្រើសទី ១៖ ជ្រើសរើសពី Snapshot ដែលបានរក្សាទុក' : 'Option A: Select Saved Snapshot'}
                </label>
                <select
                  value={restoreTargetSnapshot || ''}
                  onChange={(e) => {
                    setRestoreTargetSnapshot(e.target.value || null);
                    if (e.target.value) setRestoreFile(null);
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="">{isKh ? '-- ជ្រើសរើស Snapshot --' : '-- Choose a snapshot --'}</option>
                  {snapshots.map((s) => (
                    <option key={s.filename} value={s.filename}>
                      {s.filename} ({s.size}) - {new Date(s.created_at).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Option B: Upload JSON File */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isKh ? 'ជម្រើសទី ២៖ ផ្ទុកឡើងឯកសារ JSON Backup ពីកុំព្យូទ័រ' : 'Option B: Upload JSON Backup File'}
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setRestoreFile(e.target.files[0]);
                    setRestoreTargetSnapshot(null);
                  }
                }}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 transition ${
                  restoreFile
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-950/50 text-slate-400'
                }`}
              >
                <Upload size={24} />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">
                  {restoreFile ? restoreFile.name : (isKh ? 'ចុចទីនេះដើម្បីជ្រើសរើសឯកសារ (.json)' : 'Click to select JSON backup file')}
                </span>
                {restoreFile && (
                  <span className="text-[10px] text-indigo-500 font-bold">
                    {(restoreFile.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={confirmRestore}
                onChange={(e) => setConfirmRestore(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                {isKh
                  ? 'ខ្ញុំយល់ព្រមឱ្យប្រព័ន្ធធ្វើការស្ដារទិន្នន័យនេះ។'
                  : 'I confirm restoration of this business backup dataset.'}
              </span>
            </label>

            {/* Restore Summary */}
            {restoreSummary && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle size={16} />
                  <span>{isKh ? 'លទ្ធផលស្ដារទិន្នន័យជោគជ័យ៖' : 'Restore Results:'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {Object.entries(restoreSummary).map(([k, v]) => (
                    <div key={k} className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-900/60 flex justify-between">
                      <span className="capitalize">{k}:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={restoring}
                onClick={() => setRestoreModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition"
              >
                {isKh ? 'បិទ' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={restoring || !confirmRestore || (!restoreFile && !restoreTargetSnapshot)}
                onClick={handleExecuteRestore}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition active:scale-95 disabled:opacity-40"
              >
                {restoring ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                <span>{restoring ? (isKh ? 'កំពុងស្ដារទិន្នន័យ...' : 'Restoring...') : (isKh ? 'ចាប់ផ្ដើមស្ដារ' : 'Execute Restore')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
