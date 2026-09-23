// app/auth/callback/page.tsx
'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setUser } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');

            if (token) {
                const isProduction = process.env.NODE_ENV === 'production';
                // ១. រក្សាទុក Token ក្នុង Cookie ដោយបញ្ជាក់ path: '/'
                Cookies.set('access_token', token, {
                    expires: 7,
                    path: '/',
                    secure: isProduction,
                    sameSite: 'lax',
                });

                try {
                    // ២. ហៅ API /me ដើម្បីយកព័ត៌មាន User
                    const res = await api.get('/me');
                    const currentUser = res.data.user || res.data;

                    setUser(currentUser);
                    localStorage.setItem('user', JSON.stringify(currentUser));

                    if (currentUser.role) {
                        Cookies.set('user_role', currentUser.role, {
                            expires: 7,
                            path: '/',
                            secure: isProduction,
                            sameSite: 'lax',
                        });
                    }

                    // ៣. Redirect ទៅកាន់ Dashboard តាម Role
                    const role = currentUser.role?.toLowerCase();
                    if (role === 'super_admin' || role === 'admin') {
                        router.push('/dashboard/admin');
                    } else if (role === 'staff') {
                        router.push('/dashboard/staff');
                    } else if (role === 'owner') {
                        router.push('/dashboard/owner');
                    } else {
                        router.push('/dashboard/tenant/bookings');
                    }
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    router.push('/login?error=auth_failed');
                }
            } else {
                router.push('/login');
            }
        };

        handleCallback();
    }, [searchParams, router, setUser]);

    return (
        <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">កំពុងផ្ទៀងផ្ទាត់ទិន្នន័យ...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <Suspense fallback={
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">កំពុងផ្ទុក...</p>
                </div>
            }>
                <AuthCallbackContent />
            </Suspense>
        </div>
    );
}