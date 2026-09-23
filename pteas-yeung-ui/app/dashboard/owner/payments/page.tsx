'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { 
  CreditCard, Calendar, CheckCircle2, Clock, AlertCircle, 
  DollarSign, Search, Filter, Download, Printer, RefreshCw, 
  Building2, DoorOpen, User, Phone, Send, ChevronLeft, ChevronRight,
  FilePlus, ArrowUpRight, Zap, Droplets, Check, AlertTriangle, Sparkles,
  Percent, Copy, ExternalLink, X, Loader2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import ReceiptModal, { ReceiptInvoice } from '@/app/components/ReceiptModal';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';
import Link from 'next/link';

interface PropertyOption {
  id: number;
  title: string;
  address?: string;
  city?: string;
}

interface TrackerItem {
  booking_id: number;
  booking_status: string;
  check_in_date: string;
  room: {
    id: number | null;
    room_number: string;
    price: number;
    type: string;
  };
  property: {
    id: number | null;
    title: string;
    address: string;
  };
  tenant: {
    id: number | null;
    name: string;
    phone: string;
    email: string;
    profile_picture: string | null;
  };
  month: string;
  invoice_id: number | null;
  invoice: ReceiptInvoice | null;
  payment_status: 'paid' | 'unpaid' | 'not_billed' | 'partial';
  total_amount: number;
  due_date: string | null;
  is_overdue: boolean;
  electricity_usage: number;
  water_unit: number;
}

interface SummaryData {
  total_occupied_rooms: number;
  paid_count: number;
  unpaid_count: number;
  not_billed_count: number;
  total_expected: number;
  total_collected: number;
  total_unpaid: number;
  collection_rate: number;
}

