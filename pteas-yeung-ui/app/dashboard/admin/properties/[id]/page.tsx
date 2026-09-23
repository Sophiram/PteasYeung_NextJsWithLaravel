'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, MapPin, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface PropertyDetail {
    id: number;
    title: string;
    description: string;
    address: string;
    city: string;
    rooms_count?: number;
    owner?: {
        name: string;
        email: string;
    };
}

export default function PropertyDetailPage() {
    const params = useParams(); // ចាប់យក ID ពី URL (ឧទាហរណ៍៖ /properties/5)
    const router = useRouter();
    const [property, setProperty] = useState<PropertyDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPropertyDetail = async () => {
            try {
                const response = await api.get(`/admin/properties/${params.id}`);
                setProperty(response.data);
            } catch (err) {
                console.error(err);
                setError("មិនអាចទាញយកព័ត៌មានលម្អិតនៃអចលនទ្រព្យនេះបានទេ!");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchPropertyDetail();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 w-full">
                <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <p>{error || "រកមិនឃើញទិន្នន័យ!"}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full">
            {/* ប៊ូតុងត្រឡប់ក្រោយ */}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition">
                <ArrowLeft className="w-4 h-4" /> ត្រឡប់ក្រោយ
            </button>

            {/* បង្ហាញព័ត៌មានលម្អិត */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{property.title}</h1>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{property.address}, {property.city}</span>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                <div>
                    <h3 className="text-sm font-semibold text-slate-400 mb-1">ការពិពណ៌នា</h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{property.description || 'គ្មានការពិពណ៌នាឡើយ។'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-xs text-slate-400 block mb-1">ចំនួនបន្ទប់សរុប</span>
                        <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{property.rooms_count ?? 0} បន្ទប់</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-xs text-slate-400 block mb-1">ម្ចាស់អចលនទ្រព្យ (Owner)</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{property.owner?.name || 'មិនស្គាល់'} ({property.owner?.email || 'គ្មាន'})</span>
                    </div>
                </div>
            </div>
        </div>
    );
}