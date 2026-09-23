// store/api/invoicesApi.ts
import { baseApi } from './baseApi';
import type { Invoice, InvoiceListResponse, CreateInvoiceRequest, UpdateInvoiceRequest } from '@/types/invoice';

export const invoicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Tenant ---
    getMyInvoices: builder.query<Invoice[], void>({
      query: () => '/my-invoices',
      transformResponse: (response: Invoice[] | { data: Invoice[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: [{ type: 'Invoice', id: 'MY_LIST' }],
    }),

    getMyInvoice: builder.query<Invoice, number>({
      query: (id) => `/my-invoices/${id}`,
      transformResponse: (response: Invoice | { data: Invoice }) =>
        'data' in response ? response.data : response,
      providesTags: (_result, _error, id) => [{ type: 'Invoice', id }],
    }),

    // --- Owner ---
    getOwnerInvoices: builder.query<InvoiceListResponse, void | Record<string, string>>({
      query: (params) => ({ url: '/owner/invoices', params: params ?? {} }),
      providesTags: [{ type: 'Invoice', id: 'OWNER_LIST' }],
    }),

    getOwnerInvoice: builder.query<{ success: boolean; data: Invoice }, number>({
      query: (id) => `/owner/invoices/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Invoice', id }],
    }),

    createOwnerInvoice: builder.mutation<{ success: boolean; data: Invoice }, CreateInvoiceRequest>({
      query: (body) => ({
        url: '/owner/invoices',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Invoice', id: 'OWNER_LIST' }, 'OwnerDashboard'],
    }),

    updateOwnerInvoice: builder.mutation<{ success: boolean; data: Invoice }, { id: number; body: UpdateInvoiceRequest }>({
      query: ({ id, body }) => ({
        url: `/owner/invoices/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Invoice', id }, { type: 'Invoice', id: 'OWNER_LIST' }],
    }),

    deleteOwnerInvoice: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/owner/invoices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Invoice', id: 'OWNER_LIST' }],
    }),

    // --- Admin ---
    getAdminInvoices: builder.query<InvoiceListResponse, void>({
      query: () => '/admin/invoices',
      providesTags: [{ type: 'Invoice', id: 'ADMIN_LIST' }],
    }),

    createAdminInvoice: builder.mutation<{ success: boolean; data: Invoice }, CreateInvoiceRequest>({
      query: (body) => ({
        url: '/admin/invoices',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Invoice', id: 'ADMIN_LIST' }],
    }),

    updateAdminInvoice: builder.mutation<{ success: boolean; data: Invoice }, { id: number; body: UpdateInvoiceRequest }>({
      query: ({ id, body }) => ({
        url: `/admin/invoices/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Invoice', id }],
    }),

    deleteAdminInvoice: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/admin/invoices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Invoice', id: 'ADMIN_LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyInvoicesQuery,
  useGetMyInvoiceQuery,
  useGetOwnerInvoicesQuery,
  useGetOwnerInvoiceQuery,
  useCreateOwnerInvoiceMutation,
  useUpdateOwnerInvoiceMutation,
  useDeleteOwnerInvoiceMutation,
  useGetAdminInvoicesQuery,
  useCreateAdminInvoiceMutation,
  useUpdateAdminInvoiceMutation,
  useDeleteAdminInvoiceMutation,
} = invoicesApi;
