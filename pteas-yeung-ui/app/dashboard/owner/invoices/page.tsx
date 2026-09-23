'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  FileText, Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, 
  DollarSign, Trash2, Printer, Eye, X, Loader2, Calendar, User, Building,
  Zap, Droplets, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ReceiptModal from '@/app/components/ReceiptModal';

interface Invoice {
  id: number;
  booking_id: number;
  electricity_start_unit: number;
  electricity_end_unit: number;
  water_unit: number;
  total_amount: number | string;
  payment_status: 'paid' | 'unpaid' | 'partial';
  due_date: string;
  created_at?: string;
  booking?: {
    id: number;
    room?: {
      id: number;
      room_number: string;
      price: number | string;
      property?: {
        id: number;
        title: string;
        address?: string;
        city?: string;
      };
    };
    tenant?: {
      id: number;
      name: string;
      phone?: string;
      email?: string;
    };
  };
}

interface BookingOption {
  id: number;
  status: string;
  room?: {
    id: number;
    room_number: string;
    price: number | string;
    property?: {
      title: string;
    };
  };
  tenant?: {
    id: number;
    name: string;
    phone?: string;
  };
}

export default function OwnerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lang, setLang] = useState<'kh' | 'en'>('kh');

  const [stats, setStats] = useState({
    total_amount: 0,
    paid_amount: 0,
    unpaid_amount: 0
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [elecStart, setElecStart] = useState<number | ''>(0);
  const [elecEnd, setElecEnd] = useState<number | ''>(0);
  const [waterUnits, setWaterUnits] = useState<number | ''>(0);
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [createStatus, setCreateStatus] = useState<'unpaid' | 'paid' | 'partial'>('unpaid');

  const elecRate = 0.25;
  const waterRate = 0.60;

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
    if (savedLang) setLang(savedLang);
    fetchInvoices();
    fetchBookings();
  }, []);

  const t = {
    kh: {
      title: 'គ្រប់គ្រងវិក្កយបត្រ',
      subtitle: 'បង្កើត និងតាមដានវិក្កយបត្រជួលបន្ទប់ ថ្លៃភ្លើង និងថ្លៃទឹករបស់អ្នកជួល',
      createBtn: 'បង្កើតវិក្កយបត្រថ្មី',
      totalBilled: 'ទឹកប្រាក់សរុប',
      paidAmount: 'បានបង់រួចរាល់',
      unpaidAmount: 'មិនទាន់បង់',
      searchPlaceholder: 'ស្វែងរកតាមឈ្មោះអ្នកជួល លេខបន្ទប់...',
      filterAll: 'ទាំងអស់',
      filterPaid: 'បានបង់',
      filterUnpaid: 'មិនទាន់បង់',
      filterPartial: 'បង់ខ្លះ',
      colId: 'លេខកូដ',
      colTenant: 'អ្នកជួល & បន្ទប់',
      colUtilities: 'ភ្លើង & ទឹក',
      colAmount: 'ទឹកប្រាក់សរុប',
      colDueDate: 'ថ្ងៃផុតកំណត់',
      colStatus: 'ស្ថានភាព',
      colAction: 'សកម្មភាព',
      viewReceipt: 'មើលវិក្កយបត្រ',
      markPaid: 'សម្គាល់ថាបានបង់',
      deleteConfirm: 'តើអ្នកពិតជាចង់លុបវិក្កយបត្រនេះមែនទេ?',
      createTitle: 'បង្កើតវិក្កយបត្រថ្មី',
      selectBooking: 'ជ្រើសរើសការកក់ / បន្ទប់ *',
      elecStartLabel: 'លេខកុងទ័រភ្លើងដើម',
      elecEndLabel: 'លេខកុងទ័រភ្លើងចុង',
      waterLabel: 'ចំនួនទឹកប្រើប្រាស់ (ម³)',
      amountLabel: 'ទឹកប្រាក់សរុប ($) *',
      dueDateLabel: 'ថ្ងៃផុតកំណត់បង់ប្រាក់ *',
      statusLabel: 'ស្ថានភាពបង់ប្រាក់',
      saveBtn: 'រក្សាទុកវិក្កយបត្រ',
      cancelBtn: 'បោះបង់',
      noInvoices: 'មិនទាន់មានវិក្កយបត្រនៅឡើយទេ',
      autoCalcHint: 'ប្រព័ន្ធបានគណនាថ្លៃបន្ទប់ + ភ្លើង + ទឹកដោយស្វ័យប្រវត្តិ',
      printBtn: 'បោះពុម្ពវិក្កយបត្រ'
    },
    en: {
      title: 'Invoice Management',
      subtitle: 'Create and track room rent, electricity, and water invoices for your tenants',
      createBtn: 'Create New Invoice',
      totalBilled: 'Total Invoiced',
      paidAmount: 'Paid Amount',
      unpaidAmount: 'Unpaid / Pending',
      searchPlaceholder: 'Search by tenant name, room number...',
      filterAll: 'All Status',
      filterPaid: 'Paid',
      filterUnpaid: 'Unpaid',
      filterPartial: 'Partial',
      colId: 'Invoice #',
      colTenant: 'Tenant & Room',
      colUtilities: 'Utilities',
      colAmount: 'Total Amount',
      colDueDate: 'Due Date',
      colStatus: 'Status',
      colAction: 'Actions',
      viewReceipt: 'View Receipt',
      markPaid: 'Mark as Paid',
      deleteConfirm: 'Are you sure you want to delete this invoice?',
      createTitle: 'Create New Invoice',
      selectBooking: 'Select Active Booking / Room *',
      elecStartLabel: 'Electricity Start Meter',
      elecEndLabel: 'Electricity End Meter',
      waterLabel: 'Water Usage (m³)',
      amountLabel: 'Total Amount ($) *',
      dueDateLabel: 'Payment Due Date *',
      statusLabel: 'Payment Status',
      saveBtn: 'Save Invoice',
      cancelBtn: 'Cancel',
      noInvoices: 'No invoices found',
      autoCalcHint: 'Estimated total: Room Rent + Electricity + Water',
      printBtn: 'Print Invoice'
    }
  };

  const currentT = t[lang];

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/owner/invoices');
      if (res.data?.success) {
        setInvoices(res.data.data || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      toast.error('មិនអាចទាញយកទិន្នន័យវិក្កយបត្របានទេ');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get('/owner/bookings');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  useEffect(() => {
    if (!selectedBookingId) return;
    const booking = bookings.find(b => b.id === Number(selectedBookingId));
    if (!booking) return;

    const baseRent = Number(booking.room?.price || 0);
    const start = Number(elecStart || 0);
    const end = Number(elecEnd || 0);
    const elecUnits = Math.max(0, end - start);
    const water = Number(waterUnits || 0);

    const calculated = baseRent + (elecUnits * elecRate) + (water * waterRate);
    setTotalAmount(parseFloat(calculated.toFixed(2)));
  }, [selectedBookingId, elecStart, elecEnd, waterUnits]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !dueDate || !totalAmount) {
      toast.error('សូមបំពេញព័ត៌មានដែលត្រូវការ!');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/owner/invoices', {
        booking_id: Number(selectedBookingId),
        electricity_start_unit: Number(elecStart || 0),
        electricity_end_unit: Number(elecEnd || 0),
        water_unit: Number(waterUnits || 0),
        total_amount: Number(totalAmount),
        payment_status: createStatus,
        due_date: dueDate
      });

      toast.success('បានបង្កើតវិក្កយបត្រដោយជោគជ័យ!');
      setIsCreateModalOpen(false);
      resetForm();
      fetchInvoices();
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      const msg = err.response?.data?.message || 'បរាជ័យក្នុងការបង្កើតវិក្កយបត្រ';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: 'paid' | 'unpaid' | 'partial') => {
    try {
      await api.put(`/owner/invoices/${id}`, {
        payment_status: newStatus
      });
      toast.success('បានផ្លាស់ប្តូរស្ថានភាពរួចរាល់!');
      fetchInvoices();
    } catch (err) {
      toast.error('មិនអាចកែប្រែស្ថានភាពបានទេ');
    }
  };

  const handleDeleteInvoice = (id: number) => {
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
          await api.delete(`/owner/invoices/${id}`);
          toast.success('បានលុបវិក្កយបត្ររួចរាល់');
          fetchInvoices();
        } catch (err) {
          toast.error('មិនអាចលុបវិក្កយបត្របានទេ');
        }
      }
    });
  };

  const resetForm = () => {
    setSelectedBookingId('');
    setElecStart(0);
    setElecEnd(0);
    setWaterUnits(0);
    setTotalAmount('');
    setDueDate('');
    setCreateStatus('unpaid');
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.payment_status === statusFilter;
    const query = search.toLowerCase();
    const tenantName = inv.booking?.tenant?.name?.toLowerCase() || '';
    const roomNum = inv.booking?.room?.room_number?.toLowerCase() || '';
    const propTitle = inv.booking?.room?.property?.title?.toLowerCase() || '';
    const matchesSearch = tenantName.includes(query) || roomNum.includes(query) || propTitle.includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 size={12} />
          {currentT.filterPaid}
        </span>
      );
    }
    if (status === 'partial') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
          <Clock size={12} />
          {currentT.filterPartial}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
        <AlertCircle size={12} />
        {currentT.filterUnpaid}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="text-indigo-600" />
            {currentT.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {currentT.subtitle}
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 shrink-0"
        >
          <Plus size={16} />
          <span>{currentT.createBtn}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentT.totalBilled}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              ${stats.total_amount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentT.paidAmount}</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              ${stats.paid_amount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentT.unpaidAmount}</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              ${stats.unpaid_amount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={currentT.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter size={14} className="text-slate-400 shrink-0" />
          {['all', 'unpaid', 'paid', 'partial'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st === 'all' && currentT.filterAll}
              {st === 'paid' && currentT.filterPaid}
              {st === 'unpaid' && currentT.filterUnpaid}
              {st === 'partial' && currentT.filterPartial}
            </button>
          ))}
          <button
            onClick={fetchInvoices}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 ml-auto"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">កំពុងទាញយកវិក្កយបត្រ...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <FileText size={40} className="stroke-[1.5] text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-500">{currentT.noInvoices}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="px-5 py-3.5">{currentT.colId}</th>
                  <th className="px-5 py-3.5">{currentT.colTenant}</th>
                  <th className="px-5 py-3.5">{currentT.colUtilities}</th>
                  <th className="px-5 py-3.5">{currentT.colAmount}</th>
                  <th className="px-5 py-3.5">{currentT.colDueDate}</th>
                  <th className="px-5 py-3.5">{currentT.colStatus}</th>
                  <th className="px-5 py-3.5 text-right">{currentT.colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      #{inv.id}
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {inv.booking?.tenant?.name || 'Tenant'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>បន្ទប់ {inv.booking?.room?.room_number}</span>
                          <span>•</span>
                          <span className="truncate">{inv.booking?.room?.property?.title}</span>
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                          <Zap size={12} />
                          <span>{inv.electricity_end_unit - inv.electricity_start_unit} kWh</span>
                          <span className="text-slate-400 font-normal">({inv.electricity_start_unit} → {inv.electricity_end_unit})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold">
                          <Droplets size={12} />
                          <span>{inv.water_unit} m³</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-black text-sm text-slate-900 dark:text-white">
                      ${Number(inv.total_amount).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-500 dark:text-slate-400">
                      {inv.due_date}
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(inv.payment_status)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.payment_status !== 'paid' && (
                          <button
                            onClick={() => handleUpdateStatus(inv.id, 'paid')}
                            title={currentT.markPaid}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-100 transition"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsViewModalOpen(true);
                          }}
                          title={lang === 'kh' ? 'បោះពុម្ព ឬមើលវិក្កយបត្រ' : 'Print or View Receipt'}
                          className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition cursor-pointer"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsViewModalOpen(true);
                          }}
                          title={currentT.viewReceipt}
                          className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
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

      {/* Modal: Create Invoice */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="text-indigo-600" />
                {currentT.createTitle}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {currentT.selectBooking}
                </label>
                <select
                  required
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                >
                  <option value="">-- ជ្រើសរើសអ្នកជួល & បន្ទប់ --</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.tenant?.name || 'Tenant'} - បន្ទប់ {b.room?.room_number} ({b.room?.property?.title}) - ${b.room?.price}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {currentT.elecStartLabel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={elecStart}
                    onChange={(e) => setElecStart(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {currentT.elecEndLabel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={elecEnd}
                    onChange={(e) => setElecEnd(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {currentT.waterLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  value={waterUnits}
                  onChange={(e) => setWaterUnits(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {currentT.amountLabel}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {currentT.dueDateLabel}
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {currentT.statusLabel}
                </label>
                <select
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
                >
                  <option value="unpaid">មិនទាន់បង់ (Unpaid)</option>
                  <option value="paid">បានបង់រួចរាល់ (Paid)</option>
                  <option value="partial">បង់មួយផ្នែក (Partial)</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * {currentT.autoCalcHint}
              </p>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50"
                >
                  {currentT.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-md shadow-indigo-600/30"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{currentT.saveBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Printable Receipt */}
      <ReceiptModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        invoice={selectedInvoice}
        lang={lang}
      />
    </div>
  );
}
