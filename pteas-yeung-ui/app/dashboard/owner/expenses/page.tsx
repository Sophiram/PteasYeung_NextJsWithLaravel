'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  Wallet, Plus, Search, Filter, Calendar, DollarSign, 
  Trash2, Edit3, X, Loader2, Building, Tag, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface Property {
  id: number;
  title: string;
  city?: string;
}

interface Expense {
  id: number;
  property_id?: number | null;
  title: string;
  amount: number | string;
  description?: string | null;
  date: string;
  created_at?: string;
  property?: Property;
}

export default function OwnerExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [lang, setLang] = useState<'kh' | 'en'>('kh');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formPropertyId, setFormPropertyId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
    if (savedLang) setLang(savedLang);
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedPropertyFilter, startDateFilter, endDateFilter]);

  const t = {
    kh: {
      title: 'គ្រប់គ្រងការចំណាយ',
      subtitle: 'កត់ត្រា និងតាមដានរាល់ការចំណាយលើការថែទាំ ជួសជុល ភ្លើងទឹក និងប្រតិបត្តិការផ្ទះជួល',
      createBtn: 'កត់ត្រាការចំណាយថ្មី',
      totalExpense: 'ការចំណាយសរុប',
      recordCount: 'ចំនួនប្រតិបត្តិការ',
      avgExpense: 'ចំណាយមធ្យម / ប្រតិបត្តិការ',
      searchPlaceholder: 'ស្វែងរកចំណងជើង ឬការពិពណ៌នា...',
      allProperties: 'អចលនទ្រព្យទាំងអស់',
      filterStartDate: 'ពីថ្ងៃ',
      filterEndDate: 'ដល់ថ្ងៃ',
      colDate: 'កាលបរិច្ឆេទ',
      colTitle: 'ចំណងជើងការចំណាយ',
      colProperty: 'អចលនទ្រព្យ',
      colAmount: 'ទឹកប្រាក់',
      colDesc: 'ពិពណ៌នា / សម្គាល់',
      colAction: 'សកម្មភាព',
      noExpenses: 'មិនទាន់មានការចំណាយត្រូវបានកត់ត្រាទេ',
      modalCreateTitle: 'កត់ត្រាការចំណាយថ្មី',
      modalEditTitle: 'កែប្រែព័ត៌មានការចំណាយ',
      propertyLabel: 'អចលនទ្រព្យពាក់ព័ន្ធ (បើមាន)',
      generalExpense: '-- ការចំណាយទូទៅ (មិនកំណត់អគារ) --',
      titleLabel: 'ចំណងជើងការចំណាយ *',
      amountLabel: 'ទឹកប្រាក់ ($) *',
      dateLabel: 'ថ្ងៃចំណាយ *',
      descLabel: 'ការពិពណ៌នាបន្ថែម',
      saveBtn: 'រក្សាទុក',
      cancelBtn: 'បោះបង់',
      deleteConfirm: 'តើអ្នកពិតជាចង់លុបការចំណាយនេះមែនទេ?',
      quickCategories: 'ជម្រើសរហ័ស៖',
      catElectric: 'ជួសជុលអគ្គិសនី',
      catPlumbing: 'ជួសជុលទឹក-ទុយោ',
      catCleaning: 'សម្អាតទូទៅ',
      catWifi: 'ថ្លៃអ៊ីនធឺណិត',
      catSecurity: 'សន្តិសុខ & កាមេរ៉ា',
      catGarbage: 'ថ្លៃសំរាម'
    },
    en: {
      title: 'Expense Management',
      subtitle: 'Track and record property maintenance, repair bills, utility costs, and operational fees',
      createBtn: 'Record New Expense',
      totalExpense: 'Total Expenses',
      recordCount: 'Total Transactions',
      avgExpense: 'Average / Transaction',
      searchPlaceholder: 'Search by title or description...',
      allProperties: 'All Properties',
      filterStartDate: 'From Date',
      filterEndDate: 'To Date',
      colDate: 'Date',
      colTitle: 'Expense Title',
      colProperty: 'Property',
      colAmount: 'Amount',
      colDesc: 'Description / Notes',
      colAction: 'Actions',
      noExpenses: 'No expenses recorded yet',
      modalCreateTitle: 'Record New Expense',
      modalEditTitle: 'Edit Expense Information',
      propertyLabel: 'Associated Property (Optional)',
      generalExpense: '-- General Expense (No specific property) --',
      titleLabel: 'Expense Title *',
      amountLabel: 'Amount ($) *',
      dateLabel: 'Expense Date *',
      descLabel: 'Additional Description',
      saveBtn: 'Save Expense',
      cancelBtn: 'Cancel',
      deleteConfirm: 'Are you sure you want to delete this expense record?',
      quickCategories: 'Quick Tags:',
      catElectric: 'Electrical Repair',
      catPlumbing: 'Plumbing Repair',
      catCleaning: 'General Cleaning',
      catWifi: 'Internet / WiFi Bill',
      catSecurity: 'Security & CCTV',
      catGarbage: 'Trash Collection'
    }
  };

  const currentT = t[lang];

  const fetchProperties = async () => {
    try {
      const res = await api.get('/owner/properties');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedPropertyFilter) params.append('property_id', selectedPropertyFilter);
      if (startDateFilter) params.append('start_date', startDateFilter);
      if (endDateFilter) params.append('end_date', endDateFilter);

      const res = await api.get(`/owner/expenses?${params.toString()}`);
      if (res.data?.success) {
        setExpenses(res.data.data || []);
        setTotalAmount(Number(res.data.total_amount || 0));
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      toast.error('មិនអាចទាញយកទិន្នន័យចំណាយបានទេ');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormPropertyId(expense.property_id ? expense.property_id.toString() : '');
      setFormTitle(expense.title);
      setFormAmount(Number(expense.amount));
      setFormDate(expense.date);
      setFormDescription(expense.description || '');
    } else {
      setEditingExpense(null);
      setFormPropertyId('');
      setFormTitle('');
      setFormAmount('');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormDescription('');
    }
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formAmount || !formDate) {
      toast.error('សូមបំពេញព័ត៌មានដែលត្រូវការ!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        property_id: formPropertyId ? Number(formPropertyId) : null,
        title: formTitle,
        amount: Number(formAmount),
        date: formDate,
        description: formDescription || null
      };

      if (editingExpense) {
        await api.put(`/owner/expenses/${editingExpense.id}`, payload);
        toast.success('បានកែប្រែការចំណាយដោយជោគជ័យ!');
      } else {
        await api.post('/owner/expenses', payload);
        toast.success('បានកត់ត្រាការចំណាយដោយជោគជ័យ!');
      }

      setIsModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      console.error('Error saving expense:', err);
      const msg = err.response?.data?.message || 'បរាជ័យក្នុងការរក្សាទុក';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = (id: number) => {
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
          await api.delete(`/owner/expenses/${id}`);
          toast.success('បានលុបការចំណាយរួចរាល់');
          fetchExpenses();
        } catch (err) {
          toast.error('មិនអាចលុបការចំណាយបានទេ');
        }
      }
    });
  };

  const filteredExpenses = expenses.filter((exp) => {
    const query = search.toLowerCase();
    const titleMatch = exp.title.toLowerCase().includes(query);
    const descMatch = (exp.description || '').toLowerCase().includes(query);
    const propMatch = (exp.property?.title || '').toLowerCase().includes(query);
    return titleMatch || descMatch || propMatch;
  });

  const avgExpense = expenses.length > 0 ? (totalAmount / expenses.length).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="text-rose-500" />
            {currentT.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {currentT.subtitle}
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/25 transition-all transform active:scale-95 shrink-0"
        >
          <Plus size={16} />
          <span>{currentT.createBtn}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentT.totalExpense}</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              ${totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center shrink-0">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentT.recordCount}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {expenses.length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentT.avgExpense}</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              ${avgExpense}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={currentT.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Property Dropdown Filter */}
          <select
            value={selectedPropertyFilter}
            onChange={(e) => setSelectedPropertyFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="">{currentT.allProperties}</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-xl text-xs">
            <Calendar size={13} className="text-slate-400" />
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 outline-none text-[11px]"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 outline-none text-[11px]"
            />
          </div>

          <button
            onClick={fetchExpenses}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
            <p className="text-xs font-semibold">កំពុងទាញយកការចំណាយ...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Wallet size={40} className="stroke-[1.5] text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-500">{currentT.noExpenses}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="px-5 py-3.5">{currentT.colDate}</th>
                  <th className="px-5 py-3.5">{currentT.colTitle}</th>
                  <th className="px-5 py-3.5">{currentT.colProperty}</th>
                  <th className="px-5 py-3.5">{currentT.colAmount}</th>
                  <th className="px-5 py-3.5">{currentT.colDesc}</th>
                  <th className="px-5 py-3.5 text-right">{currentT.colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-900 dark:text-white text-sm">
                        {exp.title}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {exp.property ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">
                          <Building size={12} />
                          <span>{exp.property.title}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">ទូទៅ (General)</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-black text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                      ${Number(exp.amount).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {exp.description || '—'}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenModal(exp)}
                          className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 hover:bg-indigo-100 transition"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
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

      {/* Modal: Add/Edit Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="text-rose-600" />
                {editingExpense ? currentT.modalEditTitle : currentT.modalCreateTitle}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 pt-4 text-xs">
              {/* Associated Property */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {currentT.propertyLabel}
                </label>
                <select
                  value={formPropertyId}
                  onChange={(e) => setFormPropertyId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                >
                  <option value="">{currentT.generalExpense}</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} {p.city ? `(${p.city})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Quick Categories */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {currentT.titleLabel}
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="ឧ. ជួសជុលម៉ាស៊ីនត្រជាក់បន្ទប់ 201"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium text-sm"
                />

                {/* Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold">{currentT.quickCategories}</span>
                  {[
                    currentT.catElectric,
                    currentT.catPlumbing,
                    currentT.catCleaning,
                    currentT.catWifi,
                    currentT.catSecurity,
                    currentT.catGarbage
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setFormTitle(chip)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      +{chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {currentT.amountLabel}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-rose-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {currentT.dateLabel}
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {currentT.descLabel}
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="បញ្ជាក់ព័ត៌មានលម្អិតបន្ថែម ឬឈ្មោះជាងជួសជុល..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50"
                >
                  {currentT.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-md shadow-rose-600/30"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{currentT.saveBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
