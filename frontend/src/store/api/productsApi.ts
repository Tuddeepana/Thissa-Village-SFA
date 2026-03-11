import { apiSlice } from './apiSlice';
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductListQuery,
  PaginatedResult
} from '@/types/product.types';

export const productsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<{
      items: Product[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }, ProductListQuery>({
      query: (params = {}) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Product'],
      transformResponse: (response: any) => {
        const payload = response?.data || response;
        const items: Product[] = Array.isArray(payload)
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

    getProductById: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
      transformResponse: (response: any) => response.data ?? response,
    }),

    createProduct: builder.mutation<Product, CreateProductPayload>({
      query: (productData) => ({
        url: '/products',
        method: 'POST',
        body: productData,
      }),
      invalidatesTags: ['Product'],
      transformResponse: (response: any) => response.data ?? response,
    }),

    updateProduct: builder.mutation<Product, { id: string; data: UpdateProductPayload }>({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        'Product',
      ],
      transformResponse: (response: any) => response.data ?? response,
    }),

    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Product', id },
        'Product',
        'Inventory', // Products affect inventory
      ],
    }),

    // Get low stock products
    getLowStockProducts: builder.query<{
      items: Product[];
      total: number;
    }, void>({
      query: () => '/products/low-stock',
      providesTags: ['Product'],
      transformResponse: (response: any) => {
        const payload = response?.data || response;
        const items = Array.isArray(payload) ? payload : (payload?.items ?? []);
        return {
          items,
          total: items.length,
        };
      },
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetLowStockProductsQuery,
} = productsApiSlice;
