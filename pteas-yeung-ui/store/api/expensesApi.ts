// store/api/expensesApi.ts
import { baseApi } from './baseApi';
import type { Expense, CreateExpenseRequest, UpdateExpenseRequest } from '@/types/expense';

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Owner ---
    getOwnerExpenses: builder.query<Expense[], void | Record<string, string>>({
      query: (params) => ({ url: '/owner/expenses', params: params ?? {} }),
      transformResponse: (response: Expense[] | { data: Expense[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: [{ type: 'Expense', id: 'OWNER_LIST' }],
    }),

    createOwnerExpense: builder.mutation<{ data: Expense; success: boolean }, CreateExpenseRequest>({
      query: (body) => ({
        url: '/owner/expenses',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Expense', id: 'OWNER_LIST' }, 'OwnerDashboard'],
    }),

    updateOwnerExpense: builder.mutation<{ data: Expense; success: boolean }, { id: number; body: UpdateExpenseRequest }>({
      query: ({ id, body }) => ({
        url: `/owner/expenses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Expense', id }, { type: 'Expense', id: 'OWNER_LIST' }],
    }),

    deleteOwnerExpense: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/owner/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Expense', id: 'OWNER_LIST' }],
    }),

    // --- Admin ---
    getAdminExpenses: builder.query<Expense[], void>({
      query: () => '/admin/expenses',
      transformResponse: (response: Expense[] | { data: Expense[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: [{ type: 'Expense', id: 'ADMIN_LIST' }],
    }),

    createAdminExpense: builder.mutation<{ data: Expense; success: boolean }, CreateExpenseRequest>({
      query: (body) => ({
        url: '/admin/expenses',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Expense', id: 'ADMIN_LIST' }],
    }),

    updateAdminExpense: builder.mutation<{ data: Expense; success: boolean }, { id: number; body: UpdateExpenseRequest }>({
      query: ({ id, body }) => ({
        url: `/admin/expenses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Expense', id }],
    }),

    deleteAdminExpense: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/admin/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Expense', id: 'ADMIN_LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOwnerExpensesQuery,
  useCreateOwnerExpenseMutation,
  useUpdateOwnerExpenseMutation,
  useDeleteOwnerExpenseMutation,
  useGetAdminExpensesQuery,
  useCreateAdminExpenseMutation,
  useUpdateAdminExpenseMutation,
  useDeleteAdminExpenseMutation,
} = expensesApi;
