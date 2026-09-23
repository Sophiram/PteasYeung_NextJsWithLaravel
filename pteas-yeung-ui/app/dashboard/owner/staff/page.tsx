'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  Users2, UserPlus, Search, CheckCircle2, XCircle, 
  Trash2, Edit3, X, Loader2, Phone, Mail, Lock, Shield, RefreshCw,
  Key, Sparkles, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface Staff {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  status: 'active' | 'inactive';
  role: string;
  created_at?: string;
}

interface PermissionItem {
  id: number;
  name: string;
  slug: string;
  group: string;
  description?: string;
}

const MODULE_LABELS: Record<string, { kh: string; en: string }> = {
  rooms: { kh: 'គ្រប់គ្រងបន្ទប់ (Rooms)', en: 'Room Operations' },
  invoices: { kh: 'វិក្កយបត្រ & ប្រមូលប្រាក់ (Invoices & Billing)', en: 'Invoices & Billing' },
  bookings: { kh: 'ការកក់ & ភ្ញៀវ (Bookings & Check-in)', en: 'Bookings & Check-in' },
  properties: { kh: 'អចលនទ្រព្យ (Properties)', en: 'Properties' },
  expenses: { kh: 'ចំណាយ (Expenses)', en: 'Expenses' },
};

const PRESETS: Record<string, { labelKh: string; labelEn: string; perms: string[] }> = {
  full: {
    labelKh: 'ប្រតិបត្តិការពេញលេញ',
    labelEn: 'Full Operations',
    perms: [
      'rooms.view', 'rooms.status_update', 'rooms.edit',
      'invoices.view', 'invoices.collect_payment',
      'bookings.view', 'bookings.approve',
      'properties.view'
    ]
  },
  frontdesk: {
    labelKh: 'ត្រួតពិនិត្យបន្ទប់ & ទទួលភ្ញៀវ',
    labelEn: 'Front Desk / Rooms',
    perms: [
      'rooms.view', 'rooms.status_update',
      'bookings.view', 'bookings.approve',
      'properties.view'
    ]
  },
  cashier: {
    labelKh: 'គិតលុយ & ប្រមូលប្រាក់',
    labelEn: 'Cashier & Billing',
    perms: [
      'rooms.view',
      'invoices.view', 'invoices.collect_payment'
    ]
  },
  readonly: {
    labelKh: 'មើលទិន្នន័យតែប៉ុណ្ណោះ',
    labelEn: 'Read Only',
    perms: [
      'rooms.view', 'invoices.view', 'bookings.view', 'properties.view'
    ]
  }
};

