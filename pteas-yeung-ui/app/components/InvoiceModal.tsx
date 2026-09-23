import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (e: any) => void;
    form?: any;
    setForm?: (form: any) => void;
    isSaving: boolean;
    isEdit: boolean;
}

// 🟢 បង្កើត Component នេះនៅខាងក្រៅដើម្បីកុំឱ្យបាត់បង់ Mouse Focus
const FormInput = ({ label, ...props }: any) => (
    <div>
        <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">{label}</label>
        <input
            {...props}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition font-medium text-slate-900 dark:text-slate-100"
        />
    </div>
);

export default function InvoiceModal({ isOpen, onClose, onSave, form, setForm, isSaving, isEdit }: InvoiceModalProps) {
    // 🟢 បង្កើត Local State នៅក្នុង Modal នេះដើម្បីវាយអក្សរបានរលូន និងការពារ Error 'setForm is not a function'
    const [localForm, setLocalForm] = useState<any>({});

    // ធ្វើបច្ចុប្បន្នភាព Local State រាល់ពេលបើក Modal ឬទិន្នន័យពីខាងក្រៅផ្លាស់ប្តូរ
    useEffect(() => {
        if (isOpen && form) {
            setLocalForm({ ...form });
        }
    }, [isOpen, form]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // បង្កើត Object ថ្មីដែលបម្លែង String ទៅជា Number ឱ្យបានត្រឹមត្រូវ
        const payload = {
            ...localForm,
            booking_id: Number(localForm.booking_id),
            electricity_start_unit: Number(localForm.electricity_start_unit),
            electricity_end_unit: Number(localForm.electricity_end_unit),
            water_unit: Number(localForm.water_unit),
            total_amount: parseFloat(localForm.total_amount),
        };

        onSave(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()} // ការពារកុំឱ្យបិទ Modal នៅពេលចុចក្នុង Form
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">

                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{isEdit ? 'កែប្រែវិក្កយបត្រ' : 'បង្កើតវិក្កយបត្រថ្មី'}</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <FormInput
                        label="Booking ID"
                        type="number"
                        required
                        value={localForm?.booking_id || ''}
                        onChange={(e: any) => setLocalForm({ ...localForm, booking_id: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="លេខភ្លើងដើម"
                            type="number"
                            required
                            value={localForm?.electricity_start_unit ?? ''}
                            onChange={(e: any) => setLocalForm({ ...localForm, electricity_start_unit: e.target.value })}
                        />
                        <FormInput
                            label="លេខភ្លើងចុង"
                            type="number"
                            required
                            value={localForm?.electricity_end_unit ?? ''}
                            onChange={(e: any) => setLocalForm({ ...localForm, electricity_end_unit: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="ទឹក (យូនីត)"
                            type="number"
                            required
                            value={localForm?.water_unit ?? ''}
                            onChange={(e: any) => setLocalForm({ ...localForm, water_unit: e.target.value })}
                        />
                        <FormInput
                            label="ទឹកប្រាក់សរុប ($)"
                            type="number"
                            step="any"
                            required
                            value={localForm?.total_amount ?? ''}
                            onChange={(e: any) => setLocalForm({ ...localForm, total_amount: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">ស្ថានភាពទូទាត់</label>
                            <select
                                value={localForm?.payment_status || 'unpaid'}
                                onChange={(e) => setLocalForm({ ...localForm, payment_status: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-950 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition font-medium"
                            >
                                <option value="unpaid">ជំពាក់ (Unpaid)</option>
                                <option value="partial">បង់ខ្លះ (Partial)</option>
                                <option value="paid">បង់រួច (Paid)</option>
                            </select>
                        </div>
                        <FormInput
                            label="កាលបរិច្ឆេទកំណត់"
                            type="date"
                            required
                            value={localForm?.due_date || ''}
                            onChange={(e: any) => setLocalForm({ ...localForm, due_date: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition font-medium">បោះបង់</button>
                        <button type="submit" disabled={isSaving} className="px-5 py-2.5 text-sm text-white bg-rose-600 hover:bg-rose-700 rounded-xl min-w-[120px] transition font-medium flex items-center justify-center">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEdit ? 'រក្សាទុក' : 'បង្កើតថ្មី')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}