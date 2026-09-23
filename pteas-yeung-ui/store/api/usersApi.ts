// store/api/usersApi.ts
import { baseApi } from './baseApi';
import type { User, CreateUserRequest, UpdateUserStatusRequest, UpdateUserRoleRequest } from '@/types/user';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Admin: Users CRUD ---
    getAdminUsers: builder.query<User[], void>({
      query: () => '/admin/users',
      transformResponse: (response: User[] | { data: User[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),

    getAdminUser: builder.query<User, number>({
      query: (id) => `/admin/users/${id}`,
      transformResponse: (response: User | { data: User }) =>
        'data' in response ? response.data : response,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    createAdminUser: builder.mutation<{ data: User; success: boolean }, CreateUserRequest>({
      query: (body) => ({
        url: '/admin/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    updateAdminUser: builder.mutation<{ data: User; success: boolean }, { id: number; body: Partial<CreateUserRequest> }>({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),

    deleteAdminUser: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    updateUserStatus: builder.mutation<{ success: boolean; user: User }, { id: number; body: UpdateUserStatusRequest }>({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),

    updateUserRole: builder.mutation<{ success: boolean; user: User }, { id: number; body: UpdateUserRoleRequest }>({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}/role`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),

    // --- Owner: Staff management ---
    getOwnerStaff: builder.query<User[], void>({
      query: () => '/owner/staff',
      transformResponse: (response: User[] | { data: User[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: ['Staff'],
    }),

    createOwnerStaff: builder.mutation<{ data: User; success: boolean }, CreateUserRequest>({
      query: (body) => ({
        url: '/owner/staff',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Staff'],
    }),

    updateOwnerStaff: builder.mutation<{ data: User; success: boolean }, { id: number; body: Partial<CreateUserRequest> }>({
      query: ({ id, body }) => ({
        url: `/owner/staff/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Staff'],
    }),

    deleteOwnerStaff: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/owner/staff/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Staff'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminUsersQuery,
  useGetAdminUserQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useUpdateUserStatusMutation,
  useUpdateUserRoleMutation,
  useGetOwnerStaffQuery,
  useCreateOwnerStaffMutation,
  useUpdateOwnerStaffMutation,
  useDeleteOwnerStaffMutation,
} = usersApi;
