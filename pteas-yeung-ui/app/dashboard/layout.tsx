// app/dashboard/layout.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600 font-medium text-sm">
                កំពុងផ្ទៀងផ្ទាត់សិទ្ធិប្រើប្រាស់...
            </div>
        );
    }

    return <>{user ? children : null}</>;
}