'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import { useLanguage } from '@/lib/LanguageContext';
import { getOptimizedImageUrl } from './RoomCard';
interface Property {
    id: number;
    title: string;
}

interface RoomImage {
    id: number;
    image_path?: string;
    image_url?: string;
}

interface Room {
    id: number;
    property_id?: number;
    room_number: string;
    price: string | number;
    deposit?: string | number | null;
    type?: string;
    status?: string;
    floor?: string | null;
    amenities?: string | string[] | null;
    description?: string | null;
    images?: RoomImage[];
}

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
    room: Room | null;
}

export default function RoomModal({ isOpen, onClose, onRefresh, room }: RoomModalProps) {
    const { language } = useLanguage();

    const [properties, setProperties] = useState<Property[]>([]);
    const [propertyId, setPropertyId] = useState('');
    const [roomNumber, setRoomNumber] = useState('');
    const [type, setType] = useState<'Single' | 'Double' | 'Studio' | 'Apartment'>('Single');
    const [price, setPrice] = useState('');
    const [deposit, setDeposit] = useState('');
    const [status, setStatus] = useState<'Available' | 'Occupied' | 'Maintenance'>('Available');
    const [floor, setFloor] = useState('');
    const [amenities, setAmenities] = useState('');
    const [description, setDescription] = useState('');

    const [imageUrl, setImageUrl] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<RoomImage[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!room;

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            api.get('/properties')
                .then((res) => {
                    const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
                    setProperties(data);
                    if (data.length > 0 && !isEditMode) {
                        setPropertyId(data[0].id.toString());
                    }
                })
                .catch((err) => console.error("Error fetching properties:", err));
        }
    }, [isOpen, isEditMode]);

    useEffect(() => {
        if (isOpen && room) {
            setPropertyId(room.property_id ? room.property_id.toString() : '');
            setRoomNumber(room.room_number || '');
            if (room.type) {
                setType((room.type.charAt(0).toUpperCase() + room.type.slice(1).toLowerCase()) as any);
            }
            setPrice(room.price ? room.price.toString() : '');
            setDeposit(room.deposit ? room.deposit.toString() : '');
            if (room.status) {
                setStatus((room.status.charAt(0).toUpperCase() + room.status.slice(1).toLowerCase()) as any);
            }
            setFloor(room.floor || '');
            setAmenities(Array.isArray(room.amenities) ? room.amenities.join(', ') : (room.amenities || ''));
            setDescription(room.description || '');
            setExistingImages(room.images || []);
            setImageUrl('');
            setSelectedFiles([]);
        } else if (isOpen && !room) {
            setRoomNumber('');
            setType('Single');
            setPrice('');
            setDeposit('');
            setStatus('Available');
            setFloor('');
            setAmenities('');
            setDescription('');
            setImageUrl('');
            setExistingImages([]);
            setSelectedFiles([]);
        }
    }, [isOpen, room?.id]);

    useEffect(() => {
        if (selectedFiles.length === 0) {
            setPreviewUrls([]);
            return;
        }
        const objectUrls = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(objectUrls);

        return () => objectUrls.forEach(url => URL.revokeObjectURL(url));
    }, [selectedFiles]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles((prev) => {
                const existingNames = prev.map(f => f.name);
                const filteredNewFiles = filesArray.filter(f => !existingNames.includes(f.name));
                return [...prev, ...filteredNewFiles];
            });
        }
        e.target.value = '';
    };

    const removeSelectedFile = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDeleteExistingImageClick = (e: React.MouseEvent, imgId: number) => {
        e.preventDefault();
        e.stopPropagation();
        setImageToDelete(imgId);
        setIsConfirmOpen(true);
    };

    const executeDeleteImage = async () => {
        if (!imageToDelete) return;

        try {
            await api.delete(`/owner/room-images/${imageToDelete}`);
            setExistingImages(prev => prev.filter(item => item.id !== imageToDelete));
            onRefresh();
            toast.success("បានលុបរូបភាពរួចរាល់!");
        } catch (err) {
            console.error("Error deleting image:", err);
            toast.error("មិនអាចលុបរូបភាពបានឡើយ។");
        } finally {
            setIsConfirmOpen(false);
            setImageToDelete(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!propertyId) {
            toast.error("សូមជ្រើសរើសអចលនទ្រព្យជាមុនសិន!");
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('property_id', propertyId);
        formData.append('room_number', roomNumber);
        formData.append('type', type);
        formData.append('price', price);
        formData.append('deposit', deposit || '0');
        formData.append('status', status);
        formData.append('floor', floor || '');
        formData.append('amenities', amenities || '');
        formData.append('description', description || '');

        if (imageUrl.trim()) {
            formData.append('image_url', imageUrl.trim());
        }

        selectedFiles.forEach((file) => {
            formData.append('images[]', file);
        });

        try {
            if (isEditMode && room) {
                formData.append('_method', 'PUT');
                await api.post(`/owner/rooms/${room.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("បានធ្វើបច្ចុប្បន្នភាពបន្ទប់ជួលដោយជោគជ័យ!");
            } else {
                await api.post('/owner/rooms', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("បានបន្ថែមបន្ទប់ជួលថ្មីដោយជោគជ័យ!");
            }

            onRefresh();
            onClose();

        } catch (error: any) {
            console.error("Error saving room:", error);
            const serverMsg = error.response?.data?.message || "ការរក្សាទុកបានបរាជ័យ សូមពិនិត្យម្តងទៀត។";
            toast.error(serverMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClasses = "w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500";
    const labelClasses = "block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 tracking-wider";

    const t = (kh: string, en: string) => (language === 'kh' ? kh : en);
    return (
        <>
            <div
                className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}>
                <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <ImageIcon size={20} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                {isEditMode
                                    ? (language === 'kh' ? 'កែប្រែព័ត៌មានបន្ទប់' : 'Edit Room Information')
                                    : (language === 'kh' ? 'បន្ថែមបន្ទប់ជួលថ្មី' : 'Add New Room')}
                            </h3>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form Body - Scrollable */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain scroll-smooth">
                        {/* Custom Scrollbar Styling */}
                        <style>{`
                            form::-webkit-scrollbar {
                                width: 8px;
                            }
                            form::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            form::-webkit-scrollbar-thumb {
                                background: #cbd5e1;
                                border-radius: 4px;
                            }
                            form::-webkit-scrollbar-thumb:hover {
                            
                            
                            
                            
                                background: #94a3b8;
                            }
                            .dark form::-webkit-scrollbar-thumb {
                                background: #64748b;
                            }
                            .dark form::-webkit-scrollbar-thumb:hover {
                                background: #94a3b8;
                            }
                        `}</style>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                                {/* Left Section */}
                                <div className="md:col-span-7 space-y-3">
                                    <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClasses}>{t('ស្ថិតក្នុងអចលនទ្រព្យ *', 'Property *')}</label>
                                                <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputClasses} required>
                                                    <option value="" disabled>--- ជ្រើសរើសអចលនទ្រព្យ ---</option>
                                                    {properties.map((prop) => (
                                                        <option key={prop.id} value={prop.id}>{prop.title}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className={labelClasses}>{t('ស្ថានភាពបន្ទប់ *', 'Room Status *')}</label>
                                                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={inputClasses}>
                                                    <option value="Available">{language === 'kh' ? 'ទំនេរ' : 'Available'}</option>
                                                    <option value="Occupied">{language === 'kh' ? 'មានអ្នកជួល' : 'Occupied'}</option>
                                                    <option value="Maintenance">{language === 'kh' ? 'កំពុងជួសជុល' : 'Maintenance'}</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClasses}>{t('លេខបន្ទប់ *', 'Room Number *')}</label>
                                                <input type="text" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="A-01" className={inputClasses} />
                                            </div>
                                            <div>
                                                <label className={labelClasses}>{t('ជាន់ (Floor)', 'Floor')}</label>
                                                <input type="text" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="1, E0" className={inputClasses} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClasses}>{t('ប្រភេទបន្ទប់ *', 'Room Type *')}</label>
                                                <select value={type} onChange={(e) => setType(e.target.value as any)} className={inputClasses}>
                                                    <option value="Single">Single</option>
                                                    <option value="Double">Double</option>
                                                    <option value="Studio">Studio</option>
                                                    <option value="Apartment">Apartment</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClasses}>{t('តម្លៃប្រចាំខែ ($) *', 'Monthly Price ($) *')}</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                        value={price}
                                                        onChange={(e) => setPrice(e.target.value)}
                                                        placeholder="0.00"
                                                        className={inputClasses}
                                                    />
                                                </div>

                                                {/* 🟢 បន្ថែម Input ប្រាក់កក់ត្រង់នេះ */}
                                                <div>
                                                    <label className={labelClasses}>{t('ប្រាក់កក់ ($)', 'Deposit ($)')}</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={deposit}
                                                        onChange={(e) => setDeposit(e.target.value)}
                                                        placeholder="0.00"
                                                        className={inputClasses}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClasses}>{t('គ្រឿងបរិក្ខារ (Amenities)', 'Amenities')}</label>
                                                <input type="text" value={amenities} onChange={(e) => setAmenities(e.target.value)} placeholder="ឧទាហរណ៍៖ ម៉ាស៊ីនត្រជាក់, គ្រែ, ទូទឹកកក" className={inputClasses} />
                                            </div>
                                            <div>
                                                <label className={labelClasses}>{t('ការពិពណ៌នាបន្ថែម', 'Description')}</label>
                                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="បញ្ចូលព័ត៌មានលម្អិតផ្សេងៗអំពីបន្ទប់..." className={`${inputClasses} h-16 resize-none`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section - Image Management */}
                                <div className="md:col-span-5 flex flex-col gap-4">
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col">
                                        <label className={labelClasses}>{t('រូបភាពបន្ទប់ជួល', 'Room Images')}</label>

                                        <div className="space-y-4 flex flex-col flex-1">
                                            <input
                                                type="text"
                                                value={imageUrl}
                                                onChange={(e) => setImageUrl(e.target.value)}
                                                placeholder="បញ្ចូលលីងរូបភាព (Image URL) ប្រសិនបើមាន"
                                                className={inputClasses}
                                            />

                                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-indigo-300 dark:border-indigo-700/50 rounded-xl cursor-pointer bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <UploadCloud className="w-8 h-8 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                                                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">ចុចទីនេះ ដើម្បីបង្ហោះរូបភាព</p>
                                                    <p className="text-xs text-slate-500 mt-1">គាំទ្រ (JPG, PNG, WEBP)</p>
                                                </div>
                                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only" />
                                            </label>

                                            {/* Image Gallery */}
                                            {(existingImages.length > 0 || previewUrls.length > 0) && (
                                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex-1 min-h-0 flex flex-col">
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">រូបភាព ({existingImages.length + previewUrls.length})</p>
                                                    <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pr-2">
                                                        {/* Custom Scrollbar */}
                                                        <style>{`
                                                            .image-scroll::-webkit-scrollbar {
                                                                width: 6px;
                                                            }
                                                            .image-scroll::-webkit-scrollbar-track {
                                                                background: transparent;
                                                            }
                                                            .image-scroll::-webkit-scrollbar-thumb {
                                                                background: #cbd5e1;
                                                                border-radius: 3px;
                                                            }
                                                            .image-scroll::-webkit-scrollbar-thumb:hover {
                                                                background: #94a3b8;
                                                            }
                                                        `}</style>

                                                        <div className="image-scroll grid grid-cols-3 gap-3">

                                                            {/* Existing Images */}
                                                            {existingImages.map((img) => (
                                                                <div
                                                                    key={`existing-${img.id}`}
                                                                    className="group relative aspect-square bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600"
                                                                >
                                                                    <img
                                                                        src={getOptimizedImageUrl(img.image_path) || "https://placehold.co/150x150?text=No+Image"}
                                                                        alt={`Room image ${img.id}`}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src =
                                                                                "https://placehold.co/150x150?text=No+Image";
                                                                        }}
                                                                    />

                                                                    {/* Overlay */}
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

                                                                    {/* ប៊ូតុងលុបសម្រាប់រូបភាពចាស់ */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleDeleteExistingImageClick(e, img.id)}
                                                                        className="absolute top-0 right-0  text-white hover:bg-red-400 border  bg-red-500 rounded-lg shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 z-50 "
                                                                        title="លុបរូបភាពនេះ"
                                                                        aria-label={`Delete image ${img.id}`}
                                                                    >
                                                                        <X size={18} strokeWidth={2} />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {/* New Images */}
                                                            {previewUrls.map((url, index) => (
                                                                <div
                                                                    key={`new-${index}`}
                                                                    className="group relative aspect-square bg-white dark:bg-slate-900 rounded-xl border-2 border-indigo-400 dark:border-indigo-500 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg"
                                                                >
                                                                    {/* New Badge */}
                                                                    <div className="absolute top-2 left-2 bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider z-20 shadow-sm">
                                                                        ថ្មី
                                                                    </div>

                                                                    {/* Image */}
                                                                    <img
                                                                        src={url}
                                                                        alt={`preview-${index}`}
                                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                    />

                                                                    {/* Overlay */}
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

                                                                    {/* ប៊ូតុងលុបសម្រាប់រូបភាពថ្មី (Preview) */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => removeSelectedFile(e, index)}
                                                                        className="absolute top-0 right-0  text-white hover:bg-red-400 border  bg-red-500 rounded-lg shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 z-50 "
                                                                        title="លុបរូបភាពនេះ"
                                                                        aria-label={`Remove image ${index}`}
                                                                    >
                                                                        <X size={18} strokeWidth={2.5} />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Footer Actions - Fixed */}
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            បោះបង់
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            onClick={handleSubmit}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    {language === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving...'}
                                </>
                            ) : (
                                language === 'kh' ? 'រក្សាទុកព័ត៌មាន' : 'Save Information'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                title={language === 'kh' ? 'លុបរូបភាពនេះ?' : 'Delete this image?'}
                message={language === 'kh' ? 'តើអ្នកពិតជាចង់លុបរូបភាពនេះមែនទេ?' : 'Are you sure you want to delete this image?'}
                confirmText={language === 'kh' ? 'លុបចោល' : 'Delete'}
                cancelText={language === 'kh' ? 'បោះបង់' : 'Cancel'}
                onConfirm={executeDeleteImage}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setImageToDelete(null);
                }}
                type="danger"
            />
        </>
    );
}