// store/api/bookingsApi.ts
import { baseApi } from './baseApi';
import type { Booking, CreateBookingRequest, UpdateBookingRequest, UpdateBookingStatusRequest } from '@/types/booking';

export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Tenant: My bookings ---
    getMyBookings: builder.query<Booking[], void>({
      query: () => '/my-bookings',
      transformResponse: (response: Booking[] | { data: Booking[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: [{ type: 'Booking', id: 'MY_LIST' }],
    }),

    // --- Tenant: Create booking (apiResource) ---
    createBooking: builder.mutation<{ data: Booking; success: boolean }, CreateBookingRequest>({
      query: (body) => ({
        url: '/bookings',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Booking', id: 'MY_LIST' }],
    }),

    // --- Owner ---
    getOwnerBookings: builder.query<Booking[], void | Record<string, string>>({
      query: (params) => ({ url: '/owner/bookings', params: params ?? {} }),
      transformResponse: (response: Booking[] | { data: Booking[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: [{ type: 'Booking', id: 'OWNER_LIST' }],
    }),

    createOwnerBooking: builder.mutation<{ data: Booking; success: boolean }, CreateBookingRequest>({
      query: (body) => ({
        url: '/owner/bookings',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Booking', id: 'OWNER_LIST' }],
    }),

    updateOwnerBooking: builder.mutation<{ data: Booking; success: boolean }, { id: number; body: UpdateBookingRequest }>({
      query: ({ id, body }) => ({
        url: `/owner/bookings/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Booking', id }, { type: 'Booking', id: 'OWNER_LIST' }],
    }),

    updateOwnerBookingStatus: builder.mutation<{ data: Booking; success: boolean }, { id: number; body: UpdateBookingStatusRequest }>({
      query: ({ id, body }) => ({
        url: `/owner/bookings/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Booking', id }, { type: 'Booking', id: 'OWNER_LIST' }],
    }),

    deleteOwnerBooking: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/owner/bookings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Booking', id: 'OWNER_LIST' }],
    }),

    // --- Admin ---
    getAdminBookings: builder.query<Booking[], void>({
      query: () => '/admin/bookings',
      transformResponse: (response: Booking[] | { data: Booking[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: [{ type: 'Booking', id: 'ADMIN_LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyBookingsQuery,
  useCreateBookingMutation,
  useGetOwnerBookingsQuery,
  useCreateOwnerBookingMutation,
  useUpdateOwnerBookingMutation,
  useUpdateOwnerBookingStatusMutation,
  useDeleteOwnerBookingMutation,
  useGetAdminBookingsQuery,
} = bookingsApi;
