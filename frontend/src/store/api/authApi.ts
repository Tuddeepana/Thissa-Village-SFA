import { apiSlice } from './apiSlice';
import type {
  User,
  AuthResponse,
  LoginPayload,
  ListUsersQuery,
  RegisterUserPayload,
  UpdateUserPayload,
  ApiResponse
} from '@/types/user.types';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginPayload>({
      query: (credentials) => ({
        url: '/users/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
      transformResponse: (response: { success: boolean; data: AuthResponse } | AuthResponse) => {
        // Backend returns { success: true, data: { user, token } }
        // Extract the nested data
        if ('data' in response && response.data) {
          return response.data;
        }
        return response;
      },
    }),

    register: builder.mutation<ApiResponse<User>, RegisterUserPayload>({
      query: (userData) => ({
        url: '/users/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    getMe: builder.query<ApiResponse<User>, void>({
      query: () => '/users/me',
      providesTags: ['Auth'],
    }),
  }),
});

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<{
      items: User[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }, ListUsersQuery>({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: ['User'],
      transformResponse: (response: any) => {
        const payload = response.data || response;
        const items = Array.isArray(payload)
          ? payload
          : (payload?.items ?? payload?.data ?? []);

        return {
          items,
          page: payload?.page ?? 1,
          limit: payload?.limit ?? items.length,
          total: payload?.total ?? items.length,
          totalPages: payload?.totalPages ?? Math.max(1, Math.ceil((payload?.total || items.length) / (payload?.limit || 10)))
        };
      },
    }),

    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
      transformResponse: (response: any) => response.data ?? response,
    }),

    updateUser: builder.mutation<User, { id: string; data: UpdateUserPayload }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        'User',
      ],
      transformResponse: (response: any) => response.data ?? response,
    }),

    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        'User',
      ],
    }),

    permanentDeleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}/permanent`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        'User',
      ],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
} = authApiSlice;

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  usePermanentDeleteUserMutation,
} = userApiSlice;
