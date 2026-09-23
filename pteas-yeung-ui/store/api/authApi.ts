// store/api/authApi.ts
import { baseApi } from './baseApi';
import type { AuthResponse, LoginRequest, MeResponse, RegisterRequest } from '@/types/auth';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Profile'],
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (data) => ({
        url: '/register',
        method: 'POST',
        body: data,
      }),
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Profile', 'Room', 'Property', 'Booking', 'Invoice'],
    }),

    getMe: builder.query<MeResponse, void>({
      query: () => '/me',
      providesTags: ['Profile'],
    }),

    getProfile: builder.query<{ user: import('@/types/auth').User }, void>({
      query: () => '/profile',
      providesTags: ['Profile'],
    }),

    updateProfile: builder.mutation<
      { user: import('@/types/auth').User },
      import('@/schemas/auth.schema').UpdateProfileInput
    >({
      query: (data) => ({
        url: '/profile/update',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Profile'],
    }),

    updatePassword: builder.mutation<
      { message: string },
      import('@/schemas/auth.schema').UpdatePasswordInput
    >({
      query: (data) => ({
        url: '/profile/password',
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
} = authApi;
