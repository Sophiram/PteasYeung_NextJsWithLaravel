'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    CreditCard, DollarSign, Clock, CheckCircle2, AlertCircle, 
    Search, Filter, Calendar, Building2, User, ArrowUpRight, 
    FileText, Download, Check, Plus, Trash2, Edit3, Printer,
    RefreshCw, X, ShieldCheck, Sparkles, ChevronRight, Phone, Mail
} from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import ConfirmModal from '@/app/components/ConfirmModal';
import ReceiptModal, { ReceiptInvoice } from '@/app/components/ReceiptModal';
import toast, { Toaster } from 'react-hot-toast';

interface OwnerUser {
    id: number;
    name: string;
    email: string;
    phone?: string;
    status?: string;
    properties_count?: number;
    profile_picture?: string;
}

interface OwnerPaymentItem {
    id: number;
    owner_id: number;
    property_id?: number;
    invoice_number: string;
    title: string;
    plan_type: string;
    amount: number | string;
    payment_status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    payment_method?: string;
    payment_proof_url?: string;
    due_date?: string;
    paid_at?: string;
    notes?: string;
    created_at: string;
    owner?: OwnerUser;
    property?: {
        id: number;
        title: string;
        address?: string;
    };
}

interface PaymentSummary {
    total_collected: number;
    pending_amount: number;
    overdue_amount: number;
    paid_count: number;
    pending_count: number;
    total_owners: number;
}

