'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import {
  Database, Download, RefreshCw, HardDrive, ShieldCheck,
  Server, Clock, FileText, CheckCircle2, AlertTriangle,
  Trash2, RotateCcw, Upload, FileCode, Users, Building2,
  CreditCard, ShieldAlert, Loader2, ArrowDownToLine,
  Check, Copy, Info, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BackupStats {
  database: {
    driver: string;
    name: string;
    status: string;
  };
  counts: {
    users: number;
    properties: number;
    rooms: number;
    bookings: number;
    invoices: number;
    expenses: number;
    audit_logs: number;
    settings: number;
  };
  snapshots: {
    count: number;
    total_size: string;
    total_size_bytes: number;
    latest: string | null;
  };
  environment: {
    php_version: string;
    laravel_version: string;
    server_time: string;
    timezone: string;
  };
}

interface SnapshotItem {
  filename: string;
  size: string;
  size_bytes: number;
  created_at: string;
  type: string;
}

export default function AdminBackupPage() {
  const { language } = useLanguage();
  const isKh = language === 'kh';

  const [stats, setStats] = useState<BackupStats | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'snapshots' | 'exports' | 'restore'>('snapshots');

  // Restore state
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreTargetSnapshot, setRestoreTargetSnapshot] = useState<string | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreSummary, setRestoreSummary] = useState<Record<string, number> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch stats and snapshots
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, listRes] = await Promise.all([
        api.get('/admin/backup/stats'),
        api.get('/admin/backup/list'),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (listRes.data?.success) {
        setSnapshots(listRes.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load backup telemetry', err);
      toast.error(isKh ? 'មិនអាចទាញទិន្នន័យបម្រុងទុកបានទេ' : 'Failed to load backup data');
    } finally {
      setLoading(false);
    }
  }, [isKh]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create Server Snapshot
  const handleCreateSnapshot = async () => {
    try {
      setCreating(true);
      const res = await api.post('/admin/backup/create');
      if (res.data?.success) {
        toast.success(isKh ? 'បានបង្កើត Snapshot ប្រព័ន្ធជោគជ័យ!' : 'Platform snapshot created successfully!');
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isKh ? 'បរាជ័យក្នុងការបង្កើត Snapshot' : 'Failed to create snapshot'));
    } finally {
      setCreating(false);
    }
  };

  // Download Server Snapshot
  const handleDownloadSnapshot = async (filename: string) => {
    try {
      const res = await api.get(`/admin/backup/download/${filename}`, {
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
      toast.success(isKh ? 'ទាញយកឯកសារបម្រុងទុកបានជោគជ័យ' : 'Snapshot downloaded successfully');
    } catch (err) {
      toast.error(isKh ? 'មិនអាចទាញយក Snapshot បានទេ' : 'Failed to download snapshot');
    }
  };

  // Delete Server Snapshot
  const handleDeleteSnapshot = async (filename: string) => {
    if (!confirm(isKh ? `តើអ្នកប្រាកដជាចង់លុប Snapshot "${filename}" នេះមែនទេ?` : `Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      setDeletingFilename(filename);
      const res = await api.delete(`/admin/backup/${filename}`);
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

  // Instant Export in JSON, CSV, or SQL
  const handleExport = async (type: string, format: 'json' | 'csv' | 'sql') => {
    const exportKey = `${type}_${format}`;
    try {
      setExportingKey(exportKey);
      const res = await api.get(`/admin/backup/export?type=${type}&format=${format}`, {
        responseType: 'blob',
      });

      const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : format === 'sql' ? 'application/sql' : 'application/json';
      const extension = format === 'csv' ? 'csv' : format === 'sql' ? 'sql' : 'json';
      const blob = new Blob([res.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pteasyeung_admin_${type}_${new Date().toISOString().slice(0, 10)}.${extension}`;
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

  // Trigger Restore
  const handleExecuteRestore = async () => {
    if (!confirmRestore) {
      toast.error(isKh ? 'សូមគូសធីកបញ្ជាក់ការស្ដារទិន្នន័យជាមុនសិន' : 'Please check the confirmation box first');
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
        toast.error(isKh ? 'សូមជ្រើសរើសឯកសារ ឬ Snapshot សម្រាប់ស្ដារ' : 'Please select a file or snapshot to restore');
        return;
      }

      const res = await api.post('/admin/backup/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        toast.success(isKh ? 'ស្ដារប្រព័ន្ធជោគជ័យបរិបូរណ៍!' : 'Database restored successfully!');
        setRestoreSummary(res.data.data?.restored_counts || null);
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isKh ? 'បរាជ័យក្នុងការស្ដារទិន្នន័យ' : 'Failed to restore database'));
    } finally {
      setRestoring(false);
    }
  };

  const totalRecords = stats
    ? Object.values(stats.counts).reduce((acc, curr) => acc + curr, 0)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4 pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 text-xs font-black tracking-wide">
              <ShieldCheck size={14} />
              <span>{isKh ? 'ប្រព័ន្ធបម្រុងទុកទិន្នន័យកម្រិតខ្ពស់' : 'Enterprise Disaster Recovery & Backup'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isKh ? 'ការគ្រប់គ្រងការបម្រុងទុកទិន្នន័យ (System Backups)' : 'System Data Backup & Disaster Recovery'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl leading-relaxed">
              {isKh
                ? 'បង្កើត Snapshot បម្រុងទុកនៅលើ Server ទាញយកទិន្នន័យជាទម្រង់ JSON/CSV/SQL និងស្ដារប្រព័ន្ធឡើងវិញពេលមានអាសន្នដោយសុវត្ថិភាពខ្ពស់។'
                : 'Create automated server snapshots, export portable JSON/CSV/SQL platform archives, and execute zero-data-loss database disaster restorations.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title={isKh ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh Telemetry'}
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
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm transition active:scale-95 shadow-sm"
            >
              <RotateCcw size={16} />
              <span>{isKh ? 'ស្ដារប្រព័ន្ធឡើងវិញ (Restore)' : 'Restore Database'}</span>
            </button>

            <button
              type="button"
              disabled={creating}
              onClick={handleCreateSnapshot}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition active:scale-95 disabled:opacity-50"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <HardDrive size={16} />}
              <span>{creating ? (isKh ? 'កំពុងបង្កើត Snapshot...' : 'Creating Snapshot...') : (isKh ? 'បង្កើត Server Snapshot' : 'Create Server Snapshot')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isKh ? 'កំណត់ត្រាទិន្នន័យសរុប' : 'Total System Records'}
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {totalRecords.toLocaleString()}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Database size={22} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{stats?.counts.users || 0} {isKh ? 'អ្នកប្រើ' : 'users'}</span>
            <span>•</span>
            <span>{stats?.counts.properties || 0} {isKh ? 'ផ្ទះជួល' : 'props'}</span>
            <span>•</span>
            <span>{stats?.counts.invoices || 0} {isKh ? 'វិក្កយបត្រ' : 'invs'}</span>
          </div>
        </div>

        {/* Database Connection */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isKh ? 'ស្ថានភាពមូលដ្ឋានទិន្នន័យ' : 'Database Status'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 dark:text-white uppercase">
                  {stats?.database.driver || 'PostgreSQL'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isKh ? 'ភ្ជាប់ជោគជ័យ' : 'Connected'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Server size={22} />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 truncate">
            {isKh ? 'ឈ្មោះ Database:' : 'DB Name:'} <span className="font-semibold text-slate-600 dark:text-slate-300">{stats?.database.name || 'pteas_yeung_db'}</span>
          </p>
        </div>

        {/* Saved Snapshots */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isKh ? 'Snapshot លើ Server' : 'Saved Snapshots'}
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {snapshots.length}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <HardDrive size={22} />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            {isKh ? 'ទំហំសរុប:' : 'Total Storage:'} <span className="font-semibold text-amber-600 dark:text-amber-400">{stats?.snapshots.total_size || '0 B'}</span>
          </p>
        </div>

        {/* Environment / Server Time */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isKh ? 'ម៉ាស៊ីនបម្រើ & បរិស្ថាន' : 'Environment & Engine'}
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                PHP {stats?.environment.php_version?.split('-')[0] || '8.2'} • Laravel {stats?.environment.laravel_version || '13'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
              <Clock size={22} />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 truncate">
            {stats?.environment.server_time ? new Date(stats.environment.server_time).toLocaleString() : 'Live'}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
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
          <span>{isKh ? 'Snapshot លើ Server' : 'Server Snapshots'}</span>
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
          <span>{isKh ? 'ទាញយកទិន្នន័យផ្ទាល់ (Export Center)' : 'Export Hub (JSON / CSV / SQL)'}</span>
        </button>
      </div>

      {/* TAB 1: SERVER SNAPSHOTS */}
      {activeTab === 'snapshots' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isKh ? 'បញ្ជី Snapshot លើ Server' : 'Available Server Snapshots'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isKh
                  ? 'ឯកសារ Snapshot ត្រូវបានរក្សាទុកដោយសុវត្ថិភាពនៅក្នុងថត storage/app/backups/admin/'
                  : 'Snapshots are securely stored in server-isolated directory: storage/app/backups/admin/'}
              </p>
            </div>

            <button
              type="button"
              disabled={creating}
              onClick={handleCreateSnapshot}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <HardDrive size={14} />}
              <span>{isKh ? 'បង្កើត Snapshot ថ្មី' : 'Generate Snapshot Now'}</span>
            </button>
          </div>

          {snapshots.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <HardDrive size={28} />
              </div>
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">
                {isKh ? 'មិនទាន់មាន Snapshot នៅឡើយទេ' : 'No server snapshots created yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isKh
                  ? 'ចុចប៊ូតុង "បង្កើត Server Snapshot" ខាងលើដើម្បីបង្កើតឯកសារបម្រុងទុកដំបូងបង្អស់។'
                  : 'Click "Create Server Snapshot" to take a full point-in-time image of the platform database.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="py-3.5 px-6">{isKh ? 'ឈ្មោះឯកសារ' : 'Snapshot File'}</th>
                    <th className="py-3.5 px-4">{isKh ? 'ទំហំ' : 'File Size'}</th>
                    <th className="py-3.5 px-4">{isKh ? 'កាលបរិច្ឆេទបង្កើត' : 'Created Date'}</th>
                    <th className="py-3.5 px-4">{isKh ? 'ប្រភេទ' : 'Format'}</th>
                    <th className="py-3.5 px-6 text-right">{isKh ? 'សកម្មភាព' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {snapshots.map((s) => (
                    <tr key={s.filename} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                            <FileCode size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-xs sm:max-w-md">
                              {s.filename}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              storage/app/backups/admin/{s.filename}
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
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase">
                          JSON Snapshot
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadSnapshot(s.filename)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                            title={isKh ? 'ទាញយកឯកសារ' : 'Download File'}
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
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition"
                            title={isKh ? 'ស្ដារពី Snapshot នេះ' : 'Restore from this snapshot'}
                          >
                            <RotateCcw size={15} />
                          </button>

                          <button
                            type="button"
                            disabled={deletingFilename === s.filename}
                            onClick={() => handleDeleteSnapshot(s.filename)}
                            className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition disabled:opacity-50"
                            title={isKh ? 'លុប Snapshot' : 'Delete Snapshot'}
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

      {/* TAB 2: EXPORT CENTER */}
      {activeTab === 'exports' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {isKh ? 'មជ្ឈមណ្ឌលទាញយកទិន្នន័យ (Instant Data Exports)' : 'Instant Data Export Center'}
            </h2>
            <p className="text-xs text-slate-400">
              {isKh
                ? 'ទាញយកទិន្នន័យភ្លាមៗទៅកុំព្យូទ័រជាទម្រង់ JSON សម្រាប់ស្ដារឡើងវិញ ជាទម្រង់ CSV សម្រាប់ Excel/Spreadsheet ឬជាទម្រង់ SQL Dump Script។'
                : 'Instantly download dataset archives to your device in structured JSON, audit-ready CSV, or portable SQL dump statements.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Full System Backup */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  <Database size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isKh ? 'ទិន្នន័យប្រព័ន្ធទាំងមូល' : 'Complete Platform Archive'}
                  </h3>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                    Full System Snapshot
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isKh
                  ? 'រួមបញ្ចូលរាល់ Users, Properties, Rooms, Bookings, Invoices, Expenses, Settings និង Audit Logs ទាំងអស់។'
                  : 'Includes all registered users, rental properties, rooms, tenant bookings, invoices, and settings.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={exportingKey === 'all_json'}
                  onClick={() => handleExport('all', 'json')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  {exportingKey === 'all_json' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>JSON Archive</span>
                </button>

                <button
                  type="button"
                  disabled={exportingKey === 'all_sql'}
                  onClick={() => handleExport('all', 'sql')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'all_sql' ? <Loader2 size={14} className="animate-spin" /> : <FileCode size={14} />}
                  <span>SQL Script</span>
                </button>
              </div>
            </div>

            {/* Card 2: Users */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600">
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isKh ? 'គណនីអ្នកប្រើប្រាស់' : 'Users & Authentication'}
                  </h3>
                  <span className="text-[10px] text-sky-600 font-bold">
                    {stats?.counts.users || 0} {isKh ? 'គណនីសរុប' : 'total accounts'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isKh
                  ? 'ទាញយកបញ្ជី Admins, Owners, Staff, Tenants និងព័ត៌មានទំនាក់ទំនង។'
                  : 'Export all user profiles, roles, contact numbers, and bank account information.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={exportingKey === 'users_csv'}
                  onClick={() => handleExport('users', 'csv')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'users_csv' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  <span>Excel / CSV</span>
                </button>

                <button
                  type="button"
                  disabled={exportingKey === 'users_json'}
                  onClick={() => handleExport('users', 'json')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'users_json' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Card 3: Properties & Rooms */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isKh ? 'អចលនទ្រព្យ & បន្ទប់' : 'Properties & Rooms'}
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {stats?.counts.properties || 0} {isKh ? 'ផ្ទះ' : 'props'} • {stats?.counts.rooms || 0} {isKh ? 'បន្ទប់' : 'rooms'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isKh
                  ? 'ទាញយកបញ្ជីអគារស្នាក់នៅ បន្ទប់ជួល តម្លៃ និងលក្ខខណ្ឌបន្ទប់។'
                  : 'Export all listed properties, room inventories, prices, deposits, and status.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={exportingKey === 'properties_csv'}
                  onClick={() => handleExport('properties', 'csv')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'properties_csv' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
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

            {/* Card 4: Invoices & Payments */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isKh ? 'វិក្កយបត្រ & ការទូទាត់' : 'Invoices & Billing'}
                  </h3>
                  <span className="text-[10px] text-amber-600 font-bold">
                    {stats?.counts.invoices || 0} {isKh ? 'វិក្កយបត្រសរុប' : 'invoices recorded'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isKh
                  ? 'ទាញយកទិន្នន័យចំណូលវិក្កយបត្រ ថ្លៃភ្លើង ថ្លៃទឹក និងស្ថានភាពបង់ប្រាក់។'
                  : 'Export tenant monthly invoices, water and electricity meter records, and payment status.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={exportingKey === 'invoices_csv'}
                  onClick={() => handleExport('invoices', 'csv')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'invoices_csv' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
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

            {/* Card 5: Security & Audit Logs */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isKh ? 'កំណត់ហេតុសុវត្ថិភាព' : 'Security & Audit Logs'}
                  </h3>
                  <span className="text-[10px] text-rose-600 font-bold">
                    {stats?.counts.audit_logs || 0} {isKh ? 'កំណត់ត្រា' : 'audit logs'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isKh
                  ? 'ទាញយកកំណត់ត្រា Audit Logs សកម្មភាពចូលប្រើប្រាស់ និងការកែប្រែប្រព័ន្ធ។'
                  : 'Export compliance logs, IP addresses, authentication events, and administrative actions.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={exportingKey === 'audit_logs_csv'}
                  onClick={() => handleExport('audit_logs', 'csv')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'audit_logs_csv' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  <span>Excel / CSV</span>
                </button>

                <button
                  type="button"
                  disabled={exportingKey === 'audit_logs_json'}
                  onClick={() => handleExport('audit_logs', 'json')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'audit_logs_json' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Card 6: Expenses */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600">
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isKh ? 'ការចំណាយទូទៅ' : 'Platform Expenses'}
                  </h3>
                  <span className="text-[10px] text-purple-600 font-bold">
                    {stats?.counts.expenses || 0} {isKh ? 'កំណត់ត្រាចំណាយ' : 'expenses logged'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isKh
                  ? 'ទាញយករបាយការណ៍ចំណាយប្រតិបត្តិការ ជួសជុល និងសម្ភារៈបន្ទប់។'
                  : 'Export all business maintenance, operational, and property expense logs.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={exportingKey === 'expenses_csv'}
                  onClick={() => handleExport('expenses', 'csv')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {exportingKey === 'expenses_csv' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
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
          </div>
        </div>
      )}

      {/* RESTORE MODAL */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-5 p-6 relative">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isKh ? 'ស្ដារទិន្នន័យប្រព័ន្ធ (Disaster Recovery)' : 'Database Disaster Recovery'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isKh ? 'ស្ដារឡើងវិញពីឯកសារ JSON ឬ Server Snapshot' : 'Restore from uploaded JSON backup or snapshot'}
                </p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block font-bold">
                  {isKh ? 'សូមប្រុងប្រយ័ត្នខ្ពស់!' : 'High-Risk Operation!'}
                </strong>
                <p className="leading-relaxed text-[11px]">
                  {isKh
                    ? 'ការស្ដារទិន្នន័យនឹងបញ្ចូល ឬកែប្រែកំណត់ត្រាដែលមានស្រាប់នៅក្នុង Database។ សូមប្រាកដថាអ្នកមាន Snapshot បម្រុងទុកមុនពេលអនុវត្ត។'
                    : 'Restoring data will synchronize and upsert platform records. Ensure you take a fresh snapshot before restoring.'}
                </p>
              </div>
            </div>

            {/* Method 1: Choose Server Snapshot */}
            {snapshots.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isKh ? 'ជម្រើសទី ១៖ ជ្រើសរើស Snapshot លើ Server' : 'Option A: Select from Server Snapshots'}
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

            {/* Method 2: Upload File */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isKh ? 'ជម្រើសទី ២៖ ផ្ទុកឡើងឯកសារ JSON Backup ពីកុំព្យូទ័រ' : 'Option B: Upload Backup File (.json)'}
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

            {/* Checkbox Confirmation */}
            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={confirmRestore}
                onChange={(e) => setConfirmRestore(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                {isKh
                  ? 'ខ្ញុំយល់ច្បាស់ និងយល់ព្រមឱ្យប្រព័ន្ធធ្វើការស្ដារទិន្នន័យនេះ។'
                  : 'I understand the impact and confirm restoration of this backup.'}
              </span>
            </label>

            {/* Results Display */}
            {restoreSummary && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle size={16} />
                  <span>{isKh ? 'លទ្ធផលនៃការស្ដារជោគជ័យ៖' : 'Restore Summary Result:'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {Object.entries(restoreSummary).map(([k, v]) => (
                    <div key={k} className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-900/60 flex justify-between">
                      <span className="capitalize">{k}:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition active:scale-95 disabled:opacity-40"
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
