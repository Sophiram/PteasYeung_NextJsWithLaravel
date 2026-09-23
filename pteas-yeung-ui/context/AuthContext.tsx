'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { useGetMeQuery } from '@/store/api/authApi';
import type { User } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  hasPermission: () => false,
  hasAnyPermission: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = Cookies.get('access_token');

      if (!token) {
        setUser(null);
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      try {
        // Use the existing axios-based api to avoid circular RTK deps in context
        const { default: api } = await import('@/lib/api');
        const res = await api.get('/me');
        const currentUser = res.data.user || res.data;
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      } catch (error) {
        console.error('Auth verification failed:', error);

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setUser(null);
          localStorage.removeItem('user');
          Cookies.remove('access_token', { path: '/' });
          Cookies.remove('user_role', { path: '/' });
        } else {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch {
              setUser(null);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return Boolean(user.permissions && user.permissions.includes(permission));
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (!user.permissions) return false;
    return permissions.some((p) => user.permissions?.includes(p));
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, hasPermission, hasAnyPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);