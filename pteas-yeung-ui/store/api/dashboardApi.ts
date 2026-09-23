// store/api/dashboardApi.ts
import { baseApi } from './baseApi';
import type { AdminDashboardResponse, OwnerDashboardResponse, OwnerDashboardParams } from '@/types/dashboard';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<AdminDashboardResponse, void>({
      query: () => '/admin/dashboard',
      providesTags: ['AdminDashboard'],
    }),

    getOwnerDashboard: builder.query<OwnerDashboardResponse, OwnerDashboardParams>({
      query: (params) => ({
        url: '/owner/dashboard',
        params,
      }),
      providesTags: ['OwnerDashboard'],
    }),

    getOwnerReport: builder.query<unknown, { property_id?: string; year?: string; month?: string }>({
      query: (params) => ({
        url: '/owner/reports',
        params,
      }),
      providesTags: ['Report'],
    }),

    getAdminSettings: builder.query<{ data: Record<string, string> }, void>({
      query: () => '/admin/settings',
      providesTags: ['Settings'],
    }),

    updateAdminSettings: builder.mutation<{ success: boolean }, Record<string, string>>({
      query: (body) => ({
        url: '/admin/settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminDashboardQuery,
  useGetOwnerDashboardQuery,
  useGetOwnerReportQuery,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
} = dashboardApi;
