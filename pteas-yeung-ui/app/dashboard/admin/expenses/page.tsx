'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    DollarSign, Plus, Trash2, Edit3, Search, Calendar, 
    Building2, RefreshCw, AlertCircle, TrendingDown, X, Loader2
} from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import ConfirmModal from '@/app/components/ConfirmModal';
import toast, { Toaster } from 'react-hot-toast';

interface ExpenseItem {
    id: number;
    title: string;
    amount: number | string;
    date: string;
    description?: string;
    property_id?: number;
    owner_id?: number;
    property?: {
        id: number;
        title: string;
    };
    owner?: {
        id: number;
        name: string;
        email: string;
    };
}

interface PropertyOption {
    id: number;
    title: string;
}

export default function AdminExpensesPage() {
    const { language } = useLanguage();
    const isKh = language === 'kh';

    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [properties, setProperties] = useState<PropertyOption[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all');

    // Add / Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formTitle, setFormTitle] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formPropertyId, setFormPropertyId] = useState('');
    const [formDescription, setFormDescription] = useState('');

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [expRes, propRes] = await Promise.all([
                api.get('/admin/expenses'),
                api.get('/admin/properties')
            ]);
            setExpenses(Array.isArray(expRes.data) ? expRes.data : expRes.data.data || []);
            setProperties(Array.isArray(propRes.data) ? propRes.data : propRes.data.data || []);
        } catch (err) {
            console.error("Error fetching expenses data:", err);
            setError(isKh ? "មិនអាចទាញយកទិន្នន័យការចំណាយបានទេ!" : "Failed to load expenses.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Summary calculations
    const summary = useMemo(() => {
        const total = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const thisMonthExpenses = expenses
            .filter(e => e.date && e.date.startsWith(thisMonth))
            .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const maxExpense = expenses.length > 0 ? Math.max(...expenses.map(e => Number(e.amount || 0))) : 0;

        return {
            total,
            thisMonth: thisMonthExpenses,
            count: expenses.length,
            max: maxExpense,
        };
    }, [expenses]);

    // Filtered expenses
    const filteredExpenses = useMemo(() => {
        return expenses.filter((exp) => {
            const matchesSearch = !searchTerm || 
                exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (exp.description && exp.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (exp.property?.title && exp.property.title.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesProperty = selectedPropertyFilter === 'all' || 
                (exp.property_id && String(exp.property_id) === selectedPropertyFilter);

            return matchesSearch && matchesProperty;
        });
    }, [expenses, searchTerm, selectedPropertyFilter]);

    // Open Modal for Add
    const openAddModal = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormTitle('');
        setFormAmount('');
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormPropertyId('');
        setFormDescription('');
        setIsModalOpen(true);
    };

    // Open Modal for Edit
    const openEditModal = (item: ExpenseItem) => {
        setIsEditing(true);
        setEditingId(item.id);
        setFormTitle(item.title);
        setFormAmount(String(item.amount));
        setFormDate(item.date ? item.date.substring(0, 10) : new Date().toISOString().split('T')[0]);
        setFormPropertyId(item.property_id ? String(item.property_id) : '');
        setFormDescription(item.description || '');
        setIsModalOpen(true);
    };

    // Handle Form Submit (Create or Update)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle || !formAmount || !formDate) {
            toast.error(isKh ? "សូមបំពេញព័ត៌មានចាំបាច់!" : "Please fill in required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: formTitle,
                amount: Number(formAmount),
                date: formDate,
                property_id: formPropertyId ? Number(formPropertyId) : null,
                description: formDescription || null,
            };

            if (isEditing && editingId) {
                await api.put(`/admin/expenses/${editingId}`, payload);
                toast.success(isKh ? "បានកែប្រែការចំណាយជោគជ័យ!" : "Expense updated successfully!");
            } else {
                await api.post('/admin/expenses', payload);
                toast.success(isKh ? "បានកត់ត្រាការចំណាយថ្មីជោគជ័យ!" : "Expense recorded successfully!");
            }

            setIsModalOpen(false);
            await fetchData();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || (isKh ? "បរាជ័យក្នុងការរក្សាទុក!" : "Failed to save expense."));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Delete
    const handleDeleteClick = (item: ExpenseItem) => {
        setExpenseToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!expenseToDelete) return;
        try {
            await api.delete(`/admin/expenses/${expenseToDelete.id}`);
            toast.success(isKh ? "បានលុបការចំណាយដោយជោគជ័យ!" : "Expense deleted successfully!");
            setExpenses(expenses.filter(e => e.id !== expenseToDelete.id));
        } catch (err) {
            console.error(err);
            toast.error(isKh ? "បរាជ័យក្នុងការលុប!" : "Failed to delete expense.");
        } finally {
            setIsDeleteModalOpen(false);
            setExpenseToDelete(null);
        }
    };

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            <Toaster position="top-right" reverseOrder={false} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {isKh ? 'គ្រប់គ្រងការចំណាយនានា' : 'Expense Management'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isKh ? 'កត់ត្រា និងគ្រប់គ្រងការចំណាយលើការថែទាំ ជួសជុល និងប្រតិបត្តិការ' : 'Record and manage operational, maintenance, and facility expenses'}
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={openAddModal}
                        className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition text-xs sm:text-sm flex items-center justify-center gap-2 flex-shrink-0 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{isKh ? 'បន្ថែមការចំណាយ' : 'Add Expense'}</span>
                    </button>
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isKh ? 'ចំណាយសរុបទាំងអស់' : 'Total System Expenses'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                        ${summary.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {summary.count} {isKh ? 'ប្រតិបត្តិការចំណាយ' : 'recorded transactions'}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isKh ? 'ចំណាយក្នុងខែនេះ' : 'This Month Expenses'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                        ${summary.thisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {isKh ? 'សម្រាប់ខែបច្ចុប្បន្ន' : 'Current month outlays'}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isKh ? 'ការចំណាយធំបំផុត' : 'Largest Single Expense'}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
                            <Building2 className="w-5 h-5" />
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                        ${summary.max.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {isKh ? 'ចំនួនទឹកប្រាក់ខ្ពស់បំផុត' : 'Highest individual record'}
                    </p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={isKh ? 'ស្វែងរកចំណងជើង/ការពិពណ៌នា...' : 'Search title or description...'}
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                    </div>

                    <select
                        value={selectedPropertyFilter}
                        onChange={(e) => setSelectedPropertyFilter(e.target.value)}
                        className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                        <option value="all">{isKh ? 'គ្រប់អចលនទ្រព្យ' : 'All Properties'}</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={fetchData}
                    className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition self-end sm:self-auto"
                    title={isKh ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Error state */}
            {error && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg w-full">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="font-medium text-rose-900 dark:text-rose-100 text-sm">{error}</p>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full shadow-sm">
                    <Loader2 className="w-9 h-9 text-rose-600 animate-spin mb-3" />
                    <p className="text-slate-500 text-sm">{isKh ? 'កំពុងផ្ទុកទិន្នន័យ...' : 'Loading expenses...'}</p>
                </div>
            )}

            {/* Empty state */}
            {!loading && filteredExpenses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full shadow-sm text-center">
                    <DollarSign className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        {isKh ? 'មិនមានទិន្នន័យការចំណាយឡើយ។' : 'No expenses recorded yet.'}
                    </p>
                </div>
            )}

            {/* Expenses Table (Desktop) */}
            {!loading && filteredExpenses.length > 0 && (
                <div className="hidden sm:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="px-6 py-3.5">ID</th>
                                    <th className="px-6 py-3.5">{isKh ? 'ចំណងជើង និងការពិពណ៌នា' : 'Title & Description'}</th>
                                    <th className="px-6 py-3.5">{isKh ? 'អចលនទ្រព្យ' : 'Property'}</th>
                                    <th className="px-6 py-3.5">{isKh ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                                    <th className="px-6 py-3.5">{isKh ? 'ចំនួនទឹកប្រាក់' : 'Amount'}</th>
                                    <th className="px-6 py-3.5 text-right">{isKh ? 'សកម្មភាព' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                {filteredExpenses.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/30 transition">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">#{item.id}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                                                {item.description && (
                                                    <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{item.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                <Building2 className="w-3.5 h-3.5 text-rose-500" />
                                                {item.property?.title || (isKh ? 'ទូទៅ' : 'General')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {item.date ? item.date.substring(0, 10) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-sm text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                            -${Number(item.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                                    title={isKh ? 'កែប្រែ' : 'Edit'}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(item)}
                                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                                    title={isKh ? 'លុប' : 'Delete'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Expenses Card View (Mobile) */}
            {!loading && filteredExpenses.length > 0 && (
                <div className="sm:hidden space-y-3">
                    {filteredExpenses.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{item.title}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">#{item.id} • {item.date ? item.date.substring(0, 10) : 'N/A'}</p>
                                </div>
                                <span className="font-mono font-bold text-base text-rose-600 dark:text-rose-400">
                                    -${Number(item.amount).toFixed(2)}
                                </span>
                            </div>

                            {item.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg">
                                    {item.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                <span className="text-slate-500">{item.property?.title || 'General'}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(item)}
                                        className="p-1.5 text-slate-600 hover:text-indigo-600"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(item)}
                                        className="p-1.5 text-rose-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                                {isEditing ? (isKh ? 'កែប្រែការចំណាយ' : 'Edit Expense') : (isKh ? 'កត់ត្រាការចំណាយថ្មី' : 'Add New Expense')}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isKh ? 'ចំណងជើងការចំណាយ *' : 'Expense Title *'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder={isKh ? 'ឧ. ជួសជុលម៉ាស៊ីនត្រជាក់បន្ទប់ ១០១' : 'e.g. AC Repair Room 101'}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isKh ? 'ចំនួនទឹកប្រាក់ ($) *' : 'Amount ($) *'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={formAmount}
                                        onChange={(e) => setFormAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isKh ? 'កាលបរិច្ឆេទ *' : 'Date *'}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formDate}
                                        onChange={(e) => setFormDate(e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isKh ? 'ជ្រើសរើសអចលនទ្រព្យ (ស្រេចចិត្ត)' : 'Select Property (Optional)'}
                                </label>
                                <select
                                    value={formPropertyId}
                                    onChange={(e) => setFormPropertyId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                >
                                    <option value="">{isKh ? '-- ជ្រើសរើសអចលនទ្រព្យ --' : '-- Select Property --'}</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isKh ? 'ការពិពណ៌នាបន្ថែម' : 'Description / Notes'}
                                </label>
                                <textarea
                                    rows={3}
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder={isKh ? 'ព័ត៌មានលម្អិតអំពីការចំណាយ...' : 'Additional notes regarding the expense...'}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                >
                                    {isKh ? 'បោះបង់' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>{isEditing ? (isKh ? 'រក្សាទុកការកែប្រែ' : 'Save Changes') : (isKh ? 'កត់ត្រាការចំណាយ' : 'Record Expense')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title={isKh ? "បញ្ជាក់ការលុបការចំណាយ" : "Confirm Delete Expense"}
                message={isKh 
                    ? `តើអ្នកពិតជាចង់លុបការចំណាយ "${expenseToDelete?.title}" ចំនួន $${Number(expenseToDelete?.amount || 0).toFixed(2)} នេះមែនទេ?`
                    : `Are you sure you want to delete expense "${expenseToDelete?.title}" of $${Number(expenseToDelete?.amount || 0).toFixed(2)}?`
                }
                type="danger"
                confirmText={isKh ? "លុបចេញ" : "Delete"}
                cancelText={isKh ? "បោះបង់" : "Cancel"}
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setExpenseToDelete(null);
                }}
            />
        </div>
    );
}