export default function OwnerPaymentsTrackerPage() {
  const [lang, setLang] = useState<'kh' | 'en'>('kh');
  const isKh = lang === 'kh';

  // Current selected month: YYYY-MM
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'not_billed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [items, setItems] = useState<TrackerItem[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    total_occupied_rooms: 0,
    paid_count: 0,
    unpaid_count: 0,
    not_billed_count: 0,
    total_expected: 0,
    total_collected: 0,
    total_unpaid: 0,
    collection_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [remindingId, setRemindingId] = useState<number | null>(null);

  // Quick Bill Generator Modal
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billingItem, setBillingItem] = useState<TrackerItem | null>(null);
  const [elecStart, setElecStart] = useState<number | ''>(0);
  const [elecEnd, setElecEnd] = useState<number | ''>(0);
  const [waterUnits, setWaterUnits] = useState<number | ''>(0);
  const [customRent, setCustomRent] = useState<number | ''>(0);
  const [billDueDate, setBillDueDate] = useState('');
  const [submittingBill, setSubmittingBill] = useState(false);

  // Mark Paid Confirmation Modal
  const [markingPaidItem, setMarkingPaidItem] = useState<TrackerItem | null>(null);
  const [submittingPaid, setSubmittingPaid] = useState(false);

  // Receipt Modal
  const [receiptInvoice, setReceiptInvoice] = useState<ReceiptInvoice | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Utility rates ($)
  const ELEC_RATE = 0.25;
  const WATER_RATE = 0.60;

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
    if (savedLang) setLang(savedLang);
  }, []);

  const fetchTrackerData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/owner/monthly-tracker', {
        params: {
          month: selectedMonth,
          property_id: selectedPropertyId !== 'all' ? selectedPropertyId : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });

      if (res.data?.success) {
        setItems(res.data.items || []);
        setSummary(res.data.summary || {
          total_occupied_rooms: 0,
          paid_count: 0,
          unpaid_count: 0,
          not_billed_count: 0,
          total_expected: 0,
          total_collected: 0,
          total_unpaid: 0,
          collection_rate: 0,
        });
        if (res.data.properties) {
          setProperties(res.data.properties);
        }
      }
    } catch (err) {
      console.error('Error fetching monthly tracker:', err);
      toast.error(isKh ? 'មិនអាចទាញយកទិន្នន័យការបង់ប្រាក់បានទេ!' : 'Failed to load monthly payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
  }, [selectedMonth, selectedPropertyId, statusFilter]);

  // Navigate months
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(currentMonthStr);
  };

  // Format month for display
  const monthDisplay = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    const enName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const khMonths = [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ];
    const khName = `ខែ${khMonths[m - 1]} ឆ្នាំ${y}`;
    return isKh ? khName : enName;
  }, [selectedMonth, isKh]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => 
      item.room.room_number.toLowerCase().includes(q) ||
      item.tenant.name.toLowerCase().includes(q) ||
      item.tenant.phone.toLowerCase().includes(q) ||
      item.property.title.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const exportUrl = `${baseUrl}/owner/monthly-tracker/export?month=${selectedMonth}${selectedPropertyId !== 'all' ? `&property_id=${selectedPropertyId}` : ''}`;

    window.open(exportUrl, '_blank');
    toast.success(isKh ? 'កំពុងទាញយកឯកសាររបាយការណ៍ CSV...' : 'Exporting CSV report...');
  };

  // Send Reminder
  const handleSendReminder = async (item: TrackerItem) => {
    if (!item.invoice_id) {
      toast.error(isKh ? 'បន្ទប់នេះមិនទាន់មានវិក្កយបត្រដើម្បីរំលឹកទេ!' : 'No invoice exists to remind for this room.');
      return;
    }

    setRemindingId(item.invoice_id);
    try {
      const res = await api.post(`/owner/monthly-tracker/remind/${item.invoice_id}`);
      if (res.data?.success) {
        toast.success(isKh ? `បានផ្ញើសាររំលឹកទៅកាន់ ${item.tenant.name} រួចរាល់!` : `Reminder sent to ${item.tenant.name}!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || (isKh ? 'បរាជ័យក្នុងការផ្ញើសាររំលឹក!' : 'Failed to send reminder.'));
    } finally {
      setRemindingId(null);
    }
  };

  // Open Quick Bill Modal
  const handleOpenBillModal = (item: TrackerItem) => {
    setBillingItem(item);
    setCustomRent(item.room.price || 0);
    setElecStart(0);
    setElecEnd(0);
    setWaterUnits(0);

    // Default due date: last day of selected month
    const [y, m] = selectedMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    setBillDueDate(`${selectedMonth}-${String(lastDay).padStart(2, '0')}`);

    setIsBillModalOpen(true);
  };

  // Calculate bill modal total
  const calculatedBillTotal = useMemo(() => {
    const rent = Number(customRent) || 0;
    const start = Number(elecStart) || 0;
    const end = Number(elecEnd) || 0;
    const elecDiff = Math.max(0, end - start);
    const elecCost = elecDiff * ELEC_RATE;
    const waterCost = (Number(waterUnits) || 0) * WATER_RATE;
    return Number((rent + elecCost + waterCost).toFixed(2));
  }, [customRent, elecStart, elecEnd, waterUnits]);

  // Submit Quick Bill
  const handleSubmitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingItem) return;

    if (!billDueDate) {
      toast.error(isKh ? 'សូមជ្រើសរើសថ្ងៃផុតកំណត់បង់ប្រាក់!' : 'Please set a due date!');
      return;
    }

    setSubmittingBill(true);
    try {
      const res = await api.post('/owner/invoices', {
        booking_id: billingItem.booking_id,
        electricity_start_unit: Number(elecStart) || 0,
        electricity_end_unit: Number(elecEnd) || 0,
        water_unit: Number(waterUnits) || 0,
        total_amount: calculatedBillTotal,
        payment_status: 'unpaid',
        due_date: billDueDate,
      });

      if (res.data?.success) {
        toast.success(isKh ? `បានបង្កើតវិក្កយបត្រសម្រាប់បន្ទប់ ${billingItem.room.room_number} ជោគជ័យ!` : `Invoice generated for Room ${billingItem.room.room_number}!`);
        setIsBillModalOpen(false);
        setBillingItem(null);
        await fetchTrackerData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || (isKh ? 'បរាជ័យក្នុងការបង្កើតវិក្កយបត្រ!' : 'Failed to generate bill.'));
    } finally {
      setSubmittingBill(false);
    }
  };

  // Open Mark as Paid confirmation
  const handleOpenMarkPaid = (item: TrackerItem) => {
    setMarkingPaidItem(item);
  };

  // Confirm Mark Paid
  const handleConfirmMarkPaid = async () => {
    if (!markingPaidItem || !markingPaidItem.invoice_id) return;

    setSubmittingPaid(true);
    try {
      const res = await api.put(`/owner/invoices/${markingPaidItem.invoice_id}`, {
        payment_status: 'paid',
      });

      if (res.data?.success) {
        toast.success(isKh ? `បានកត់ត្រាការបង់ប្រាក់បន្ទប់ ${markingPaidItem.room.room_number} រួចរាល់!` : `Marked Room ${markingPaidItem.room.room_number} as paid!`);
        setMarkingPaidItem(null);
        await fetchTrackerData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || (isKh ? 'បរាជ័យក្នុងការកត់ត្រាការបង់ប្រាក់!' : 'Failed to update payment status.'));
    } finally {
      setSubmittingPaid(false);
    }
  };

  // Open Receipt
  const handleOpenReceipt = (item: TrackerItem) => {
    if (!item.invoice) {
      const fallback: ReceiptInvoice = {
        id: item.invoice_id || item.booking_id,
        booking_id: item.booking_id,
        total_amount: item.total_amount,
        payment_status: item.payment_status as any,
        due_date: item.due_date || undefined,
        water_unit: item.water_unit,
        electricity_start_unit: 0,
        electricity_end_unit: item.electricity_usage,
        booking: {
          id: item.booking_id,
          room: {
            room_number: item.room.room_number,
            price: item.room.price,
            type: item.room.type,
            property: {
              title: item.property.title,
              address: item.property.address,
            }
          },
          tenant: {
            name: item.tenant.name,
            phone: item.tenant.phone,
            email: item.tenant.email,
          }
        }
      };
      setReceiptInvoice(fallback);
    } else {
      setReceiptInvoice(item.invoice);
    }
    setIsReceiptOpen(true);
  };

  // Print monthly summary
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              {isKh ? 'ប្រព័ន្ធតាមដានចំណូលជួល' : 'Rental Revenue Tracking'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            <span>{isKh ? 'តាមដានការបង់ប្រាក់ប្រចាំខែ' : 'Monthly Payment Tracker'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isKh 
              ? 'តាមដានស្ថានភាពអ្នកស្នាក់នៅបន្ទប់នីមួយៗ បានបង់ ឬមិនទាន់បង់ និងគ្រប់គ្រងវិក្កយបត្រប្រចាំខែ' 
              : 'Track room-by-room tenant payments, overdue accounts, and monthly rent collection progress.'}
          </p>
        </div>

        {/* Month Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Month Stepper */}
          <div className="inline-flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              title={isKh ? 'ខែមុន' : 'Previous Month'}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-center min-w-[140px]">
              <span className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200 tracking-tight">
                {monthDisplay}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              title={isKh ? 'ខែបន្ទាប់' : 'Next Month'}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Picker Quick Input */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
          />

          {/* Reset to current month */}
          {selectedMonth !== currentMonthStr && (
            <button
              onClick={handleCurrentMonth}
              className="px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
            >
              {isKh ? 'ខែបច្ចុប្បន្ន' : 'This Month'}
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isKh ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>

          {/* Print Report */}
          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isKh ? 'បោះពុម្ព' : 'Print'}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchTrackerData}
            title={isKh ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Occupied Rooms */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isKh ? 'បន្ទប់មានអ្នកជួល' : 'Occupied Rooms'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <DoorOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {summary.total_occupied_rooms}
            </h2>
            <span className="text-xs text-slate-400">{isKh ? 'បន្ទប់' : 'rooms'}</span>
          </div>
          <div className="flex items-center gap-3 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-emerald-600 font-bold">{summary.paid_count} {isKh ? 'បានបង់' : 'paid'}</span>
            <span className="text-amber-500 font-bold">{summary.unpaid_count} {isKh ? 'ជំពាក់' : 'unpaid'}</span>
            <span className="text-slate-400 font-medium">{summary.not_billed_count} {isKh ? 'មិនទាន់ចេញវិក្កយបត្រ' : 'no bill'}</span>
          </div>
        </div>

        {/* 2. Total Expected Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isKh ? 'ចំណូលរំពឹងទុក' : 'Expected Revenue'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              ${summary.total_expected.toFixed(2)}
            </h2>
          </div>
          <p className="text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80 truncate">
            {isKh ? `គិតត្រឹម ${monthDisplay}` : `For month ${selectedMonth}`}
          </p>
        </div>

        {/* 3. Collected Revenue & Collection Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isKh ? 'ប្រមូលបានជាក់ស្តែង' : 'Collected Revenue'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ${summary.total_collected.toFixed(2)}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {summary.collection_rate}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, summary.collection_rate))}%` }}
            />
          </div>
        </div>

        {/* 4. Unpaid / Outstanding Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isKh ? 'ប្រាក់នៅជំពាក់' : 'Outstanding Balance'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              ${summary.total_unpaid.toFixed(2)}
            </h2>
          </div>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800/80">
            {summary.unpaid_count} {isKh ? 'បន្ទប់មិនទាន់បានបង់ប្រាក់' : 'rooms pending payment'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-2xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>{isKh ? 'ទាំងអស់' : 'All'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
              {summary.total_occupied_rooms}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>{isKh ? 'បានបង់រួច' : 'Paid'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700/60 text-white">
              {summary.paid_count}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'unpaid'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>{isKh ? 'មិនទាន់បង់' : 'Unpaid'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-700/60 text-white">
              {summary.unpaid_count}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('not_billed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'not_billed'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>{isKh ? 'មិនទាន់ចេញវិក្កយបត្រ' : 'Not Billed'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800/60 text-white">
              {summary.not_billed_count}
            </span>
          </button>
        </div>

        {/* Property Select & Search Input */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Property Dropdown */}
          <div className="relative min-w-[180px]">
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full appearance-none px-3.5 py-2 pr-8 text-xs font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">{isKh ? 'គ្រប់ផ្ទះជួលទាំងអស់' : 'All Properties'}</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isKh ? 'ស្វែងរកបន្ទប់, ឈ្មោះអ្នកជួល, លេខ...' : 'Search room, tenant, phone...'}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Roster & Tracker Table */}
      <div id="printable-monthly-report" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {isKh ? `បញ្ជីតាមដានបន្ទប់ស្នាក់នៅ (${filteredItems.length})` : `Room Roster & Payments (${filteredItems.length})`}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isKh ? `ទិន្នន័យប្រចាំ ${monthDisplay}` : `Data for ${monthDisplay}`}
            </p>
          </div>

          <Link
            href="/dashboard/owner/invoices"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>{isKh ? 'ទៅកាន់បញ្ជីវិក្កយបត្រទាំងអស់' : 'Go to All Invoices'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-xs font-semibold">{isKh ? 'កំពុងទាញយកទិន្នន័យ...' : 'Loading monthly tracker...'}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <DoorOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isKh ? 'មិនមានទិន្នន័យបន្ទប់ស្នាក់នៅត្រូវបង្ហាញទេ' : 'No occupied rooms found matching criteria.'}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {isKh 
                ? 'សូមពិនិត្យមើលការជ្រើសរើសខែ ឬបញ្ជាក់ការកក់បន្ទប់ក្នុងប្រព័ន្ធដើម្បីបង្ហាញក្នុងបញ្ជីនេះ។'
                : 'Make sure you have approved active bookings for this period or change your filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3.5 px-4">{isKh ? 'បន្ទប់ & ទីតាំង' : 'Room & Property'}</th>
                  <th className="py-3.5 px-4">{isKh ? 'អ្នកជួល' : 'Tenant'}</th>
                  <th className="py-3.5 px-4">{isKh ? 'ថ្លៃជួល & ទឹកភ្លើង' : 'Rent & Utilities'}</th>
                  <th className="py-3.5 px-4">{isKh ? 'ទឹកប្រាក់សរុប' : 'Total Amount'}</th>
                  <th className="py-3.5 px-4">{isKh ? 'កាលបរិច្ឆេទ & ស្ថានភាព' : 'Due Date & Status'}</th>
                  <th className="py-3.5 px-4 text-right">{isKh ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredItems.map((item) => {
                  const hasInvoice = !!item.invoice_id;
                  const isPaid = item.payment_status === 'paid';
                  const isUnpaid = item.payment_status === 'unpaid';
                  const isNotBilled = item.payment_status === 'not_billed';

                  return (
                    <tr 
                      key={`${item.booking_id}-${item.room.id}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Room & Property */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-black text-sm flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 flex-shrink-0 shadow-xs">
                            {item.room.room_number}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {isKh ? `បន្ទប់ ${item.room.room_number}` : `Room ${item.room.room_number}`}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                                {item.room.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                              {item.property.title}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tenant */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            {item.tenant.profile_picture ? (
                              <img
                                src={getOptimizedImageUrl(item.tenant.profile_picture) || undefined}
                                alt={item.tenant.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              item.tenant.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                              {item.tenant.name}
                            </p>
                            {item.tenant.phone ? (
                              <a
                                href={`tel:${item.tenant.phone}`}
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-mono"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{item.tenant.phone}</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400">N/A</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rent & Utilities Breakdown */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span className="text-[11px] font-medium">{isKh ? 'បន្ទប់:' : 'Rent:'}</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-200">${item.room.price}</span>
                          </div>
                          {hasInvoice ? (
                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                              <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                                <Zap className="w-3 h-3" />
                                {item.electricity_usage} kWh
                              </span>
                              <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                                <Droplets className="w-3 h-3" />
                                {item.water_unit} m³
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              {isKh ? 'មិនទាន់គិតទឹកភ្លើង' : 'No utility readings'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4">
                        <div className="font-mono">
                          <div className="text-base font-black text-slate-900 dark:text-white">
                            ${item.total_amount.toFixed(2)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            ≈ {(item.total_amount * 4100).toLocaleString()} ៛
                          </div>
                        </div>
                      </td>

                      {/* Due Date & Status */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {/* Badge */}
                          {isPaid && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isKh ? 'បានបង់រួច' : 'Paid'}</span>
                            </span>
                          )}

                          {isUnpaid && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              item.is_overdue
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}>
                              {item.is_overdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              <span>{item.is_overdue ? (isKh ? 'ហួសកំណត់' : 'Overdue') : (isKh ? 'មិនទាន់បង់' : 'Unpaid')}</span>
                            </span>
                          )}

                          {isNotBilled && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                              <span>{isKh ? 'មិនទាន់ចេញវិក្កយបត្រ' : 'Not Billed'}</span>
                            </span>
                          )}

                          {/* Due Date */}
                          <div className="text-[11px] text-slate-400">
                            {item.due_date ? `${isKh ? 'ផុតកំណត់:' : 'Due:'} ${item.due_date}` : (isKh ? 'គ្មានកាលបរិច្ឆេទ' : 'No due date')}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* 1. If Not Billed: Quick Generate Bill */}
                          {isNotBilled && (
                            <button
                              onClick={() => handleOpenBillModal(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                            >
                              <FilePlus className="w-3.5 h-3.5" />
                              <span>{isKh ? 'ចេញវិក្កយបត្រ' : 'Create Bill'}</span>
                            </button>
                          )}

                          {/* 2. If Unpaid: Mark Paid + Send Reminder */}
                          {isUnpaid && (
                            <>
                              <button
                                onClick={() => handleOpenMarkPaid(item)}
                                title={isKh ? 'កត់ត្រាការបង់ប្រាក់' : 'Mark as Paid'}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isKh ? 'បង់រួច' : 'Mark Paid'}</span>
                              </button>

                              <button
                                onClick={() => handleSendReminder(item)}
                                disabled={remindingId === item.invoice_id}
                                title={isKh ? 'ផ្ញើសាររំលឹកទៅកាន់អ្នកជួល' : 'Send Reminder Notification'}
                                className="p-1.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition disabled:opacity-50"
                              >
                                {remindingId === item.invoice_id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                onClick={() => handleOpenReceipt(item)}
                                title={isKh ? 'មើលវិក្កយបត្រ' : 'View Invoice'}
                                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* 3. If Paid: View Receipt */}
                          {isPaid && (
                            <button
                              onClick={() => handleOpenReceipt(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>{isKh ? 'បង្កាន់ដៃ' : 'Receipt'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Bill Generator Modal */}
      {isBillModalOpen && billingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isKh ? 'ចេញវិក្កយបត្រថ្លៃបន្ទប់ប្រចាំខែ' : 'Generate Monthly Room Invoice'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isKh ? `បន្ទប់ #${billingItem.room.room_number} - ${billingItem.tenant.name}` : `Room #${billingItem.room.room_number} - ${billingItem.tenant.name}`}
                </p>
              </div>
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitBill} className="p-6 space-y-4">
              {/* Room Rent */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isKh ? 'ថ្លៃបន្ទប់ប្រចាំខែ ($)' : 'Base Room Rent ($)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={customRent}
                  onChange={(e) => setCustomRent(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Electricity Meter */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <div>
                  <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>{isKh ? 'នាឡិកាភ្លើងដើម (Start)' : 'Elec Start'}</span>
                  </label>
                  <input
                    type="number"
                    value={elecStart}
                    onChange={(e) => setElecStart(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 rounded-lg font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>{isKh ? 'នាឡិកាភ្លើងចុង (End)' : 'Elec End'}</span>
                  </label>
                  <input
                    type="number"
                    value={elecEnd}
                    onChange={(e) => setElecEnd(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 rounded-lg font-mono outline-none"
                  />
                </div>
                <div className="col-span-2 text-[11px] text-amber-700 dark:text-amber-400 flex justify-between font-medium">
                  <span>{isKh ? 'ប្រើប្រាស់:' : 'Usage:'} {Math.max(0, (Number(elecEnd) || 0) - (Number(elecStart) || 0))} kWh ($0.25/kWh)</span>
                  <span>${(Math.max(0, (Number(elecEnd) || 0) - (Number(elecStart) || 0)) * ELEC_RATE).toFixed(2)}</span>
                </div>
              </div>

              {/* Water Meter */}
              <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-[11px] font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    <span>{isKh ? 'ចំនួនកុងទ័រទឹកប្រើប្រាស់ (m³)' : 'Water Units (m³)'}</span>
                  </label>
                  <input
                    type="number"
                    value={waterUnits}
                    onChange={(e) => setWaterUnits(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-28 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/60 rounded-lg font-mono outline-none text-right"
                  />
                </div>
                <div className="text-[11px] text-blue-700 dark:text-blue-400 flex justify-between font-medium mt-1">
                  <span>Rate: $0.60/m³</span>
                  <span>${((Number(waterUnits) || 0) * WATER_RATE).toFixed(2)}</span>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isKh ? 'កាលបរិច្ឆេទផុតកំណត់បង់ (Due Date)' : 'Payment Due Date'}</span>
                </label>
                <input
                  type="date"
                  required
                  value={billDueDate}
                  onChange={(e) => setBillDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold outline-none"
                />
              </div>

              {/* Grand Total Preview */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">{isKh ? 'ទឹកប្រាក់សរុបត្រូវទូទាត់' : 'Total Invoice Amount'}</span>
                  <div className="text-[11px] text-indigo-300">
                    ≈ {(calculatedBillTotal * 4100).toLocaleString()} ៛
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  ${calculatedBillTotal.toFixed(2)}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {isKh ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingBill}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingBill && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isKh ? 'បង្កើតវិក្កយបត្រ' : 'Create Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark as Paid Confirmation Modal */}
      {markingPaidItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isKh ? 'បញ្ជាក់ការទទួលប្រាក់?' : 'Confirm Payment Receipt'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isKh 
                  ? `តើបងបានទទួលប្រាក់ចំនួន $${markingPaidItem.total_amount.toFixed(2)} ពី ${markingPaidItem.tenant.name} (បន្ទប់ ${markingPaidItem.room.room_number}) រួចរាល់ហើយមែនទេ?`
                  : `Have you received payment of $${markingPaidItem.total_amount.toFixed(2)} from ${markingPaidItem.tenant.name} for Room ${markingPaidItem.room.room_number}?`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMarkingPaidItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isKh ? 'មិនទាន់ទេ' : 'Not yet'}
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkPaid}
                disabled={submittingPaid}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {submittingPaid && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isKh ? 'យល់ព្រម, បានទទួល' : 'Yes, Confirm Paid'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Receipt / Invoice View & Isolated Print Modal */}
      {isReceiptOpen && receiptInvoice && (
        <ReceiptModal
          invoice={receiptInvoice}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          lang={lang}
        />
      )}
    </div>
  );
}

