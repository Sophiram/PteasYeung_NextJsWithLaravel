'use client';

import React, { useState, useEffect } from 'react';
import { useGetOwnerRoomsQuery, useDeleteOwnerRoomMutation } from '@/store/api/roomsApi';
import { Loader2, Home, LayoutGrid, Pencil, Trash2, Plus, Building2, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';
import RoomModal from '@/app/components/RoomModal';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';
import type { Room } from '@/types/room';

export default function OwnerRoomsPage() {
    const [lang, setLang] = useState<'kh' | 'en'>('kh');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<number | null>(null);

    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    const { data: rooms = [], isLoading: loading, refetch: fetchRooms } = useGetOwnerRoomsQuery();
    const [deleteOwnerRoom, { isLoading: isDeleting }] = useDeleteOwnerRoomMutation();

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') as 'kh' | 'en';
        if (savedLang) setLang(savedLang);
    }, []);

    const t = {
        kh: {
            loading: 'កំពុងទាញយកទិន្នន័យបន្ទប់ជួល...',
            title: 'បញ្ជីគ្រប់គ្រងបន្ទប់ជួលទាំងអស់',
            subtitle: 'គ្រប់គ្រងព័ត៌មាន បន្ទប់ទំនេរ និងតម្លៃជួល',
            addBtn: 'បន្ថែមបន្ទប់ថ្មី',
            thRoom: 'លេខបន្ទប់ / អចលនទ្រព្យ',
            thType: 'ប្រភេទបន្ទប់',
            thPrice: 'តម្លៃប្រចាំខែ',
            thDeposit: 'ប្រាក់កក់', // 🟢 បន្ថែមចំនងជើង Column ប្រាក់កក់
            thStatus: 'ស្ថានភាព',
            thAction: 'សកម្មភាព',
            noData: 'មិនទាន់មានទិន្នន័យបន្ទប់ក្នុងប្រព័ន្ធនៅឡើយទេ។',
            available: 'ទំនេរ',
            occupied: 'មានអ្នកជួល',
            maintenance: 'កំពុងជួសជុល',
            notSet: 'មិនបានកំណត់',
            editTitle: 'កែប្រែព័ត៌មាន',
            deleteTitle: 'លុបបន្ទប់',
            toastAdding: 'កំពុងបើកទម្រង់បន្ថែមបន្ទប់ថ្មី...',
            toastEditing: 'កំពុងកែប្រែបន្ទប់លេខ៖',
            deleteSuccess: 'បានលុបបន្ទប់ជួលដោយជោគជ័យ!',
            deleteFailed: 'ការលុបបន្ទប់បានបរាជ័យ សូមព្យាយាមម្តងទៀត។'
        },
        en: {
            loading: 'Loading room data...',
            title: 'All Rooms Management',
            subtitle: 'Manage room details, availability, and rental prices',
            addBtn: 'Add New Room',
            thRoom: 'Room No. / Property',
            thType: 'Room Type',
            thPrice: 'Monthly Price',
            thDeposit: 'Deposit', // 🟢 Deposit Header
            thStatus: 'Status',
            thAction: 'Actions',
            noData: 'No room data available in the system.',
            available: 'Available',
            occupied: 'Occupied',
            maintenance: 'Maintenance',
            notSet: 'Not Set',
            editTitle: 'Edit Info',
            deleteTitle: 'Delete Room',
            toastAdding: 'Opening add room form...',
            toastEditing: 'Editing room number:',
            deleteSuccess: 'Room deleted successfully!',
            deleteFailed: 'Failed to delete room. Please try again.'
        }
    };

    const handleDeleteClick = (id: number) => {
        setRoomToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!roomToDelete) return;

        try {
            await deleteOwnerRoom(roomToDelete).unwrap();
            toast.success(t[lang].deleteSuccess);
        } catch (error) {
            console.error("Error deleting room:", error);
            toast.error(t[lang].deleteFailed);
        } finally {
            setIsDeleteModalOpen(false);
            setRoomToDelete(null);
        }
    };

    const handleAddRoom = () => {
        setSelectedRoom(null);
        setIsRoomModalOpen(true);
        toast(t[lang].toastAdding, { icon: <Pencil size={16} className="text-indigo-500" /> });
    };

    const handleEditRoom = (room: Room) => {
        setSelectedRoom(room);
        setIsRoomModalOpen(true);
        toast.success(`${t[lang].toastEditing} ${room.room_number}`);
    };

    const getStatusBadgeClass = (status?: string | null) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'available':
                return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-900/30';
            case 'occupied':
                return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/30 dark:border-amber-900/30';
            case 'maintenance':
                return 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/30 dark:border-rose-900/30';
            default:
                return 'bg-slate-50 text-slate-700';
        }
    };

    const getStatusDotClass = (status?: string | null) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'available': return 'bg-emerald-500';
            case 'occupied': return 'bg-amber-500';
            case 'maintenance': return 'bg-rose-500';
            default: return 'bg-slate-400';
        }
    };

    const getStatusText = (status?: string | null) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'available': return t[lang].available;
            case 'occupied': return t[lang].occupied;
            case 'maintenance': return t[lang].maintenance;
            default: return t[lang].notSet;
        }
    };

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t[lang].title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">សរុប៖ {rooms.length} បន្ទប់</p>
                </div>
                <button
                    onClick={handleAddRoom}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition duration-200"
                >
                    <Plus size={16} />
                    {t[lang].addBtn}
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-200 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">{t[lang].thRoom}</th>
                                <th className="px-6 py-4">{t[lang].thType}</th>
                                <th className="px-6 py-4">{t[lang].thPrice}</th>
                                <th className="px-6 py-4">{t[lang].thDeposit}</th>
                                <th className="px-6 py-4">{t[lang].thStatus}</th>
                                <th className="px-6 py-4 text-center">{t[lang].thAction}</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                            {rooms.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <LayoutGrid size={32} className="text-slate-300 dark:text-slate-700" />
                                            <span>{t[lang].noData}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                rooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition duration-150">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                    {room.images && room.images.length > 0 ? (
                                                        <img
                                                            src={getOptimizedImageUrl(room.images[0]?.image_path || room.images[0]?.image_url) || "https://placehold.co/150x150?text=No+Image"}
                                                            alt={room.room_number}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "https://placehold.co/150x150?text=No+Image";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="text-indigo-600 dark:text-indigo-400">
                                                            <Home size={20} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        {room.room_number} {room.floor && <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(ជាន់ {room.floor})</span>}
                                                    </div>
                                                    {room.property && (
                                                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                            <Building2 size={12} className="text-slate-400" />
                                                            {room.property.title}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium">
                                                <LayoutGrid size={12} className="text-slate-400" />
                                                {room.type || t[lang].notSet}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                ${parseFloat((room.price || 0) as string).toFixed(2)}
                                            </span>
                                        </td>

                                        {/* 🟢 បង្ហាញតម្លៃកក់ (Deposit) */}
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                {room.deposit ? `$${parseFloat(room.deposit as string).toFixed(2)}` : '-'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(room.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(room.status)}`} />
                                                {getStatusText(room.status)}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditRoom(room)}
                                                    title={t[lang].editTitle}
                                                    className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition duration-150"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteClick(room.id)}
                                                    disabled={isDeleting && roomToDelete === room.id}
                                                    title={t[lang].deleteTitle}
                                                    className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition duration-150 disabled:opacity-50"
                                                >
                                                    {isDeleting && roomToDelete === room.id ? (
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

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title={lang === 'kh' ? "តើអ្នកពិតជាចង់លុបបន្ទប់ជួលនេះមែនទេ?" : "Are you sure you want to delete this room?"}
                message={lang === 'kh' ? "ទិន្នន័យបន្ទប់នេះនឹងត្រូវលុបចេញពីប្រព័ន្ធជាអចិន្ត្រៃយ៍ ហើយមិនអាចទាញយកមកវិញបានឡើយ។" : "This room data will be permanently removed from the system and cannot be recovered."}
                confirmText={isDeleting ? (lang === 'kh' ? "កំពុងលុប..." : "Deleting...") : (lang === 'kh' ? "លុបចោល" : "Delete")}
                cancelText={lang === 'kh' ? "បោះបង់" : "Cancel"}
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    if (!isDeleting) {
                        setIsDeleteModalOpen(false);
                        setRoomToDelete(null);
                    }
                }}
            />

            <RoomModal
                isOpen={isRoomModalOpen}
                room={selectedRoom}
                onClose={() => setIsRoomModalOpen(false)}
                onRefresh={fetchRooms}
            />
        </div>
    );
}