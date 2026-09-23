'use client';
import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Building2, AlertCircle, Loader2, Eye, Edit, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import ConfirmModal from '@/app/components/ConfirmModal';
import toast, { Toaster } from 'react-hot-toast'; // 🟢 ១. រៀបចំប្រើប្រាស់ react-hot-toast

interface Property {
    id: number;
    title: string;
    description: string;
    address: string;
    city: string;
    rooms_count?: number;
}

export default function AdminPropertiesPage() {
    const { language } = useLanguage();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const [isSaving, setIsSaving] = useState<boolean>(false);

    // State សម្រាប់ផ្ទាំងលុប (Delete Modal)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [propertyToDelete, setPropertyToDelete] = useState<number | null>(null);

    // State សម្រាប់ផ្ទាំងកែប្រែ (Edit Pop-up Modal)
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editForm, setEditForm] = useState<Partial<Property>>({});

    // State សម្រាប់ផ្ទាំងបន្ថែមអចលនទ្រព្យ (Add Pop-up Modal)
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [addForm, setAddForm] = useState<Partial<Property>>({
        title: '',
        description: '',
        address: '',
        city: '',
        rooms_count: 0
    });

    const fetchProperties = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/admin/properties');
            setProperties(Array.isArray(response.data) ? response.data : response.data.data || []);
        } catch (err) {
            console.error("Error fetching properties:", err);
            setError("មិនអាចទាញយកទិន្នន័យអចលនទ្រព្យបានទេ!");
        } finally {
            setLoading(false);
        }
    };

    const handleView = (id: number) => {
        router.push(`/dashboard/admin/properties/${id}`);
    };

    const handleAddClick = () => {
        setAddForm({
            title: '',
            description: '',
            address: '',
            city: '',
            rooms_count: 0
        });
        setIsAddModalOpen(true);
    };

    // 🔵 ២. មុខងារបញ្ជូនទិន្នន័យទៅបង្កើតថ្មី (Post)
    const handleSaveAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await api.post('/admin/properties', addForm);
            const newProperty = response.data.data || response.data;

            setProperties([newProperty, ...properties]);
            setIsAddModalOpen(false);
            // 🟢 ប្តូរមកប្រើ Toast Success ពេលបង្កើតជោគជ័យ
            toast.success(language === 'kh' ? "បានបង្កើតអចលនទ្រព្យថ្មីដោយជោគជ័យ!" : "Property created successfully!");
        } catch (err) {
            console.error("Error creating property:", err);
            // 🟢 ប្តូរមកប្រើ Toast Error ពេលមានបញ្ហា
            toast.error(language === 'kh' ? "ការបង្កើតមិនបានជោគជ័យទេ!" : "Failed to create property!");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (property: Property) => {
        setEditForm({ ...property });
        setIsEditModalOpen(true);
    };

    // 🟡 មុខងាររក្សាទុកការកែប្រែ (Put)
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm.id) return;

        setIsSaving(true);
        try {
            await api.put(`/admin/properties/${editForm.id}`, editForm);
            setProperties(properties.map(p => p.id === editForm.id ? { ...p, ...editForm } as Property : p));
            setIsEditModalOpen(false);
            // 🟢 ប្តូរមកប្រើ Toast Success ពេលកែប្រែជោគជ័យ
            toast.success("បានកែប្រែព័ត៌មានអចលនទ្រព្យជោគជ័យ!");
        } catch (err) {
            console.error("Error updating property:", err);
            // 🟢 ប្តូរមកប្រើ Toast Error
            toast.error("ការកែប្រែមិនបានជោគជ័យទេ!");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setPropertyToDelete(id);
        setIsDeleteModalOpen(true);
    };

    // 🔴 មុខងារលុបទិន្នន័យ (Delete)
    const handleConfirmDelete = async () => {
        if (!propertyToDelete) return;
        try {
            await api.delete(`/admin/properties/${propertyToDelete}`);
            setProperties(properties.filter(property => property.id !== propertyToDelete));
            // 🟢 ប្តូរមកប្រើ Toast Success ពេលលុបជោគជ័យ
            toast.success("បានលុបអចលនទ្រព្យចេញពីប្រព័ន្ធរួចរាល់!");
        } catch (err) {
            console.error("Error deleting property:", err);
            // 🟢 ប្តូរមកប្រើ Toast Error
            toast.error("ការលុបមិនបានជោគជ័យទេ!");
        } finally {
            setIsDeleteModalOpen(false);
            setPropertyToDelete(null);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full">
                <Loader2 className="w-9 h-9 text-rose-600 animate-spin mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">កំពុងផ្ទុកបញ្ជីអចលនទ្រព្យ...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl w-full flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-rose-900 dark:text-rose-100">{error}</p>
                    <button onClick={fetchProperties} className="text-xs font-semibold text-rose-600 dark:text-rose-400 underline mt-2 block">ព្យាយាមម្តងទៀត</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            {/* 🟢 ដាក់ Component Toaster នៅផ្នែកខាងលើគេបង្អស់នៃ UI ដើម្បីឱ្យវាលោតស្អាត */}
            <Toaster position="top-right" reverseOrder={false} />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">គ្រប់គ្រងអចលនទ្រព្យ</h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">បញ្ជី និងព័ត៌មានលម្អិតនៃទីតាំង ឬអគារស្នាក់នៅទាំងអស់</p>
                </div>
                <button onClick={handleAddClick} className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition text-sm flex items-center justify-center gap-2 flex-shrink-0 shadow-sm">
                    <Plus className="w-4 h-4" /> បន្ថែមអចលនទ្រព្យ
                </button>
            </div>

            {/* Properties Grid */}
            {properties.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">មិនទាន់មានទិន្នន័យអចលនទ្រព្យនៅក្នុងប្រព័ន្ធឡើយ。</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {properties.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col min-w-0 hover:shadow-md transition">
                            <div className="p-5 flex-1 space-y-3 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg flex-shrink-0">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/40">
                                        {item.rooms_count ?? 0} បន្ទប់
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base truncate">{item.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2 min-h-[2rem]">{item.description || 'គ្មានការពិពណ៌នា'}</p>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/60 min-w-0">
                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{item.address}, {item.city}</span>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60 w-full">
                                    <button onClick={() => handleView(item.id)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition" title="មើលលម្អិត">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleEditClick(item)} className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition" title="កែប្រែ">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteClick(item.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition" title="លុប">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ផ្ទាំង Add Property Pop-up */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <Plus className="w-5 h-5 text-rose-500" />
                                <h3 className="text-lg font-bold">បន្ថែមអចលនទ្រព្យថ្មី</h3>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">ឈ្មោះអចលនទ្រព្យ</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="ឧ. អាផាតមិន សែនសុខ"
                                    value={addForm.title || ''}
                                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">ទីក្រុង/ខេត្ត</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ឧ. ភ្នំពេញ"
                                        value={addForm.city || ''}
                                        onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">ចំនួនបន្ទប់</label>
                                    <input
                                        type="number"
                                        value={addForm.rooms_count ?? 0}
                                        onChange={(e) => setAddForm({ ...addForm, rooms_count: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">អាសយដ្ឋាន</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="ឧ. ផ្លូវ ១០០ ផ្ទះ លេខ ១២សេ"
                                    value={addForm.address || ''}
                                    onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">ការពិពណ៌នា</label>
                                <textarea
                                    rows={3}
                                    placeholder="ព័ត៌មានបន្ថែមផ្សេងៗ..."
                                    value={addForm.description || ''}
                                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 transition resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                                    បោះបង់
                                </button>
                                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 rounded-lg transition flex items-center gap-2">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            កំពុងបង្កើត...
                                        </>
                                    ) : (
                                        'បង្កើតថ្មី'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ផ្ទាំង Edit Property Pop-up */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <Edit className="w-5 h-5 text-amber-500" />
                                <h3 className="text-lg font-bold">កែប្រែព័ត៌មានអចលនទ្រព្យ</h3>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">ឈ្មោះអចលនទ្រព្យ</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.title || ''}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">ទីក្រុង/ខេត្ត</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.city || ''}
                                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">ចំនួនបន្ទប់</label>
                                    <input
                                        type="number"
                                        value={editForm.rooms_count ?? 0}
                                        onChange={(e) => setEditForm({ ...editForm, rooms_count: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">អាសយដ្ឋាន</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.address || ''}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">ការពិពណ៌នា</label>
                                <textarea
                                    rows={3}
                                    value={editForm.description || ''}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 transition resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                                    បោះបង់
                                </button>
                                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 rounded-lg transition flex items-center gap-2">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            កំពុងរក្សាទុក...
                                        </>
                                    ) : (
                                        'រក្សាទុកការផ្លាស់ប្តូរ'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ConfirmModal សម្រាប់លុប */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title={language === 'kh' ? "បញ្ជាក់ការលុបអចលនទ្រព្យ" : "Confirm Property Deletion"}
                message={language === 'kh'
                    ? "តើបងពិតជាចង់លុបអចលនទ្រព្យនេះចេញពីប្រព័ន្ធមែនទេ?"
                    : "Are you sure you want to delete this property?"
                }
                confirmText={language === 'kh' ? "លុបចោល" : "Delete"}
                cancelText={language === 'kh' ? "បោះបង់" : "Cancel"}
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setPropertyToDelete(null);
                }}
            />
        </div>
    );
}