'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, MapPin, Building2, FileText, Plus, Map, Pencil, Trash2 } from 'lucide-react';
import PropertyModal from '@/app/components/PropertyModal';
import ConfirmModal from '@/app/components/ConfirmModal';
import PropertyFilter from '@/app/components/PropertyFilter'; // 📥 Import PropertyFilter ចូល
import toast from 'react-hot-toast';

interface Property {
    id: number;
    owner_id: number;
    title: string;
    description: string | null;
    address: string;
    city: string;
    location_map_link: string | null;
    rooms_count?: number;
    images?: { id: number; image_path: string }[]; // 🟢 ថែមបន្ទាត់នេះ ដើម្បីស្គាល់ Array នៃរូបភាព
}

export default function OwnerPropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState<'kh' | 'en'>('kh');

    const [isModalOpen, setIsModalOpen] = useState(false);
    // ប្តូរឈ្មោះ State នេះបន្តិចកុំឱ្យជាន់គ្នាជាមួយ State សម្រាប់ Filter
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [propertyToDelete, setPropertyToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 🔍 States សម្រាប់ប្រើជាមួយ PropertyFilter
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterPropertyId, setFilterPropertyId] = useState<string>('');

    const fetchProperties = () => {
        setLoading(true);
        api.get('owner/properties')
            .then((res) => {
                const responseData = res.data?.data ? res.data.data : (Array.isArray(res.data) ? res.data : []);
                setProperties(responseData);
            })
            .catch((err) => {
                console.error("Error fetching properties:", err);
                const errorMsg = err.response?.data?.message || (lang === 'kh' ? "មិនអាចទាញយកទិន្នន័យអចលនទ្រព្យបានទេ!" : "Failed to fetch property data!");
                toast.error(errorMsg);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);
        fetchProperties();
    }, []);

    const t = {
        kh: {
            loading: 'កំពុងទាញយកទិន្នន័យអចលនទ្រព្យ...',
            title: 'បញ្ជីគ្រប់គ្រងអចលនទ្រព្យទាំងអស់',
            addBtn: 'បន្ថែមអចលនទ្រព្យថ្មី',
            thTitle: 'ឈ្មោះអចលនទ្រព្យ',
            thCity: 'ទីក្រុង/ខេត្ត',
            thAddress: 'ទីតាំង / អាសយដ្ឋាន',
            thDesc: 'ការពិពណ៌នា',
            thAction: 'សកម្មភាព',
            noData: 'មិនទាន់មានទិន្នន័យអចលនទ្រព្យក្នុងប្រព័ន្ធនៅឡើយទេ។',
            viewMap: 'មើលផែនទី',
            noMap: 'គ្មានផែនទី',
            edit: 'កែប្រែ',
            delete: 'លុប',
            toastAdding: 'កំពុងបើកទម្រង់បន្ថែមអចលនទ្រព្យថ្មី...',
            toastEditing: 'កំពុងបើកកែប្រែ៖ ',
            deleteSuccess: 'បានលុបអចលនទ្រព្យដោយជោគជ័យ!',
            deleteFailed: 'ការលុបបានបរាជ័យ សូមព្យាយាមម្តងទៀត។',
            // បន្ថែមពាក្យសម្រាប់ PropertyFilter
            allProperties: 'អចលនទ្រព្យទាំងអស់',
            searchPlaceholder: 'ស្វែងរកអចលនទ្រព្យ...'
        },
        en: {
            loading: 'Loading property data...',
            title: 'All Properties Management',
            addBtn: 'Add New Property',
            thTitle: 'Property Title',
            thCity: 'City / Province',
            thAddress: 'Address / Location',
            thDesc: 'Description',
            thAction: 'Actions',
            noData: 'No property data available in the system.',
            viewMap: 'View Map',
            noMap: 'No Map',
            edit: 'Edit',
            delete: 'Delete',
            toastAdding: 'Opening add property form...',
            toastEditing: 'Opening edit for: ',
            deleteSuccess: 'Property deleted successfully!',
            deleteFailed: 'Failed to delete property. Please try again.',
            allProperties: 'All Properties',
            searchPlaceholder: 'Search property...'
        }
    };

    const handleAddClick = () => {
        setEditingProperty(null);
        setIsModalOpen(true);
        toast(t[lang].toastAdding, { icon: <Pencil size={16} className="text-indigo-500" /> });
    };

    const handleEditClick = (property: Property) => {
        setEditingProperty(property);
        setIsModalOpen(true);
        toast.success(`${t[lang].toastEditing}${property.title}`);
    };

    const handleDeleteClick = (id: number) => {
        setPropertyToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!propertyToDelete) return;
        setIsDeleting(true);

        try {
            await api.delete(`/owner/properties/${propertyToDelete}`);
            toast.success(t[lang].deleteSuccess);
            setProperties((prev) => prev.filter(item => item.id !== propertyToDelete));
        } catch (error) {
            console.error("Error deleting property:", error);
            toast.error(t[lang].deleteFailed);
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setPropertyToDelete(null);
        }
    };

    // 🔄 បម្លែងទិន្នន័យ properties ទៅជាទម្រង់ដែល PropertyFilter ត្រូវការសម្រាប់ Dropdown
    const dropdownProperties = properties.map(p => ({
        id: p.id.toString(),
        name: p.title
    }));

    // 🎯 ធ្វើតម្រង (Filter) ទិន្នន័យដើម្បីបង្ហាញក្នុងតារាង
    const filteredData = properties.filter((property) => {
        const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.city.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDropdown = filterPropertyId ? property.id.toString() === filterPropertyId : true;

        return matchesSearch && matchesDropdown;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm font-medium">{t[lang].loading}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t[lang].title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">សរុប៖ {filteredData.length} អចលនទ្រព្យ</p>
                </div>

                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition duration-200"
                >
                    <Plus size={16} />
                    {t[lang].addBtn}
                </button>
            </div>

            {/* 🛠️ ហៅ Component PropertyFilter មកប្រើ */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <PropertyFilter
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedProperty={filterPropertyId}
                    setSelectedProperty={setFilterPropertyId}
                    properties={dropdownProperties}
                    t={t}
                    lang={lang}
                />
            </div>

            {/* Table layout */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-200 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">{t[lang].thTitle}</th>
                                <th className="px-6 py-4">{t[lang].thCity}</th>
                                <th className="px-6 py-4">{t[lang].thAddress}</th>
                                <th className="px-6 py-4">{t[lang].thDesc}</th>
                                <th className="px-6 py-4 text-center">{t[lang].thAction}</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Building2 size={32} className="text-slate-300 dark:text-slate-700" />
                                            <span>{t[lang].noData}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((property) => (
                                    <tr key={property.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition duration-150">
                                        {/* Title */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {/* 🟢 បង្ហាញរូបភាពដំបូងរបស់អគារ បើគ្មានរូបទេទើបបង្ហាញ Icon Building2 */}
                                                {property.images && property.images.length > 0 ? (
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
                                                        <img
                                                            src={property.images[0].image_path}
                                                            alt={property.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                                                        <Building2 size={18} />
                                                    </div>
                                                )}

                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{property.title}</div>
                                                    <div className="text-xs text-slate-400 mt-0.5">
                                                        បន្ទប់សរុប៖ <span className="font-semibold text-indigo-600 dark:text-indigo-400">{property.rooms_count ?? 0}</span> បន្ទប់
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* City */}
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium">
                                                <MapPin size={12} className="text-slate-400" />
                                                {property.city}
                                            </span>
                                        </td>

                                        {/* Address */}
                                        <td className="px-6 py-4 max-w-[220px]">
                                            <div className="truncate text-slate-600 dark:text-slate-400 mb-1">{property.address}</div>
                                            {property.location_map_link ? (
                                                <a
                                                    href={property.location_map_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                                                >
                                                    <Map size={12} />
                                                    {t[lang].viewMap}
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">{t[lang].noMap}</span>
                                            )}
                                        </td>

                                        {/* Description */}
                                        <td className="px-6 py-4 max-w-[200px] truncate text-slate-400 dark:text-slate-500">
                                            {property.description ? (
                                                <span className="flex items-center gap-1">
                                                    <FileText size={14} className="opacity-70" />
                                                    {property.description}
                                                </span>
                                            ) : (
                                                <span className="italic text-slate-300 dark:text-slate-700">គ្មានការពិពណ៌នា</span>
                                            )}
                                        </td>

                                        {/* Action Buttons */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditClick(property)}
                                                    title={t[lang].edit}
                                                    className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition duration-150"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteClick(property.id)}
                                                    disabled={isDeleting && propertyToDelete === property.id}
                                                    title={t[lang].delete}
                                                    className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition duration-150 disabled:opacity-50"
                                                >
                                                    {isDeleting && propertyToDelete === property.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Property Add/Edit Modal */}
            <PropertyModal
                isOpen={isModalOpen}
                property={editingProperty}
                onClose={() => setIsModalOpen(false)}
                onRefresh={fetchProperties}
                lang={lang}
            />

            {/* Confirm Modal សម្រាប់ការលុប */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title={lang === 'kh' ? "តើអ្នកពិតជាចង់លុបអចលនទ្រព្យនេះមែនទេ?" : "Are you sure you want to delete this property?"}
                message={lang === 'kh' ? "ទិន្នន័យអចលនទ្រព្យនេះរួមទាំងបន្ទប់ទាំងអស់ដែលមានក្នុងនោះ នឹងត្រូវលុបចោលជាអចិន្ត្រៃយ៍។" : "This property and all rooms inside it will be permanently deleted."}
                confirmText={isDeleting ? (lang === 'kh' ? "កំពុងលុប..." : "Deleting...") : (lang === 'kh' ? "លុបចោល" : "Delete")}
                cancelText={lang === 'kh' ? "បោះបង់" : "Cancel"}
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    if (!isDeleting) {
                        setIsDeleteModalOpen(false);
                        setPropertyToDelete(null);
                    }
                }}
            />
        </div>
    );
}