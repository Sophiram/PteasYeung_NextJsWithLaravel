'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Lock, Unlock, AlertCircle, CheckCircle2, Search, RefreshCw, Clock, 
    UserCheck, Shield, Key, X, Check, Filter, UserCog, Sparkles, Loader2
} from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import ConfirmModal from '@/app/components/ConfirmModal';
import toast, { Toaster } from 'react-hot-toast';

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
    status: 'active' | 'inactive' | 'pending';
    created_at?: string;
}

interface PermissionItem {
    id: number;
    name: string;
    slug: string;
    group: string;
    description?: string;
}

const ROLE_OPTIONS = [
    { value: 'super_admin', labelKh: 'Super Admin (អ្នកគ្រប់គ្រងកំពូល)', labelEn: 'Super Admin' },
    { value: 'owner', labelKh: 'Owner (ម្ចាស់ផ្ទះ/អគារ)', labelEn: 'Property Owner' },
    { value: 'staff', labelKh: 'Staff (បុគ្គលិក)', labelEn: 'Staff' },
    { value: 'tenant', labelKh: 'Tenant (អ្នកជួល)', labelEn: 'Tenant' },
];

const GROUP_LABELS: Record<string, { kh: string; en: string }> = {
    properties: { kh: 'អចលនទ្រព្យ (Properties)', en: 'Properties' },
    rooms: { kh: 'បន្ទប់ (Rooms)', en: 'Rooms' },
    bookings: { kh: 'ការកក់ (Bookings)', en: 'Bookings' },
    invoices: { kh: 'វិក្កយបត្រ (Invoices)', en: 'Invoices' },
    expenses: { kh: 'ចំណាយ (Expenses)', en: 'Expenses' },
    staff: { kh: 'បុគ្គលិក (Staff)', en: 'Staff' },
    reports: { kh: 'របាយការណ៍ (Reports)', en: 'Reports' },
    users: { kh: 'អ្នកប្រើប្រាស់ (Users)', en: 'Users' },
    audit_logs: { kh: 'កំណត់ត្រាសុវត្ថិភាព (Audit Logs)', en: 'Security Audit Logs' },
    settings: { kh: 'ការកំណត់ប្រព័ន្ធ (Settings)', en: 'System Settings' },
};

