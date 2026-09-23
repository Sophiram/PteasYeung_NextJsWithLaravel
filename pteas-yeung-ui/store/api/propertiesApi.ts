// store/api/propertiesApi.ts
import { baseApi } from './baseApi';
import type { Property, CreatePropertyRequest, UpdatePropertyRequest } from '@/types/property';

export const propertiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Public ---
    getProperties: builder.query<Property[], void>({
      query: () => '/properties',
      transformResponse: (response: Property[] | { data: Property[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: [{ type: 'Property', id: 'LIST' }],
    }),

    getProperty: builder.query<Property, number>({
      query: (id) => `/properties/${id}`,
      transformResponse: (response: Property | { data: Property }) =>
        'data' in response ? response.data : response,
      providesTags: (_result, _error, id) => [{ type: 'Property', id }],
    }),

    // --- Owner ---
    getOwnerProperties: builder.query<Property[], void>({
      query: () => '/owner/properties',
      transformResponse: (response: Property[] | { data: Property[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: [{ type: 'Property', id: 'OWNER_LIST' }],
    }),

    createOwnerProperty: builder.mutation<{ data: Property; success: boolean }, FormData | CreatePropertyRequest>({
      query: (body) => ({
        url: '/owner/properties',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Property', id: 'LIST' }, { type: 'Property', id: 'OWNER_LIST' }],
    }),

    updateOwnerProperty: builder.mutation<{ data: Property; success: boolean }, { id: number; body: FormData | UpdatePropertyRequest }>({
      query: ({ id, body }) => ({
        url: `/owner/properties/${id}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Property', id }, { type: 'Property', id: 'OWNER_LIST' }],
    }),

    deleteOwnerProperty: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/owner/properties/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Property', id }, { type: 'Property', id: 'OWNER_LIST' }],
    }),

    // --- Admin ---
    getAdminProperties: builder.query<Property[], void>({
      query: () => '/admin/properties',
      transformResponse: (response: Property[] | { data: Property[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: [{ type: 'Property', id: 'ADMIN_LIST' }],
    }),

    createAdminProperty: builder.mutation<{ data: Property; success: boolean }, CreatePropertyRequest>({
      query: (body) => ({
        url: '/admin/properties',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Property', id: 'ADMIN_LIST' }],
    }),

    updateAdminProperty: builder.mutation<{ data: Property; success: boolean }, { id: number; body: UpdatePropertyRequest }>({
      query: ({ id, body }) => ({
        url: `/admin/properties/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Property', id }],
    }),

    deleteAdminProperty: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/admin/properties/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Property', id }, { type: 'Property', id: 'ADMIN_LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useGetOwnerPropertiesQuery,
  useCreateOwnerPropertyMutation,
  useUpdateOwnerPropertyMutation,
  useDeleteOwnerPropertyMutation,
  useGetAdminPropertiesQuery,
  useCreateAdminPropertyMutation,
  useUpdateAdminPropertyMutation,
  useDeleteAdminPropertyMutation,
} = propertiesApi;
