'use client';
import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, Loader2, Edit, Trash2, Printer, Eye } from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import ConfirmModal from '@/app/components/ConfirmModal';
import InvoiceModal from '@/app/components/InvoiceModal';
import ReceiptModal from '@/app/components/ReceiptModal';
import { useInvoiceForm } from '@/hooks/useInvoiceForm';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminInvoicesPage() {
    const { language } = useLanguage();

    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    const invoiceModal = useInvoiceForm(invoices, setInvoices);


    const fetchInvoices = async () => {
        try {
            const res = await api.get('/admin/invoices');
            setInvoices(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch (err) {
            console.error(err);
            toast.error("មិនអាចទាញយកទិន្នន័យវិក្កយបត្របានទេ!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    const handleDeleteClick = (id: string) => { setInvoiceToDelete(id); setIsDeleteModalOpen(true); };

    const handleConfirmDelete = async () => {
        try {
            await api.delete(`/admin/invoices/${invoiceToDelete}`);
            setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete));

            // ប្រើភាសាដែលអ្នកបានកំណត់
            toast.success(language === 'kh' ? "បានលុបវិក្កយបត្រដោយជោគជ័យ!" : "Invoice deleted successfully!");
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.message || "សូមព្យាយាមម្តងទៀត";
            toast.error(language === 'kh' ? "មានបញ្ហាក្នុងការលុប៖ " + errorMsg : "Error deleting: " + errorMsg);
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const handleExport = (invoice: any) => {
        setSelectedInvoice(invoice);
        setIsReceiptModalOpen(true);
    };

    if (loading) return <div className="text-center py-24"><Loader2 className="w-9 h-9 animate-spin text-rose-600 m-auto" /></div>;

    return (
        <div className="space-y-6 w-full">
            <Toaster position="top-right" reverseOrder={false} />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">គ្រប់គ្រងវិក្កយបត្រ</h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">តាមដានការទូទាត់ប្រាក់ និងប្រវត្តិវិក្កយបត្រ</p>
                </div>
                <button
                    onClick={invoiceModal.openAdd}
                    className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition text-sm shadow-sm"
                >
                    <Plus className="w-4 h-4" /> បង្កើតវិក្កយបត្រ
                </button>
            </div>

            {/* 🟢 ជំនួសមកវិញដោយ Table ធម្មតា */}
            <div className="w-full overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <th className="px-6 py-3.5">ID</th>
                            <th className="px-6 py-3.5">Booking ID</th>
                            <th className="px-6 py-3.5">{language === 'kh' ? 'កាលបរិច្ឆេទកំណត់' : 'Due Date'}</th>
                            <th className="px-6 py-3.5">{language === 'kh' ? 'ទឹកប្រាក់សរុប' : 'Total Amount'}</th>
                            <th className="px-6 py-3.5">{language === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                            <th className="px-6 py-3.5 text-right">{language === 'kh' ? 'សកម្មភាព' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm bg-white dark:bg-slate-900">
                                    មិនទាន់មានទិន្នន័យវិក្កយបត្រនៅឡើយទេ
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">#{inv.id}</td>
                                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">#{inv.booking_id}</td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{inv.due_date}</td>
                                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-bold">${Number(inv.total_amount).toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${inv.payment_status === 'paid'
                                            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400'
                                            : inv.payment_status === 'partial'
                                                ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400'
                                                : 'text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400'
                                            }`}>
                                            {inv.payment_status === 'paid' ? 'បង់រួច' : inv.payment_status === 'partial' ? 'បង់ខ្លះ' : 'ជំពាក់'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => {
                                                    setSelectedInvoice(inv);
                                                    setIsReceiptModalOpen(true);
                                                }}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition"
                                                title={language === 'kh' ? 'មើលវិក្កយបត្រ / បង្កាន់ដៃ' : 'View Receipt / Invoice'}
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => invoiceModal.openEdit(inv)}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 hover:text-amber-500 transition"
                                                title="កែប្រែ"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleExport(inv)}
                                                disabled={exportingId === inv.id}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition"
                                                title="ទាញយក PDF"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(inv.id)}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 hover:text-rose-500 transition"
                                                title="លុប"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            <ReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => {
                    setIsReceiptModalOpen(false);
                    setSelectedInvoice(null);
                }}
                invoice={selectedInvoice}
                lang={language === 'kh' ? 'kh' : 'en'}
            />

            {/* 🟢 ជំនួសកូដត្រង់ផ្នែក InvoiceModal ក្នុងឯកសារ AdminInvoicesPage.tsx ទៅជាបែបនេះ៖ */}
            <InvoiceModal
                isOpen={invoiceModal.isOpen}
                onClose={() => invoiceModal.setIsOpen(false)}
                onSave={async (data: any) => {
                    await invoiceModal.handleSave(data);
                }}
                isSaving={invoiceModal.isSaving}
                isEdit={invoiceModal.isEdit}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title={language === 'kh' ? 'បញ្ជាក់ការលុប' : 'Confirm Delete'}
                message={language === 'kh' ? 'តើបងពិតជាចង់លុបវិក្កយបត្រនេះមែនទេ?' : 'Are you sure you want to delete this invoice?'}
                confirmText={language === 'kh' ? 'លុបចោល' : 'Delete'}
                cancelText={language === 'kh' ? 'បោះបង់' : 'Cancel'}
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
            />
        </div>
    );
}