export default function AdminUsersPage() {
    const { language } = useLanguage();
    const isKh = language === 'kh';

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtering & Searching
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Status Modal state
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [targetAction, setTargetAction] = useState<'approve' | 'lock' | 'unlock'>('approve');

    // Role Modal state
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [targetRoleUser, setTargetRoleUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState<string>('');
    const [updatingRole, setUpdatingRole] = useState(false);

    // Permission Modal state
    const [isPermModalOpen, setIsPermModalOpen] = useState(false);
    const [targetPermUser, setTargetPermUser] = useState<User | null>(null);
    const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
    const [groupedPermissions, setGroupedPermissions] = useState<Record<string, PermissionItem[]>>({});
    const [userDirectPerms, setUserDirectPerms] = useState<string[]>([]);
    const [userEffectivePerms, setUserEffectivePerms] = useState<string[]>([]);
    const [loadingPerms, setLoadingPerms] = useState(false);
    const [savingPerms, setSavingPerms] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/admin/users');
            setUsers(Array.isArray(response.data) ? response.data : response.data.users || []);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError(isKh ? "មិនអាចទាញយកទិន្នន័យអ្នកប្រើប្រាស់។" : "Failed to load user accounts.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filtered users list
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesSearch = !searchTerm || 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.phone && user.phone.includes(searchTerm));
            return matchesStatus && matchesRole && matchesSearch;
        });
    }, [users, statusFilter, roleFilter, searchTerm]);

    // Counts for tabs
    const counts = useMemo(() => ({
        all: users.length,
        pending: users.filter(u => u.status === 'pending').length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
    }), [users]);

    // Trigger status change modal
    const handleTriggerStatusModal = (user: User, action: 'approve' | 'lock' | 'unlock') => {
        setSelectedUser(user);
        setTargetAction(action);
        setIsStatusModalOpen(true);
    };

    const handleConfirmStatusChange = async () => {
        if (!selectedUser) return;

        let nextStatus: 'active' | 'inactive' | 'pending' = 'active';
        if (targetAction === 'lock') nextStatus = 'inactive';
        else if (targetAction === 'unlock' || targetAction === 'approve') nextStatus = 'active';

        try {
            await api.put(`/admin/users/${selectedUser.id}/status`, {
                status: nextStatus
            });
            await fetchUsers();
            
            if (targetAction === 'approve') {
                toast.success(isKh ? `បានអនុម័ត និងបើកដំណើរការគណនី ${selectedUser.name} ជោគជ័យ!` : `Account ${selectedUser.name} approved and activated!`);
            } else {
                toast.success(isKh ? "ធ្វើបច្ចុប្បន្នភាពស្ថានភាពជោគជ័យ!" : "Status updated successfully!");
            }
        } catch (err) {
            console.error("Error updating status:", err);
            toast.error(isKh ? "បរាជ័យក្នុងការកែប្រែស្ថានភាព!" : "Failed to update status!");
        } finally {
            setIsStatusModalOpen(false);
            setSelectedUser(null);
        }
    };

    // Open Role Change Modal
    const handleOpenRoleModal = (user: User) => {
        setTargetRoleUser(user);
        setNewRole(user.role);
        setIsRoleModalOpen(true);
    };

    const handleConfirmRoleChange = async () => {
        if (!targetRoleUser || !newRole || newRole === targetRoleUser.role) {
            setIsRoleModalOpen(false);
            return;
        }

        setUpdatingRole(true);
        try {
            await api.put(`/admin/users/${targetRoleUser.id}/role`, {
                role: newRole
            });
            toast.success(isKh ? `បានផ្លាស់ប្តូរតួនាទីទៅជា ${newRole} ដោយជោគជ័យ!` : `Role updated to ${newRole} successfully!`);
            await fetchUsers();
            setIsRoleModalOpen(false);
            setTargetRoleUser(null);
        } catch (err: any) {
            console.error("Error updating role:", err);
            toast.error(err.response?.data?.message || (isKh ? "មិនអាចផ្លាស់ប្តូរតួនាទីបានទេ!" : "Failed to update user role!"));
        } finally {
            setUpdatingRole(false);
        }
    };

    // Open Permission Modal
    const handleOpenPermissionModal = async (user: User) => {
        setTargetPermUser(user);
        setIsPermModalOpen(true);
        setLoadingPerms(true);

        try {
            // 1. Fetch system permissions if not cached
            if (allPermissions.length === 0) {
                const sysPermsRes = await api.get('/admin/permissions');
                setAllPermissions(sysPermsRes.data.permissions || []);
                setGroupedPermissions(sysPermsRes.data.grouped || {});
            }

            // 2. Fetch user's direct and effective permissions
            const userPermsRes = await api.get(`/admin/users/${user.id}/permissions`);
            setUserDirectPerms(userPermsRes.data.direct_permissions || []);
            setUserEffectivePerms(userPermsRes.data.effective_permissions || []);
        } catch (err) {
            console.error("Error loading permissions:", err);
            toast.error(isKh ? "មិនអាចទាញយកទិន្នន័យសិទ្ធិបានទេ!" : "Failed to load user permissions!");
        } finally {
            setLoadingPerms(false);
        }
    };

    const handleTogglePermission = (slug: string) => {
        setUserDirectPerms(prev => 
            prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
        );
    };

    const handleToggleGroup = (groupPerms: PermissionItem[]) => {
        const slugs = groupPerms.map(p => p.slug);
        const allSelected = slugs.every(s => userDirectPerms.includes(s));

        if (allSelected) {
            // Deselect group
            setUserDirectPerms(prev => prev.filter(s => !slugs.includes(s)));
        } else {
            // Select all in group
            setUserDirectPerms(prev => Array.from(new Set([...prev, ...slugs])));
        }
    };

    const handleSavePermissions = async () => {
        if (!targetPermUser) return;

        setSavingPerms(true);
        try {
            await api.put(`/admin/users/${targetPermUser.id}/permissions`, {
                permissions: userDirectPerms
            });
            toast.success(isKh ? "បានរក្សាទុកសិទ្ធិផ្ទាល់ខ្លួនដោយជោគជ័យ!" : "Permissions updated and saved!");
            setIsPermModalOpen(false);
            setTargetPermUser(null);
        } catch (err: any) {
            console.error("Error saving permissions:", err);
            toast.error(err.response?.data?.message || (isKh ? "មិនអាចរក្សាទុកសិទ្ធិបានទេ!" : "Failed to save permissions!"));
        } finally {
            setSavingPerms(false);
        }
    };

    const renderStatusBadge = (status: string) => {
        if (status === 'active') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 rounded-full">
                    <span className="w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                    {isKh ? 'សកម្ម' : 'Active'}
                </span>
            );
        } else if (status === 'pending') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 border border-amber-300/60 dark:border-amber-800/60 rounded-full animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    {isKh ? 'រង់ចាំអនុម័ត' : 'Pending'}
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/40 rounded-full">
                    <span className="w-2 h-2 bg-rose-600 dark:bg-rose-400 rounded-full" />
                    {isKh ? 'ផ្អាក' : 'Inactive'}
                </span>
            );
        }
    };

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            <Toaster position="top-right" reverseOrder={false} />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                <div className="min-w-0 flex-1 break-words">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {isKh ? 'គ្រប់គ្រងអ្នកប្រើប្រាស់ & សិទ្ធិ' : 'User Management & Permissions'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isKh ? 'ត្រួតពិនិត្យ អនុម័តគណនីថ្មី កំណត់តួនាទី និងបែងចែកសិទ្ធិលម្អិត' : 'Review, approve registrations, assign roles, and configure granular permissions'}
                    </p>
                </div>
                <button
                    onClick={() => fetchUsers()}
                    className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center gap-2 text-sm flex-shrink-0 shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>{isKh ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
                </button>
            </div>

            {/* Status & Role Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${statusFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <span>{isKh ? 'ទាំងអស់' : 'All'}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            {counts.all}
                        </span>
                    </button>

                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'}`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isKh ? 'រង់ចាំអនុម័ត' : 'Pending'}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold">
                            {counts.pending}
                        </span>
                    </button>

                    <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <span>{isKh ? 'សកម្ម' : 'Active'}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            {counts.active}
                        </span>
                    </button>

                    <button
                        onClick={() => setStatusFilter('inactive')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${statusFilter === 'inactive' ? 'bg-rose-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <span>{isKh ? 'ផ្អាក' : 'Inactive'}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            {counts.inactive}
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Role Filter */}
                    <div className="relative">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            aria-label={isKh ? 'ជ្រើសរើសតួនាទី' : 'Filter by role'}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                        >
                            <option value="all">{isKh ? 'គ្រប់តួនាទី' : 'All Roles'}</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="owner">Owner</option>
                            <option value="staff">Staff</option>
                            <option value="tenant">Tenant</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={isKh ? 'ស្វែងរកតាមឈ្មោះ ឬអ៊ីមែល...' : 'Search name or email...'}
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg w-full">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-rose-900 dark:text-rose-100 text-sm break-words">{error}</p>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full shadow-sm">
                    <div className="w-9 h-9 border-4 border-slate-200 dark:border-slate-700 border-t-rose-600 rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{isKh ? 'កំពុងផ្ទុកទិន្នន័យ...' : 'Loading users...'}</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full shadow-sm">
                    <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center font-medium">
                        {isKh ? 'មិនមានទិន្នន័យអ្នកប្រើប្រាស់ដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ។' : 'No user accounts match the current filter.'}
                    </p>
                </div>
            )}

            {/* Table View - Desktop */}
            {!loading && filteredUsers.length > 0 && (
                <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm w-full">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-slate-900 dark:text-slate-100">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">ID</th>
                                    <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">{isKh ? 'ឈ្មោះ' : 'Name'}</th>
                                    <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">{isKh ? 'អ៊ីមែល' : 'Email'}</th>
                                    <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">{isKh ? 'តួនាទី' : 'Role'}</th>
                                    <th className="px-6 py-4 text-center font-semibold whitespace-nowrap">{isKh ? 'ស្ថានភាព' : 'Status'}</th>
                                    <th className="px-6 py-4 text-center font-semibold whitespace-nowrap">{isKh ? 'សិទ្ធិ & សកម្មភាព' : 'Permissions & Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">#{user.id}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleOpenRoleModal(user)}
                                                className={`group inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase rounded-lg border transition hover:shadow-sm ${
                                                    user.role === 'super_admin' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300' :
                                                    user.role === 'owner' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300' :
                                                    user.role === 'staff' ? 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/50 dark:border-sky-800 dark:text-sky-300' :
                                                    'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                                                }`}
                                                title={isKh ? 'ចុចដើម្បីប្តូរតួនាទី' : 'Click to change role'}
                                            >
                                                <span>{user.role}</span>
                                                <UserCog className="w-3 h-3 opacity-60 group-hover:opacity-100 transition" />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {renderStatusBadge(user.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Permissions Button */}
                                                <button
                                                    onClick={() => handleOpenPermissionModal(user)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800/80 transition shadow-xs"
                                                    title={isKh ? 'កំណត់សិទ្ធិលម្អិត' : 'Configure granular permissions'}
                                                >
                                                    <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                    <span>{isKh ? 'សិទ្ធិ' : 'Permissions'}</span>
                                                </button>

                                                {/* Status Toggle Action */}
                                                {user.status === 'pending' ? (
                                                    <button
                                                        onClick={() => handleTriggerStatusModal(user, 'approve')}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition group"
                                                        title={isKh ? 'អនុម័ត និងបើកដំណើរការគណនី' : 'Approve and activate user account'}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>{isKh ? 'អនុម័ត' : 'Approve'}</span>
                                                    </button>
                                                ) : user.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleTriggerStatusModal(user, 'lock')}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-semibold transition"
                                                        title={isKh ? 'ចាក់សោគណនីនេះ' : 'Lock this account'}
                                                    >
                                                        <Lock className="w-3.5 h-3.5" />
                                                        <span>{isKh ? 'ចាក់សោ' : 'Lock'}</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleTriggerStatusModal(user, 'unlock')}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold transition"
                                                        title={isKh ? 'បើកសោគណនីនេះ' : 'Unlock this account'}
                                                    >
                                                        <Unlock className="w-3.5 h-3.5" />
                                                        <span>{isKh ? 'បើកសោ' : 'Unlock'}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Card View - Mobile */}
            {!loading && filteredUsers.length > 0 && (
                <div className="md:hidden space-y-3 w-full max-w-full">
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 w-full min-w-0 overflow-hidden shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3 w-full">
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-base text-slate-900 dark:text-slate-100 truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                        #{user.id} • {user.email}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleOpenRoleModal(user)}
                                    className="px-2.5 py-1 text-xs font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap flex-shrink-0 flex items-center gap-1"
                                >
                                    <span>{user.role}</span>
                                    <UserCog className="w-3 h-3 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 gap-2 w-full">
                                <div className="flex-shrink-0">
                                    {renderStatusBadge(user.status)}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenPermissionModal(user)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800/80"
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>{isKh ? 'សិទ្ធិ' : 'Permissions'}</span>
                                    </button>

                                    {user.status === 'pending' ? (
                                        <button
                                            onClick={() => handleTriggerStatusModal(user, 'approve')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex-shrink-0"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>{isKh ? 'អនុម័ត' : 'Approve'}</span>
                                        </button>
                                    ) : user.status === 'active' ? (
                                        <button
                                            onClick={() => handleTriggerStatusModal(user, 'lock')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-semibold transition flex-shrink-0"
                                        >
                                            <Lock className="w-3.5 h-3.5" />
                                            <span>{isKh ? 'ចាក់សោ' : 'Lock'}</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleTriggerStatusModal(user, 'unlock')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold transition flex-shrink-0"
                                        >
                                            <Unlock className="w-3.5 h-3.5" />
                                            <span>{isKh ? 'បើកសោ' : 'Unlock'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal: Change Role */}
            {isRoleModalOpen && targetRoleUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <UserCog className="text-rose-600 w-5 h-5" />
                                <span>{isKh ? 'ផ្លាស់ប្តូរតួនាទីអ្នកប្រើប្រាស់' : 'Change User Role'}</span>
                            </h3>
                            <button onClick={() => setIsRoleModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="py-4 space-y-4">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{isKh ? 'គណនីអ្នកប្រើប្រាស់:' : 'Target Account:'}</p>
                                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{targetRoleUser.name} ({targetRoleUser.email})</p>
                                <p className="text-xs text-slate-400 mt-0.5">{isKh ? 'តួនាទីបច្ចុប្បន្ន:' : 'Current Role:'} <span className="font-semibold uppercase text-rose-600">{targetRoleUser.role}</span></p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {isKh ? 'ជ្រើសរើសតួនាទីថ្មី' : 'Select New Role'}
                                </label>
                                <div className="space-y-2">
                                    {ROLE_OPTIONS.map((opt) => (
                                        <label
                                            key={opt.value}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                                newRole === opt.value 
                                                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-bold' 
                                                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={opt.value}
                                                    checked={newRole === opt.value}
                                                    onChange={(e) => setNewRole(e.target.value)}
                                                    className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                                                />
                                                <span className="text-xs">{isKh ? opt.labelKh : opt.labelEn}</span>
                                            </div>
                                            {newRole === opt.value && <Check className="w-4 h-4 text-rose-600" />}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setIsRoleModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition"
                            >
                                {isKh ? 'បោះបង់' : 'Cancel'}
                            </button>
                            <button
                                onClick={handleConfirmRoleChange}
                                disabled={updatingRole || newRole === targetRoleUser.role}
                                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                            >
                                {updatingRole && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                <span>{isKh ? 'ផ្លាស់ប្តូរ' : 'Save Role'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Granular Permissions Configuration */}
            {isPermModalOpen && targetPermUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Shield className="text-indigo-600 w-5 h-5" />
                                    <span>{isKh ? 'កំណត់សិទ្ធិលម្អិតអ្នកប្រើប្រាស់' : 'Granular Permissions Manager'}</span>
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {targetPermUser.name} ({targetPermUser.email}) • <span className="uppercase font-bold text-indigo-600 dark:text-indigo-400">{targetPermUser.role}</span>
                                </p>
                            </div>
                            <button onClick={() => setIsPermModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            {targetPermUser.role === 'super_admin' && (
                                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-rose-600 flex-shrink-0" />
                                    <p className="text-xs text-rose-900 dark:text-rose-200 font-medium">
                                        {isKh 
                                            ? 'គណនី Super Admin មានសិទ្ធិពេញលេញលើប្រព័ន្ធទាំងអស់ដោយស្វ័យប្រវត្ត (Bypass Check)។ ការកំណត់ខាងក្រោមអនុវត្តបន្ថែមលើតួនាទី។'
                                            : 'Super Admin accounts automatically possess full system privileges (Bypass Check). Direct assignments complement role defaults.'}
                                    </p>
                                </div>
                            )}

                            {loadingPerms ? (
                                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                    <p className="text-xs font-medium">{isKh ? 'កំពុងទាញយកទិន្នន័យសិទ្ធិ...' : 'Loading permissions...'}</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.entries(groupedPermissions).map(([groupKey, groupPerms]) => {
                                        const groupLabel = GROUP_LABELS[groupKey] || { kh: groupKey, en: groupKey };
                                        const allInGroupSelected = groupPerms.every(p => userDirectPerms.includes(p.slug));

                                        return (
                                            <div key={groupKey} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                                                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                                        <Key className="w-3.5 h-3.5 text-indigo-500" />
                                                        {isKh ? groupLabel.kh : groupLabel.en}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleGroup(groupPerms)}
                                                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                    >
                                                        {allInGroupSelected 
                                                            ? (isKh ? 'ដោះការជ្រើសរើស' : 'Deselect All') 
                                                            : (isKh ? 'ជ្រើសរើសទាំងអស់' : 'Select All')}
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    {groupPerms.map((perm) => {
                                                        const isDirectlyChecked = userDirectPerms.includes(perm.slug);
                                                        const isRoleEffective = userEffectivePerms.includes(perm.slug) && !isDirectlyChecked;

                                                        return (
                                                            <label
                                                                key={perm.slug}
                                                                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition text-xs select-none ${
                                                                    isDirectlyChecked
                                                                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100'
                                                                        : isRoleEffective
                                                                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-slate-700 dark:text-slate-300'
                                                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isDirectlyChecked}
                                                                    onChange={() => handleTogglePermission(perm.slug)}
                                                                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="font-bold font-mono text-[11px] text-slate-900 dark:text-slate-100">
                                                                            {perm.slug}
                                                                        </span>
                                                                        {isRoleEffective && (
                                                                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold">
                                                                                {isKh ? 'តាមតួនាទី' : 'Role Default'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                                                        {perm.name}
                                                                    </p>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {isKh ? `បានជ្រើសរើស ${userDirectPerms.length} សិទ្ធិផ្ទាល់ខ្លួន` : `${userDirectPerms.length} direct permissions selected`}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsPermModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition"
                                >
                                    {isKh ? 'បោះបង់' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleSavePermissions}
                                    disabled={savingPerms || loadingPerms}
                                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                >
                                    {savingPerms && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{isKh ? 'រក្សាទុកសិទ្ធិ' : 'Save Permissions'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirm Modal for Status (Approve / Lock / Unlock) */}
            <ConfirmModal
                isOpen={isStatusModalOpen}
                title={
                    targetAction === 'approve'
                        ? (isKh ? "អនុម័ត និងបើកដំណើរការគណនី" : "Approve & Activate Account")
                        : targetAction === 'lock'
                        ? (isKh ? "ចាក់សោគណនីអ្នកប្រើប្រាស់" : "Lock User Account")
                        : (isKh ? "បើកសោគណនីអ្នកប្រើប្រាស់" : "Unlock User Account")
                }
                message={
                    targetAction === 'approve'
                        ? (isKh ? `តើអ្នកពិតជាចង់អនុម័ត និងបើកដំណើរការគណនីរបស់ ${selectedUser?.name} (${selectedUser?.role}) មែនទេ? ប្រព័ន្ធនឹងផ្ញើការជូនដំណឹងទៅកាន់អ្នកប្រើប្រាស់ភ្លាមៗ។` : `Are you sure you want to approve and activate the account of ${selectedUser?.name}? A notification will be dispatched to the user immediately.`)
                        : targetAction === 'lock'
                        ? (isKh ? `តើអ្នកពិតជាចង់ចាក់សោគណនីរបស់ ${selectedUser?.name} មែនទេ?` : `Are you sure you want to lock the account of ${selectedUser?.name}?`)
                        : (isKh ? `តើអ្នកពិតជាចង់បើកសោគណនីរបស់ ${selectedUser?.name} មែនទេ?` : `Are you sure you want to unlock the account of ${selectedUser?.name}?`)
                }
                type={targetAction === 'lock' ? 'danger' : 'success'}
                confirmText={targetAction === 'approve' ? (isKh ? "អនុម័តឥឡូវនេះ" : "Approve Now") : (isKh ? "យល់ព្រម" : "Confirm")}
                cancelText={isKh ? "បោះបង់" : "Cancel"}
                onConfirm={handleConfirmStatusChange}
                onCancel={() => {
                    setIsStatusModalOpen(false);
                    setSelectedUser(null);
                }}
            />
        </div>
    );
}