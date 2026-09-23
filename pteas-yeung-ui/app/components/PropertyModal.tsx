'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '@/lib/api';
import { Loader2, X, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface PropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
    property: any | null;
    lang: 'kh' | 'en';
}

export default function PropertyModal({ isOpen, onClose, onRefresh, property, lang }: PropertyModalProps) {
    // 1. ប្រកាស Hooks ទាំងអស់នៅទីនេះ (ដាច់ខាតកុំឱ្យមាន if នៅពីមុខ)
    const [formData, setFormData] = useState({
        title: '',
        address: '',
        city: '',
        description: '',
        location_map_link: ''
    });

    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ផ្លាស់ទី extractSrcUrl មកទីនេះ ដើម្បីកុំឱ្យអាស្រ័យលើ Hook
    const extractSrcUrl = (input: string) => {
        const match = input.match(/src="([^"]+)"/);
        return match ? match[1] : input;
    };

    const mapSrc = React.useMemo(() =>
        extractSrcUrl(formData.location_map_link),
        [formData.location_map_link]);

    const isEditMode = !!property;

    useEffect(() => {
        if (isOpen && property) {
            setFormData({
                title: property.title || '',
                address: property.address || '',
                city: property.city || '',
                description: property.description || '',
                location_map_link: property.location_map_link || ''
            });
            if (property.images) {
                setImagePreviews(property.images.map((img: any) => img.image_path));
            }
        } else if (isOpen) {
            setFormData({ title: '', address: '', city: '', description: '', location_map_link: '' });
            setSelectedImages([]);
            setImagePreviews([]);
        }
    }, [isOpen, property]);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedImages((prev) => [...prev, ...filesArray]);

            const previewsArray = filesArray.map((file) => URL.createObjectURL(file));
            setImagePreviews((prev) => [...prev, ...previewsArray]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formToSend = new FormData();
        formToSend.append('title', formData.title);
        formToSend.append('city', formData.city);
        formToSend.append('address', formData.address);
        formToSend.append('description', formData.description);
        formToSend.append('location_map_link', extractSrcUrl(formData.location_map_link));

        selectedImages.forEach((image) => {
            formToSend.append('images[]', image);
        });

        try {
            if (isEditMode) {
                formToSend.append('_method', 'PUT');
                await api.post(`/owner/properties/${property.id}`, formToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(lang === 'kh' ? "បានធ្វើបច្ចុប្បន្នភាពជោគជ័យ!" : "Updated successfully!");
            } else {
                await api.post('/owner/properties', formToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(lang === 'kh' ? "បានបង្កើតអចលនទ្រព្យថ្មី!" : "Created successfully!");
            }
            onRefresh();
            onClose();
        } catch (error) {
            console.error("Error saving property:", error);
            toast.error(lang === 'kh' ? "មានបញ្ហា សូមព្យាយាមម្តងទៀត" : "Failed to save.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClasses = "w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500";
    const labelClasses = "block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 tracking-wider";
    const t = (kh: string, en: string) => (lang === 'kh' ? kh : en);

    return (
        <div
            // className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"

            onClick={onClose}>

            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8"
                onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {isEditMode ? (lang === 'kh' ? 'កែប្រែអចលនទ្រព្យ' : 'Edit Property') : (lang === 'kh' ? 'បន្ថែមអចលនទ្រព្យថ្មី' : 'Add New Property')}
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scroll-smooth">
                    {/* Custom Scrollbar */}
                    <style>{`
                        form::-webkit-scrollbar {
                            width: 6px;
                        }
                        form::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        form::-webkit-scrollbar-thumb {
                            background: #cbd5e1;
                            border-radius: 3px;
                        }
                        form::-webkit-scrollbar-thumb:hover {
                            background: #94a3b8;
                        }
                    `}</style>

                    {/* Property Title */}
                    <div>
                        <label className={labelClasses}>{t('ឈ្មោះអចលនទ្រព្យ *', 'Property Name *')}</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={lang === 'kh' ? "ឧទាហរណ៍៖ សូផីរាម ផ្ទាំងផ្លាក់" : "e.g. Sophiram Apartments"}
                            className={inputClasses}
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className={labelClasses}>{t('ទីក្រុង / ខេត្ត *', 'City / Province *')}</label>
                        <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder={lang === 'kh' ? "ឧទាហរណ៍៖ ភ្នំពេញ" : "e.g. Phnom Penh"}
                            className={inputClasses}
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className={labelClasses}>{t('អាសយដ្ឋាន *', 'Address *')}</label>
                        <input
                            type="text"
                            required
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder={lang === 'kh' ? "ឧទាហរណ៍៖ ផ្លូវលេខ ៧៥, សង្កាត់ដង្ហែ, ខណ្ឌ៧ផェ" : "e.g. Street 75, Phnom Penh"}
                            className={inputClasses}
                        />
                    </div>

                    {/* Images Section */}
                    <div>
                        <label className={labelClasses}>រូបភាពអគារ / បរិវេណរួម</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700/50 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-all bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group"
                        >
                            <ImagePlus size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">{lang === 'kh' ? 'ជ្រើសរើសរូបភាព (អាចជ្រើសបានច្រើនសន្លឹក)' : 'Select Images (Multiple)'}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">JPG, PNG, WEBP</span>
                        </button>

                        {/* Image Previews */}
                        {imagePreviews.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">
                                    {lang === 'kh' ? 'រូបភាព' : 'Images'} ({imagePreviews.length})
                                </p>
                                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto overflow-x-hidden pr-2">
                                    {/* Custom Scrollbar for image grid */}
                                    <style>{`
                                        .image-grid::-webkit-scrollbar {
                                            width: 4px;
                                        }
                                        .image-grid::-webkit-scrollbar-track {
                                            background: transparent;
                                        }
                                        .image-grid::-webkit-scrollbar-thumb {
                                            background: #cbd5e1;
                                            border-radius: 2px;
                                        }
                                        .image-grid::-webkit-scrollbar-thumb:hover {
                                            background: #94a3b8;
                                        }
                                    `}</style>

                                    <div className="image-grid col-span-4 grid grid-cols-4 gap-2">
                                        {imagePreviews.map((url, index) => (
                                            <div
                                                key={index}
                                                className="group relative aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-200 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600"
                                            >
                                                <img
                                                    src={url}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />

                                                {/* Overlay */}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

                                                {/* Delete Button - ALWAYS VISIBLE */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-0 right-0 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 z-50 border-2 border-white"
                                                    title={lang === 'kh' ? "លុបរូបភាព" : "Delete"}
                                                    aria-label={`Remove image ${index}`}
                                                >
                                                    <X size={16} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map Link */}
                    <div>
                        <label className={labelClasses}>តំណភ្ជាប់ផែនទី (Map Link)</label>
                        <p className="text-[10px] text-slate-400 mb-1">
                            {lang === 'kh'
                                ? "ចូលទៅកាន់ Google Maps > Share > Embed a map > Copy HTML"
                                : "Go to Google Maps > Share > Embed a map > Copy HTML"}
                        </p>
                        <input
                            type="text"
                            value={formData.location_map_link}
                            onChange={(e) => setFormData({ ...formData, location_map_link: e.target.value })}
                            className={inputClasses}
                            placeholder={lang === 'kh' ? "បិទភ្ជាប់ Embed Code ពី Google Maps នៅទីនេះ..." : "Paste Google Maps embed code here..."}
                        />

                        {formData.location_map_link && (
                            <div className="mt-3 w-full h-40 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                                <iframe
                                    src={mapSrc}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    title="Map Preview"
                                    loading="lazy"
                                />
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelClasses}>ការពិពណ៌នា</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={lang === 'kh' ? "បង្ហាញព័ត៌មានលម្អិតអំពីអចលនទ្រព្យ..." : "Describe your property..."}
                            className={`${inputClasses} resize-none`}
                            rows={3}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? (lang === 'kh' ? 'រក្សាទុក...' : 'Saving...') : (lang === 'kh' ? 'រក្សាទុក' : 'Save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}