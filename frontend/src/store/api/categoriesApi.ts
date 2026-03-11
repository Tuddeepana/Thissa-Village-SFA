import { apiSlice } from './apiSlice';
import type {
  Category,
  CategoryListQuery,
  CreateCategoryPayload,
  UpdateCategoryPayload
} from '@/types/category.types';

export const categoriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<{
      items: Category[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }, CategoryListQuery>({
      query: (params = {}) => ({
        url: '/categories',
        params,
      }),
      providesTags: ['Category'],
      transformResponse: (response: any) => {
        const payload = response?.data || response;
        const items: Category[] = Array.isArray(payload)
          ? payload
          : (payload?.items ?? payload?.data ?? []);

        return {
          items,
          page: payload?.page ?? 1,
          limit: payload?.limit ?? (items.length || 10),
          total: payload?.total ?? items.length,
          totalPages: payload?.totalPages ?? Math.max(1, Math.ceil((payload?.total || items.length) / (payload?.limit || 10)))
        };
      },
    }),

    getCategoryById: builder.query<Category, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Category', id }],
      transformResponse: (response: any) => response.data ?? response,
    }),

    createCategory: builder.mutation<Category, CreateCategoryPayload>({
      query: (categoryData) => ({
        url: '/categories',
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: ['Category'],
      transformResponse: (response: any) => response.data ?? response,
    }),

    updateCategory: builder.mutation<Category, { id: string; data: UpdateCategoryPayload }>({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Category', id },
        'Category',
        'Product', // Categories affect products
      ],
      transformResponse: (response: any) => response.data ?? response,
    }),

    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Category', id },
        'Category',
        'Product', // Categories affect products
      ],
    }),

    restoreCategory: builder.mutation<Category, string>({
      query: (id) => ({
        url: `/categories/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Category', id },
        'Category',
      ],
      transformResponse: (response: any) => response.data ?? response,
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useRestoreCategoryMutation,
} = categoriesApiSlice;
