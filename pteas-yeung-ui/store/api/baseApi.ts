// store/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    prepareHeaders: (headers) => {
      const token = Cookies.get('access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Accept', 'application/json');
      return headers;
    },
    credentials: 'include',
  }),
  tagTypes: [
    'Room',
    'Property',
    'Booking',
    'Invoice',
    'Expense',
    'User',
    'Profile',
    'AdminDashboard',
    'OwnerDashboard',
    'Staff',
    'Settings',
    'Report',
  ],
  endpoints: () => ({}),
});
