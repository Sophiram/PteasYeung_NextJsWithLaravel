// store/api/roomsApi.ts
import { baseApi } from './baseApi';
import type { Room, CreateRoomRequest, UpdateRoomRequest, RoomAvailability } from '@/types/room';

export const roomsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Public ---
    getRooms: builder.query<Room[], void>({
      query: () => '/rooms',
      transformResponse: (response: Room[] | { data: Room[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Room' as const, id })), { type: 'Room', id: 'LIST' }]
          : [{ type: 'Room', id: 'LIST' }],
    }),

    getRoom: builder.query<Room, number>({
      query: (id) => `/rooms/${id}`,
      transformResponse: (response: Room | { data: Room }) =>
        'data' in response ? response.data : response,
      providesTags: (_result, _error, id) => [{ type: 'Room', id }],
    }),

    checkRoomAvailability: builder.query<RoomAvailability, number>({
      query: (id) => `/rooms/${id}/availability`,
    }),

    // --- Owner ---
    getOwnerRooms: builder.query<Room[], void | { property_id?: number }>({
      query: (params) => ({
        url: '/owner/rooms',
        params: params ?? {},
      }),
      transformResponse: (response: Room[] | { data: Room[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: [{ type: 'Room', id: 'OWNER_LIST' }],
    }),

    createOwnerRoom: builder.mutation<{ data: Room; success: boolean }, FormData | CreateRoomRequest>({
      query: (body) => ({
        url: '/owner/rooms',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Room', id: 'LIST' }, { type: 'Room', id: 'OWNER_LIST' }],
    }),

    updateOwnerRoom: builder.mutation<{ data: Room; success: boolean }, { id: number; body: FormData | UpdateRoomRequest }>({
      query: ({ id, body }) => ({
        url: `/owner/rooms/${id}`,
        method: 'POST', // Laravel uses POST with _method=PUT for FormData
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Room', id }, { type: 'Room', id: 'OWNER_LIST' }],
    }),

    deleteOwnerRoom: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `/owner/rooms/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Room', id }, { type: 'Room', id: 'OWNER_LIST' }],
    }),

    deleteOwnerRoomImage: builder.mutation<{ success: boolean }, number>({
      query: (imageId) => ({
        url: `/owner/room-images/${imageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Room', id: 'OWNER_LIST' }],
    }),

    // --- Admin ---
    getAdminRooms: builder.query<Room[], void>({
      query: () => '/admin/rooms',
      transformResponse: (response: Room[] | { data: Room[] }) =>
        Array.isArray(response) ? response : response.data ?? [],
      providesTags: [{ type: 'Room', id: 'ADMIN_LIST' }],
    }),

    createAdminRoom: builder.mutation<{ data: Room; success: boolean }, CreateRoomRequest>({
      query: (body) => ({
        url: '/admin/rooms',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Room', id: 'LIST' }, { type: 'Room', id: 'ADMIN_LIST' }],
    }),

    updateAdminRoom: builder.mutation<{ data: Room; success: boolean }, { id: number; body: UpdateRoomRequest }>({
      query: ({ id, body }) => ({
        url: `/admin/rooms/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Room', id }],
    }),

    deleteAdminRoom: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/admin/rooms/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Room', id }, { type: 'Room', id: 'ADMIN_LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRoomsQuery,
  useGetRoomQuery,
  useCheckRoomAvailabilityQuery,
  useGetOwnerRoomsQuery,
  useCreateOwnerRoomMutation,
  useUpdateOwnerRoomMutation,
  useDeleteOwnerRoomMutation,
  useDeleteOwnerRoomImageMutation,
  useGetAdminRoomsQuery,
  useCreateAdminRoomMutation,
  useUpdateAdminRoomMutation,
  useDeleteAdminRoomMutation,
} = roomsApi;
