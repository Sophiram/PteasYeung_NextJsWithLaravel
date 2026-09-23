'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
    DoorOpen, Search, Filter, RefreshCw, CheckCircle2, Clock, Wrench,
    Building2, DollarSign, AlertCircle, Loader2, Edit2, ShieldAlert
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Room {
    id: number;
    room_number: string;
    type: string;
    price: number;
    status: 'available' | 'occupied' | 'maintenance';
    property?: {
        id: number;
        title: string;
        address: string;
    };
}

export default function StaffRoomsPage() {
    const { hasPermission } = useAuth();
    const canUpdateStatus = hasPermission('rooms.status_update');

    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [lang, setLang] = useState<'kh' | 'en'>('kh');

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/staff/rooms');
            setRooms(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (err) {
            console.error('Error fetching rooms:', err);
            toast.error(lang === 'kh' ? 'មិនអាចទាញយកបញ្ជីបន្ទប់បានទេ' : 'Failed to fetch rooms');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (roomId: number, newStatus: 'available' | 'occupied' | 'maintenance') => {
        if (!canUpdateStatus) {
            toast.error(lang === 'kh' ? 'អ្នកគ្មានសិទ្ធិកែប្រែស្ថានភាពបន្ទប់ឡើយ!' : 'Permission denied for updating room status!');
            return;
        }

        setUpdatingId(roomId);
        try {
            await api.patch(`/staff/rooms/${roomId}/status`, { status: newStatus });
            setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
            toast.success(lang === 'kh' ? `បានប្តូរស្ថានភាពបន្ទប់ទៅជា ${newStatus} ជោគជ័យ!` : `Room status updated to ${newStatus}!`);
        } catch (err: any) {
            console.error('Error updating status:', err);
            toast.error(err.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការកែប្រែស្ថានភាពបន្ទប់!' : 'Failed to update status!'));
        } finally {
            setUpdatingId(null);
        }
    };

    const isKh = lang === 'kh';

    const filteredRooms = useMemo(() => {
        return rooms.filter(r => {
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
            const query = searchTerm.toLowerCase();
            const matchesSearch = !query || 
                r.room_number.toLowerCase().includes(query) ||
                (r.property?.title && r.property.title.toLowerCase().includes(query)) ||
                (r.type && r.type.toLowerCase().includes(query));
            return matchesStatus && matchesSearch;
        });
    }, [rooms, statusFilter, searchTerm]);

    const counts = useMemo(() => ({
        all: rooms.length,
        available: rooms.filter(r => r.status === 'available').length,
        occupied: rooms.filter(r => r.status === 'occupied').length,
        maintenance: rooms.filter(r => r.status === 'maintenance').length,
    }), [rooms]);

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <DoorOpen className="text-sky-600" />
                        <span>{isKh ? 'ត្រួតពិនិត្យបន្ទប់ & ស្ថានភាព' : 'Room Status Management'}</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {isKh ? 'ត្រួតពិនិត្យ និងកែប្រែស្ថានភាពបន្ទប់ទំនេរ បន្ទប់ជួល ឬកំពុងជួសជុល' : 'Inspect properties and update room availability in real time'}
                    </p>
                </div>

                <button
                    onClick={fetchRooms}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>{isKh ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
                </button>
            </div>

            {/* Permission Notice */}
            {!canUpdateStatus && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
                    <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                    <span>{isKh ? 'ចំណាំ៖ គណនីរបស់អ្នកមានសិទ្ធិត្រឹមតែ "មើល" បន្ទប់ប៉ុណ្ណោះ មិនអាចកែប្រែស្ថានភាពបន្ទប់បានឡើយ។' : 'Notice: Your staff account has view-only access. You cannot modify room statuses.'}</span>
                </div>
            )}

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                            statusFilter === 'all'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span>{isKh ? 'ទាំងអស់' : 'All'}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            {counts.all}
                        </span>
                    </button>

                    <button
                        onClick={() => setStatusFilter('available')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                            statusFilter === 'available'
                                ? 'bg-emerald-600 text-white'
                                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                    >
                        <CheckCircle2 size={13} />
                        <span>{isKh ? 'ទំនេរ' : 'Available'}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                            {counts.available}
                        </span>
                    </button>

                    <button
                        onClick={() => setStatusFilter('occupied')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                            statusFilter === 'occupied'
                                ? 'bg-indigo-600 text-white'
                                : 'text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                        }`}
                    >
                        <Clock size={13} />
                        <span>{isKh ? 'មានភ្ញៀវ' : 'Occupied'}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100">
                            {counts.occupied}
                        </span>
                    </button>

                    <button
                        onClick={() => setStatusFilter('maintenance')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                            statusFilter === 'maintenance'
                                ? 'bg-amber-600 text-white'
                                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        }`}
                    >
                        <Wrench size={13} />
                        <span>{isKh ? 'ជួសជុល' : 'Maintenance'}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                            {counts.maintenance}
                        </span>
                    </button>
                </div>

                {/* Search Box */}
                <div className="relative min-w-[220px]">
                    <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={isKh ? 'ស្វែងរកលេខបន្ទប់ ឬអគារ...' : 'Search room # or property...'}
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                    />
                </div>
            </div>

            {/* Room List Grid */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                    <p className="text-xs font-semibold">{isKh ? 'កំពុងទាញយកបញ្ជីបន្ទប់...' : 'Loading rooms...'}</p>
                </div>
            ) : filteredRooms.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 gap-2">
                    <DoorOpen size={40} className="stroke-[1.5] text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-bold text-slate-500">{isKh ? 'មិនមានបន្ទប់ត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ' : 'No rooms match filter criteria'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRooms.map((room) => {
                        const isUpdating = updatingId === room.id;

                        return (
                            <div
                                key={room.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 space-y-3 hover:border-slate-300 transition"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-black text-lg text-slate-900 dark:text-white">
                                                #{room.room_number}
                                            </span>
                                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                                                {room.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                                            <Building2 size={12} className="shrink-0 text-sky-500" />
                                            <span className="truncate">{room.property?.title || 'Unknown Property'}</span>
                                        </p>
                                    </div>

                                    {/* Current Status Badge */}
                                    <div className="shrink-0">
                                        {room.status === 'available' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-black uppercase border border-emerald-200 dark:border-emerald-800">
                                                <CheckCircle2 size={12} />
                                                <span>{isKh ? 'ទំនេរ' : 'Available'}</span>
                                            </span>
                                        ) : room.status === 'occupied' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[11px] font-black uppercase border border-indigo-200 dark:border-indigo-800">
                                                <Clock size={12} />
                                                <span>{isKh ? 'មានភ្ញៀវ' : 'Occupied'}</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[11px] font-black uppercase border border-amber-200 dark:border-amber-800">
                                                <Wrench size={12} />
                                                <span>{isKh ? 'ជួសជុល' : 'Maintenance'}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                    <span className="text-slate-400">{isKh ? 'តម្លៃជួលប្រចាំខែ:' : 'Monthly Rent:'}</span>
                                    <span className="font-black text-slate-900 dark:text-white">
                                        ${room.price}/ខែ
                                    </span>
                                </div>

                                {/* Status Switch Action Buttons */}
                                {canUpdateStatus && (
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            {isKh ? 'ប្តូរស្ថានភាពបន្ទប់៖' : 'Update Status:'}
                                        </p>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            <button
                                                onClick={() => handleUpdateStatus(room.id, 'available')}
                                                disabled={isUpdating || room.status === 'available'}
                                                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                                                    room.status === 'available'
                                                        ? 'bg-emerald-600 text-white font-black'
                                                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                                                } disabled:opacity-50`}
                                            >
                                                <span>{isKh ? 'ទំនេរ' : 'Avail'}</span>
                                            </button>

                                            <button
                                                onClick={() => handleUpdateStatus(room.id, 'occupied')}
                                                disabled={isUpdating || room.status === 'occupied'}
                                                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                                                    room.status === 'occupied'
                                                        ? 'bg-indigo-600 text-white font-black'
                                                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100'
                                                } disabled:opacity-50`}
                                            >
                                                <span>{isKh ? 'មានភ្ញៀវ' : 'Occ'}</span>
                                            </button>

                                            <button
                                                onClick={() => handleUpdateStatus(room.id, 'maintenance')}
                                                disabled={isUpdating || room.status === 'maintenance'}
                                                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                                                    room.status === 'maintenance'
                                                        ? 'bg-amber-600 text-white font-black'
                                                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                                                } disabled:opacity-50`}
                                            >
                                                <span>{isKh ? 'ជួសជុល' : 'Maint'}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