export default function OwnerStaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState<'kh' | 'en'>('kh');

  // Modal states: Add / Edit Staff
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  // Permissions Modal state
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [targetStaff, setTargetStaff] = useState<Staff | null>(null);
  const [availablePerms, setAvailablePerms] = useState<PermissionItem[]>([]);
  const [groupedPerms, setGroupedPerms] = useState<Record<string, PermissionItem[]>>({});
  const [staffDirectPerms, setStaffDirectPerms] = useState<string[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
    if (savedLang) setLang(savedLang);
    fetchStaffList();
  }, []);

  const t = {
    kh: {
      title: 'គ្រប់គ្រងបុគ្គលិក & សិទ្ធិការងារ',
      subtitle: 'បង្កើត និងគ្រប់គ្រងគណនីបុគ្គលិក កំណត់សិទ្ធិត្រួតពិនិត្យបន្ទប់ វិក្កយបត្រ និងការងារប្រចាំថ្ងៃ',
      createBtn: 'បន្ថែមបុគ្គលិកថ្មី',
      totalStaff: 'បុគ្គលិកសរុប',
      activeStaff: 'កំពុងបំពេញការងារ (Active)',
      inactiveStaff: 'ផ្អាកដំណើរការ (Inactive)',
      searchPlaceholder: 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល លេខទូរស័ព្ទ...',
      colName: 'ឈ្មោះ & ព័ត៌មាន',
      colContact: 'ទំនាក់ទំនង',
      colRole: 'តួនាទី',
      colStatus: 'ស្ថានភាព',
      colAction: 'សកម្មភាព',
      noStaff: 'មិនទាន់មានបុគ្គលិកត្រូវបានបង្កើតនៅឡើយទេ',
      modalCreateTitle: 'បន្ថែមបុគ្គលិកថ្មី',
      modalEditTitle: 'កែប្រែព័ត៌មានបុគ្គលិក',
      nameLabel: 'ឈ្មោះបុគ្គលិក *',
      emailLabel: 'អាសយដ្ឋានអ៊ីមែល *',
      phoneLabel: 'លេខទូរស័ព្ទ',
      passwordLabel: 'លេខកូដសម្ងាត់ *',
      passwordOptionalLabel: 'លេខកូដសម្ងាត់ថ្មី (ទុកទំនេរបើមិនចង់ប្តូរ)',
      statusLabel: 'ស្ថានភាពគណនី',
      activeOpt: 'សកម្ម (Active)',
      inactiveOpt: 'ផ្អាក (Inactive)',
      roleDesc: 'បុគ្គលិកអាចពិនិត្យបន្ទប់ និងជួយគ្រប់គ្រងស្ថានភាពបន្ទប់ជួល',
      saveBtn: 'រក្សាទុក',
      cancelBtn: 'បោះបង់',
      deleteConfirm: 'តើអ្នកពិតជាចង់លុបគណនីបុគ្គលិកនេះមែនទេ?'
    },
    en: {
      title: 'Staff Management & Permissions',
      subtitle: 'Create and oversee staff member accounts, assign granular duties for room maintenance, invoicing, and bookings',
      createBtn: 'Add New Staff',
      totalStaff: 'Total Staff',
      activeStaff: 'Active Staff',
      inactiveStaff: 'Inactive Staff',
      searchPlaceholder: 'Search by name, email, phone...',
      colName: 'Name & Info',
      colContact: 'Contact',
      colRole: 'Role',
      colStatus: 'Status',
      colAction: 'Actions',
      noStaff: 'No staff accounts created yet',
      modalCreateTitle: 'Add New Staff Member',
      modalEditTitle: 'Edit Staff Information',
      nameLabel: 'Full Name *',
      emailLabel: 'Email Address *',
      phoneLabel: 'Phone Number',
      passwordLabel: 'Password *',
      passwordOptionalLabel: 'New Password (Leave blank to keep unchanged)',
      statusLabel: 'Account Status',
      activeOpt: 'Active',
      inactiveOpt: 'Inactive',
      roleDesc: 'Staff members can check room statuses and assist in managing property facilities',
      saveBtn: 'Save Staff',
      cancelBtn: 'Cancel',
      deleteConfirm: 'Are you sure you want to remove this staff account?'
    }
  };

  const currentT = t[lang];

  const fetchStaffList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/owner/staff');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setStaffList(data);
    } catch (err) {
      console.error('Error fetching staff:', err);
      toast.error('មិនអាចទាញយកទិន្នន័យបុគ្គលិកបានទេ');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff);
      setFormName(staff.name);
      setFormEmail(staff.email);
      setFormPhone(staff.phone || '');
      setFormPassword('');
      setFormStatus(staff.status);
    } else {
      setEditingStaff(null);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormPassword('');
      setFormStatus('active');
    }
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      toast.error('សូមបំពេញព័ត៌មានដែលត្រូវការ!');
      return;
    }

    if (!editingStaff && (!formPassword || formPassword.length < 6)) {
      toast.error('លេខកូដសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ ខ្ទង់!');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: formName,
        email: formEmail,
        phone: formPhone || null,
        status: formStatus
      };

      if (formPassword) {
        payload.password = formPassword;
      }

      if (editingStaff) {
        await api.put(`/owner/staff/${editingStaff.id}`, payload);
        toast.success('បានកែប្រែព័ត៌មានបុគ្គលិកដោយជោគជ័យ!');
      } else {
        await api.post('/owner/staff', payload);
        toast.success('បានបង្កើតគណនីបុគ្គលិកដោយជោគជ័យ!');
      }

      setIsModalOpen(false);
      fetchStaffList();
    } catch (err: any) {
      console.error('Error saving staff:', err);
      const msg = err.response?.data?.message || 'បរាជ័យក្នុងការរក្សាទុកគណនីបុគ្គលិក';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = (id: number) => {
    Swal.fire({
      title: lang === 'kh' ? 'បញ្ជាក់ការលុប' : 'Confirm Deletion',
      text: currentT.deleteConfirm,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: lang === 'kh' ? 'យល់ព្រមលុប' : 'Delete',
      cancelButtonText: lang === 'kh' ? 'បោះបង់' : 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/owner/staff/${id}`);
          toast.success('បានលុបគណនីបុគ្គលិករួចរាល់');
          fetchStaffList();
        } catch (err) {
          toast.error('មិនអាចលុបគណនីបុគ្គលិកបានទេ');
        }
      }
    });
  };

  // Open Permissions Modal
  const handleOpenPermModal = async (staff: Staff) => {
    setTargetStaff(staff);
    setIsPermModalOpen(true);
    setLoadingPerms(true);

    try {
      const res = await api.get(`/owner/staff/${staff.id}/permissions`);
      setAvailablePerms(res.data.available_permissions || []);
      setGroupedPerms(res.data.grouped_available || {});
      setStaffDirectPerms(res.data.direct_permissions || []);
    } catch (err) {
      console.error('Error fetching staff permissions:', err);
      toast.error('មិនអាចទាញយកសិទ្ធិបុគ្គលិកបានទេ');
    } finally {
      setLoadingPerms(false);
    }
  };

  const handleTogglePerm = (slug: string) => {
    setStaffDirectPerms(prev => 
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    setStaffDirectPerms(preset.perms);
    toast.success(lang === 'kh' ? `បានអនុវត្តទម្រង់: ${preset.labelKh}` : `Applied preset: ${preset.labelEn}`);
  };

  const handleSavePermissions = async () => {
    if (!targetStaff) return;

    setSavingPerms(true);
    try {
      await api.put(`/owner/staff/${targetStaff.id}/permissions`, {
        permissions: staffDirectPerms
      });
      toast.success(lang === 'kh' ? 'បានរក្សាទុកសិទ្ធិបុគ្គលិកជោគជ័យ!' : 'Staff permissions updated successfully!');
      setIsPermModalOpen(false);
      setTargetStaff(null);
    } catch (err: any) {
      console.error('Error saving staff permissions:', err);
      toast.error(err.response?.data?.message || 'មិនអាចរក្សាទុកសិទ្ធិបុគ្គលិកបានទេ');
    } finally {
      setSavingPerms(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const query = search.toLowerCase();
    const nameMatch = s.name.toLowerCase().includes(query);
    const emailMatch = s.email.toLowerCase().includes(query);
    const phoneMatch = (s.phone || '').toLowerCase().includes(query);
    return nameMatch || emailMatch || phoneMatch;
  });

  const activeCount = staffList.filter(s => s.status === 'active').length;
  const inactiveCount = staffList.filter(s => s.status === 'inactive').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users2 className="text-indigo-600" />
            {currentT.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {currentT.subtitle}
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 shrink-0"
        >
          <UserPlus size={16} />
          <span>{currentT.createBtn}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">
            <Users2 size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{currentT.totalStaff}</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{staffList.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{currentT.activeStaff}</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{currentT.inactiveStaff}</p>
            <h3 className="text-xl font-black text-slate-600 dark:text-slate-400 mt-0.5">{inactiveCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={currentT.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        <button
          onClick={fetchStaffList}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">កំពុងទាញយកបញ្ជីបុគ្គលិក...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Users2 size={40} className="stroke-[1.5] text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-500">{currentT.noStaff}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="px-5 py-3.5">{currentT.colName}</th>
                  <th className="px-5 py-3.5">{currentT.colContact}</th>
                  <th className="px-5 py-3.5">{currentT.colRole}</th>
                  <th className="px-5 py-3.5">{currentT.colStatus}</th>
                  <th className="px-5 py-3.5 text-right">{currentT.colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {staff.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            កូដសម្គាល់ #{staff.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Mail size={12} className="text-indigo-500 shrink-0" />
                        <span>{staff.email}</span>
                      </div>
                      {staff.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Phone size={12} className="text-emerald-500 shrink-0" />
                          <span>{staff.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        <Shield size={11} className="text-indigo-500" />
                        <span>Staff / បុគ្គលិក</span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {staff.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-black text-[10px] uppercase border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 size={11} />
                          <span>{currentT.activeOpt}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase">
                          <XCircle size={11} />
                          <span>{currentT.inactiveOpt}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Permissions button */}
                        <button
                          onClick={() => handleOpenPermModal(staff)}
                          className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition border border-sky-200/60 dark:border-sky-800/60"
                          title={lang === 'kh' ? 'កំណត់សិទ្ធិការងារ' : 'Configure Permissions'}
                        >
                          <Shield size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenModal(staff)}
                          className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 hover:bg-indigo-100 transition"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 hover:bg-rose-100 transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
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

      {/* Modal: Add/Edit Staff */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users2 className="text-indigo-600" />
                {editingStaff ? currentT.modalEditTitle : currentT.modalCreateTitle}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 pt-4 text-xs">
              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {currentT.nameLabel}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {currentT.emailLabel}
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="staff@pteasyeung.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {currentT.phoneLabel}
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="012 345 678"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {editingStaff ? currentT.passwordOptionalLabel : currentT.passwordLabel}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {currentT.statusLabel}
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="active">{currentT.activeOpt}</option>
                  <option value="inactive">{currentT.inactiveOpt}</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {currentT.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{currentT.saveBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Staff Permissions Manager */}
      {isPermModalOpen && targetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="text-sky-600 w-5 h-5" />
                  <span>{lang === 'kh' ? 'កំណត់សិទ្ធិការងារបុគ្គលិក' : 'Staff Permissions Delegation'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {targetStaff.name} ({targetStaff.email}) • Staff Member
                </p>
              </div>
              <button onClick={() => setIsPermModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            {/* Presets Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-500" />
                <span>{lang === 'kh' ? 'ទម្រង់សិទ្ធិគំរូ (Quick Presets)' : 'Quick Presets'}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleApplyPreset(key)}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-800 transition hover:border-indigo-300 hover:text-indigo-600 shadow-xs"
                  >
                    {lang === 'kh' ? preset.labelKh : preset.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {loadingPerms ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                  <p className="text-xs font-medium">កំពុងទាញយកសិទ្ធិ...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedPerms).map(([groupKey, groupPerms]) => {
                    const groupLabel = MODULE_LABELS[groupKey] || { kh: groupKey, en: groupKey };

                    return (
                      <div key={groupKey} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-sky-500" />
                            {lang === 'kh' ? groupLabel.kh : groupLabel.en}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const slugs = groupPerms.map(p => p.slug);
                              const allChecked = slugs.every(s => staffDirectPerms.includes(s));
                              if (allChecked) {
                                setStaffDirectPerms(prev => prev.filter(s => !slugs.includes(s)));
                              } else {
                                setStaffDirectPerms(prev => Array.from(new Set([...prev, ...slugs])));
                              }
                            }}
                            className="text-[11px] font-semibold text-sky-600 hover:underline"
                          >
                            {groupPerms.every(p => staffDirectPerms.includes(p.slug))
                              ? (lang === 'kh' ? 'ដោះទាំងអស់' : 'Deselect All')
                              : (lang === 'kh' ? 'ជ្រើសទាំងអស់' : 'Select All')}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groupPerms.map((perm) => {
                            const isChecked = staffDirectPerms.includes(perm.slug);

                            return (
                              <label
                                key={perm.slug}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                                  isChecked
                                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePerm(perm.slug)}
                                  className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-tight">
                                    {perm.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {perm.slug}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'kh' ? `បានជ្រើសរើស ${staffDirectPerms.length} សិទ្ធិ` : `${staffDirectPerms.length} permissions active`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPermModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  {currentT.cancelBtn}
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={savingPerms || loadingPerms}
                  className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                >
                  {savingPerms && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{currentT.saveBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