export default function AdminPaymentsPage() {
    const { language } = useLanguage();
    const isKh = language === 'kh';

    const [payments, setPayments] = useState<OwnerPaymentItem[]>([]);
    const [owners, setOwners] = useState<OwnerUser[]>([]);
    const [summary, setSummary] = useState<PaymentSummary>({
        total_collected: 0,
        pending_amount: 0,
        overdue_amount: 0,
        paid_count: 0,
        pending_count: 0,
        total_owners: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
    const [formOwnerId, setFormOwnerId] = useState('');
    const [formTitle, setFormTitle] = useState('ថ្លៃសេវាប្រព័ន្ធប្រចាំខែ (Monthly Platform Subscription)');
    const [formPlanType, setFormPlanType] = useState('subscription');
    const [formAmount, setFormAmount] = useState('45.00');
    const [formDueDate, setFormDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
    const [formMethod, setFormMethod] = useState('ABA Bank');
    const [formNotes, setFormNotes] = useState('');

    // Collect / Confirm Modal
    const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<OwnerPaymentItem | null>(null);
    const [isCollecting, setIsCollecting] = useState(false);
    const [collectMethod, setCollectMethod] = useState('ABA Bank');
    const [collectNotes, setCollectNotes] = useState('');

    // Delete Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<OwnerPaymentItem | null>(null);

    // Receipt Modal
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptInvoiceData, setReceiptInvoiceData] = useState<ReceiptInvoice | null>(null);

    const fetchPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/admin/payments', {
                params: {
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    search: searchTerm || undefined,
                }
            });
            if (res.data?.success) {
                setPayments(res.data.payments || []);
                setSummary(res.data.summary || {
                    total_collected: 0,
                    pending_amount: 0,
                    overdue_amount: 0,
                    paid_count: 0,
                    pending_count: 0,
                    total_owners: 0,
                });
                setOwners(res.data.owners || []);
                if (res.data.owners?.length > 0 && !formOwnerId) {
                    setFormOwnerId(String(res.data.owners[0].id));
                }
            }
        } catch (err) {
            console.error('Error fetching payments:', err);
            setError(isKh ? 'មិនអាចទាញយកទិន្នន័យការទូទាត់បានទេ!' : 'Failed to load owner payments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [statusFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPayments();
    };

    // Quick plan preset select
    const handlePlanTypeChange = (plan: string) => {
        setFormPlanType(plan);
        if (plan === 'subscription') {
            setFormTitle('ថ្លៃសេវាប្រព័ន្ធប្រចាំខែ (Monthly Platform Subscription)');
            setFormAmount('45.00');
        } else if (plan === 'listing_fee') {
            setFormTitle('ថ្លៃចុះបញ្ជីអចលនទ្រព្យ (Property Listing & Verification Fee)');
            setFormAmount('20.00');
        } else if (plan === 'activation') {
            setFormTitle('ថ្លៃចុះឈ្មោះដំបូង & បើកគណនី (Account Activation Fee)');
            setFormAmount('30.00');
        } else {
            setFormTitle('');
            setFormAmount('');
        }
    };

    // Create Owner Invoice / Bill
    const handleCreateBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formOwnerId || !formAmount || !formTitle) {
            toast.error(isKh ? 'សូមបំពេញព័ត៌មានឱ្យបានគ្រប់ជ្រុងជ្រោយ!' : 'Please fill all required fields!');
            return;
        }

        setIsSubmittingAdd(true);
        try {
            const res = await api.post('/admin/payments', {
                owner_id: Number(formOwnerId),
                title: formTitle,
                plan_type: formPlanType,
                amount: Number(formAmount),
                due_date: formDueDate,
                payment_status: 'pending',
                payment_method: formMethod,
                notes: formNotes || null,
            });

            if (res.data?.success) {
                toast.success(isKh ? 'បានបង្កើតវិក្កយបត្រម្ចាស់ផ្ទះជោគជ័យ!' : 'Owner invoice created successfully!');
                setIsAddModalOpen(false);
                fetchPayments();
            }
        } catch (err: any) {
            console.error('Error creating bill:', err);
            toast.error(err.response?.data?.message || (isKh ? 'បរាជ័យក្នុងការបង្កើតវិក្កយបត្រ' : 'Failed to create invoice'));
        } finally {
            setIsSubmittingAdd(false);
        }
    };

    // Open collect payment modal
    const openCollectModal = (payment: OwnerPaymentItem) => {
        setSelectedPayment(payment);
        setCollectMethod(payment.payment_method || 'ABA Bank');
        setCollectNotes(payment.notes || '');
        setIsCollectModalOpen(true);
    };

    // Confirm collect payment from Owner
    const handleConfirmCollect = async () => {
        if (!selectedPayment) return;
        setIsCollecting(true);
        try {
            const res = await api.post(`/admin/payments/collect/${selectedPayment.id}`, {
                payment_method: collectMethod,
                notes: collectNotes || null,
            });

            if (res.data?.success) {
                toast.success(isKh ? 'ការទូទាត់ត្រូវបានបញ្ជាក់ថាបានបង់រួចរាល់!' : 'Owner payment successfully marked as paid!');
                setIsCollectModalOpen(false);
                setSelectedPayment(null);
                fetchPayments();
            }
        } catch (err: any) {
            console.error('Error collecting payment:', err);
            toast.error(err.response?.data?.message || (isKh ? 'បរាជ័យក្នុងការកត់ត្រាការទូទាត់' : 'Failed to confirm payment'));
        } finally {
            setIsCollecting(false);
        }
    };

    // Delete Payment
    const handleDeleteClick = (payment: OwnerPaymentItem) => {
        setPaymentToDelete(payment);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!paymentToDelete) return;
        try {
            await api.delete(`/admin/payments/${paymentToDelete.id}`);
            toast.success(isKh ? 'បានលុបវិក្កយបត្រជោគជ័យ!' : 'Invoice deleted successfully!');
            setIsDeleteModalOpen(false);
            setPaymentToDelete(null);
            fetchPayments();
        } catch (err: any) {
            console.error('Error deleting payment:', err);
            toast.error(isKh ? 'មិនអាចលុបវិក្កយបត្របានទេ!' : 'Failed to delete invoice.');
        }
    };

    // Open Receipt Modal
    const handleOpenReceipt = (payment: OwnerPaymentItem) => {
        const adaptedInvoice: ReceiptInvoice = {
            id: payment.id,
            invoice_number: payment.invoice_number,
            total_amount: payment.amount,
            payment_status: payment.payment_status === 'paid' ? 'paid' : 'unpaid',
            due_date: payment.due_date,
            paid_at: payment.paid_at,
            created_at: payment.created_at,
            booking: {
                id: payment.id,
                tenant: {
                    id: payment.owner?.id || 0,
                    name: payment.owner?.name || 'Property Owner',
                    email: payment.owner?.email || '',
                    phone: payment.owner?.phone || '',
                },
                room: {
                    room_number: payment.title,
                    price: payment.amount,
                    property: {
                        id: payment.property?.id || 0,
                        title: payment.property?.title || 'Pteas Yeung Platform Service',
                        address: payment.property?.address || 'Phnom Penh, Cambodia',
                    }
                }
            }
        };
        setReceiptInvoiceData(adaptedInvoice);
        setIsReceiptModalOpen(true);
    };

    // Filter payments in-memory if needed
    const filteredPayments = useMemo(() => {
        if (!searchTerm) return payments;
        const q = searchTerm.toLowerCase();
        return payments.filter(p => 
            p.invoice_number?.toLowerCase().includes(q) ||
            p.title?.toLowerCase().includes(q) ||
            p.owner?.name?.toLowerCase().includes(q) ||
            p.owner?.email?.toLowerCase().includes(q) ||
            p.owner?.phone?.toLowerCase().includes(q)
        );
    }, [payments, searchTerm]);

    return (
        <div className="space-y-6 w-full max-w-full text-slate-800 dark:text-slate-200 antialiased">
            <Toaster position="top-right" />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                {isKh ? 'គ្រប់គ្រងការទូទាត់ប្រាក់ពីម្ចាស់ផ្ទះ' : 'Owner Payments & Subscriptions'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                                {isKh ? 'តាមដានថ្លៃសេវាប្រព័ន្ធ គម្រោងជាវ និងប្រវត្តិទូទាត់របស់ម្ចាស់អចលនទ្រព្យ' : 'Track platform fees, subscriptions, and payment history from property owners'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                        onClick={fetchPayments}
                        className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isKh ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
                    </button>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition text-xs shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{isKh ? 'បង្កើតវិក្កយបត្រម្ចាស់ផ្ទះ' : 'Create Owner Invoice'}</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Collected */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            {isKh ? 'ចំណូលបានទទួលពីម្ចាស់ផ្ទះ' : 'Collected from Owners'}
                        </span>
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            ${Number(summary.total_collected).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {isKh ? `បានទូទាត់ ${summary.paid_count} វិក្កយបត្រ` : `${summary.paid_count} paid invoices`}
                    </p>
                </div>

                {/* Pending Amount */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            {isKh ? 'រង់ចាំការទូទាត់ (Pending)' : 'Pending Collections'}
                        </span>
                        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            ${Number(summary.pending_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {isKh ? `កំពុងរង់ចាំ ${summary.pending_count} វិក្កយបត្រ` : `${summary.pending_count} pending invoices`}
                    </p>
                </div>

                {/* Overdue Amount */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            {isKh ? 'ហួសកាលកំណត់ (Overdue)' : 'Overdue Amount'}
                        </span>
                        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            ${Number(summary.overdue_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {isKh ? 'ត្រូវរំលឹកម្ចាស់ផ្ទះ' : 'Action needed'}
                    </p>
                </div>

                {/* Registered Owners */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            {isKh ? 'ម្ចាស់ផ្ទះក្នុងប្រព័ន្ធ' : 'Registered Landlords'}
                        </span>
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                            <Building2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {owners.length}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{isKh ? 'ម្ចាស់' : 'Owners'}</span>
                    </div>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {isKh ? 'គណនីម្ចាស់អចលនទ្រព្យ' : 'Active platform clients'}
                    </p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl overflow-x-auto">
                    {(['all', 'paid', 'pending', 'overdue'] as const).map((st) => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition whitespace-nowrap ${
                                statusFilter === st
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            {st === 'all' && (isKh ? 'ទាំងអស់' : 'All')}
                            {st === 'paid' && (isKh ? 'បានបង់ (Paid)' : 'Paid')}
                            {st === 'pending' && (isKh ? 'រង់ចាំ (Pending)' : 'Pending')}
                            {st === 'overdue' && (isKh ? 'ហួសកំណត់ (Overdue)' : 'Overdue')}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={isKh ? 'ស្វែងរកតាមឈ្មោះម្ចាស់ផ្ទះ, អ៊ីមែល, លេខទូរស័ព្ទ, លេខវិក្កយបត្រ...' : 'Search by landlord name, email, phone, invoice #...'}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                    />
                </form>
            </div>

            {/* Invoices / Payments Table */}
            <div className="w-full overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
                <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-5 py-3.5">{isKh ? 'លេខវិក្កយបត្រ' : 'Invoice #'}</th>
                            <th className="px-5 py-3.5">{isKh ? 'ម្ចាស់ផ្ទះ (Landlord)' : 'Property Owner'}</th>
                            <th className="px-5 py-3.5">{isKh ? 'ប្រភេទសេវា / បរិយាយ' : 'Plan / Description'}</th>
                            <th className="px-5 py-3.5">{isKh ? 'ទឹកប្រាក់ ($)' : 'Amount ($)'}</th>
                            <th className="px-5 py-3.5">{isKh ? 'កាលបរិច្ឆេទកំណត់' : 'Due Date'}</th>
                            <th className="px-5 py-3.5">{isKh ? 'វិធីសាស្ត្រ' : 'Method'}</th>
                            <th className="px-5 py-3.5">{isKh ? 'ស្ថានភាព' : 'Status'}</th>
                            <th className="px-5 py-3.5 text-right">{isKh ? 'សកម្មភាព' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="text-center py-16">
                                    <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-rose-600 rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-xs text-slate-400">{isKh ? 'កំពុងផ្ទុកទិន្នន័យ...' : 'Loading payments...'}</p>
                                </td>
                            </tr>
                        ) : filteredPayments.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-16 text-slate-400">
                                    <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm font-semibold">{isKh ? 'មិនមានទិន្នន័យការទូទាត់នៅឡើយទេ' : 'No owner payments found'}</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {isKh ? 'អ្នកអាចបង្កើតវិក្កយបត្រថ្មីសម្រាប់ម្ចាស់ផ្ទះបានគ្រប់ពេល' : 'You can create a new invoice for any property owner'}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            filteredPayments.map((payment) => {
                                const isPaid = payment.payment_status === 'paid';
                                const isOverdue = !isPaid && payment.due_date && new Date(payment.due_date) < new Date();

                                return (
                                    <tr key={payment.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                        {/* Invoice Number */}
                                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{payment.invoice_number}</span>
                                            </div>
                                        </td>

                                        {/* Owner Info */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                                    {payment.owner?.name ? payment.owner.name.charAt(0).toUpperCase() : 'O'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white truncate">
                                                        {payment.owner?.name || 'N/A'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 truncate">
                                                        {payment.owner?.phone || payment.owner?.email || ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Plan & Title */}
                                        <td className="px-5 py-3.5">
                                            <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                                                {payment.title}
                                            </p>
                                            {payment.property && (
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Building2 className="w-3 h-3" />
                                                    {payment.property.title}
                                                </span>
                                            )}
                                        </td>

                                        {/* Amount */}
                                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                                            ${Number(payment.amount).toFixed(2)}
                                        </td>

                                        {/* Due Date */}
                                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                                            {payment.due_date ? new Date(payment.due_date).toLocaleDateString(isKh ? 'km-KH' : 'en-US') : 'N/A'}
                                        </td>

                                        {/* Payment Method */}
                                        <td className="px-5 py-3.5">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                                {payment.payment_method || 'ABA Bank'}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5">
                                            {isPaid ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                                                    <CheckCircle2 className="w-3 h-3" /> {isKh ? 'បានបង់' : 'Paid'}
                                                </span>
                                            ) : isOverdue ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                                                    <AlertCircle className="w-3 h-3" /> {isKh ? 'ហួសកំណត់' : 'Overdue'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                                                    <Clock className="w-3 h-3" /> {isKh ? 'រង់ចាំ' : 'Pending'}
                                                </span>
                                            )}
                                        </td>

                                        {/* Action Buttons */}
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {!isPaid && (
                                                    <button
                                                        onClick={() => openCollectModal(payment)}
                                                        title={isKh ? 'បញ្ជាក់ការទទួលប្រាក់' : 'Collect / Confirm Payment'}
                                                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        <span className="hidden sm:inline">{isKh ? 'ទទួលប្រាក់' : 'Collect'}</span>
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleOpenReceipt(payment)}
                                                    title={isKh ? 'មើល / បោះពុម្ពបង្កាន់ដៃ' : 'Print / View Receipt'}
                                                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteClick(payment)}
                                                    title={isKh ? 'លុប' : 'Delete'}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Owner Invoice Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl transition-all">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                    {isKh ? 'បង្កើតវិក្កយបត្រថ្មីសម្រាប់ម្ចាស់ផ្ទះ' : 'Create Owner Invoice'}
                                </h3>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateBill} className="p-6 space-y-4">
                            {/* Select Owner */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ជ្រើសរើសម្ចាស់ផ្ទះ (Property Owner) *' : 'Select Property Owner *'}
                                </label>
                                <select
                                    value={formOwnerId}
                                    onChange={(e) => setFormOwnerId(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                >
                                    {owners.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.name} ({o.email}) - {o.phone || 'No phone'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Plan Preset */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ប្រភេទគម្រោង / ថ្លៃសេវា' : 'Fee Type Preset'}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'subscription', label: isKh ? 'សេវាប្រចាំខែ' : 'Monthly Sub', amount: '$45' },
                                        { id: 'listing_fee', label: isKh ? 'ចុះបញ្ជីផ្ទះ' : 'Listing Fee', amount: '$20' },
                                        { id: 'activation', label: isKh ? 'បើកគណនី' : 'Activation', amount: '$30' },
                                    ].map((plan) => (
                                        <button
                                            type="button"
                                            key={plan.id}
                                            onClick={() => handlePlanTypeChange(plan.id)}
                                            className={`p-2 rounded-xl text-xs font-medium border text-center transition ${
                                                formPlanType === plan.id
                                                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                                                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div>{plan.label}</div>
                                            <div className="text-[10px] opacity-70 mt-0.5">{plan.amount}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'បរិយាយវិក្កយបត្រ / Title *' : 'Invoice Title *'}
                                </label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    required
                                    placeholder="e.g. ថ្លៃសេវាប្រព័ន្ធប្រចាំខែ (Monthly Platform Subscription)"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                />
                            </div>

                            {/* Amount & Due Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        {isKh ? 'ទឹកប្រាក់ ($) *' : 'Amount ($) *'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formAmount}
                                        onChange={(e) => setFormAmount(e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        {isKh ? 'កាលបរិច្ឆេទកំណត់បង់ *' : 'Due Date *'}
                                    </label>
                                    <input
                                        type="date"
                                        value={formDueDate}
                                        onChange={(e) => setFormDueDate(e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                    />
                                </div>
                            </div>

                            {/* Method & Notes */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'វិធីសាស្ត្រទូទាត់ដែលណែនាំ' : 'Payment Method'}
                                </label>
                                <select
                                    value={formMethod}
                                    onChange={(e) => setFormMethod(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                >
                                    <option value="ABA Bank">ABA Bank (KHQR)</option>
                                    <option value="Wing">Wing Bank</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cash">Cash (សាច់ប្រាក់សុទ្ធ)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'ចំណាំផ្សេងៗ (Notes)' : 'Notes (Optional)'}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    placeholder={isKh ? 'ចំណាំបន្ថែមលើវិក្កយបត្រនេះ...' : 'Any optional remarks or notes...'}
                                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                >
                                    {isKh ? 'បោះបង់' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingAdd}
                                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmittingAdd && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    <span>{isKh ? 'ចេញវិក្កយបត្រ' : 'Issue Invoice'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Collect / Confirm Payment Modal */}
            {isCollectModalOpen && selectedPayment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transition-all">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                    {isKh ? 'បញ្ជាក់ការទទួលប្រាក់ពីម្ចាស់ផ្ទះ' : 'Confirm Payment Collection'}
                                </h3>
                            </div>
                            <button onClick={() => setIsCollectModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">{isKh ? 'លេខវិក្កយបត្រ:' : 'Invoice #:'}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPayment.invoice_number}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">{isKh ? 'ម្ចាស់ផ្ទះ:' : 'Landlord:'}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPayment.owner?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">{isKh ? 'សេវា / បរិយាយ:' : 'Plan:'}</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPayment.title}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-emerald-100 dark:border-emerald-900/40">
                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{isKh ? 'ទឹកប្រាក់ត្រូវទទួល:' : 'Total Due:'}</span>
                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                        ${Number(selectedPayment.amount).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'វិធីសាស្ត្រដែលបានទទួល' : 'Payment Received Via'}
                                </label>
                                <select
                                    value={collectMethod}
                                    onChange={(e) => setCollectMethod(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                >
                                    <option value="ABA Bank">ABA Bank (KHQR)</option>
                                    <option value="Wing">Wing Bank</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cash">Cash (សាច់ប្រាក់សុទ្ធ)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {isKh ? 'កំណត់សម្គាល់ការទូទាត់' : 'Payment Remarks'}
                                </label>
                                <input
                                    type="text"
                                    value={collectNotes}
                                    onChange={(e) => setCollectNotes(e.target.value)}
                                    placeholder={isKh ? 'លេខយោងប្រតិបត្តិការ (Txn Ref / Screenshot)...' : 'Transaction ref or remarks...'}
                                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>

                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                {isKh 
                                    ? 'ការចុចបញ្ជាក់នេះនឹងកត់ត្រាការទូទាត់ជា Paid និងផ្ញើសារជូនដំណឹងទៅម្ចាស់ផ្ទះភ្លាមៗ។ ប្រសិនបើគណនីម្ចាស់ផ្ទះកំពុង Pending វានឹងត្រូវដំណើរការ (Active) ដោយស្វ័យប្រវត្តិ។' 
                                    : 'Confirming this payment will mark it as paid, notify the owner, and auto-activate their landlord account if pending.'}
                            </p>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsCollectModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition"
                                >
                                    {isKh ? 'បោះបង់' : 'Cancel'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmCollect}
                                    disabled={isCollecting}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isCollecting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    <span>{isKh ? 'បញ្ជាក់ការបង់ប្រាក់' : 'Confirm Paid'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onCancel={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={isKh ? 'បញ្ជាក់ការលុបវិក្កយបត្រ' : 'Confirm Delete Invoice'}
                message={isKh ? `តើលោកអ្នកពិតជាចង់លុបវិក្កយបត្រ #${paymentToDelete?.invoice_number} នេះមែនទេ?` : `Are you sure you want to delete invoice #${paymentToDelete?.invoice_number}?`}
                confirmText={isKh ? 'លុបចេញ' : 'Delete'}
                cancelText={isKh ? 'បោះបង់' : 'Cancel'}
                type="danger"
            />

            {/* Official Receipt Modal */}
            <ReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => {
                    setIsReceiptModalOpen(false);
                    setReceiptInvoiceData(null);
                }}
                invoice={receiptInvoiceData}
                lang={isKh ? 'kh' : 'en'}
            />
        </div>
    );
}

