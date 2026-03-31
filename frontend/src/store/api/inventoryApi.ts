import { apiSlice } from './apiSlice';

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  currentStock: number;
  lowStockLevel: number;
  cost_price: string;
  selling_price: string;
  lastUpdated: string;
}

interface InventoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
}

interface UpdateStockPayload {
  productId: string;
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
  reason?: string;
}

export const inventoryApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInventory: builder.query<{
      items: InventoryItem[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }, InventoryQuery>({
      query: (params = {}) => ({
        url: '/inventory',
        params,
      }),
      providesTags: ['Inventory'],
      transformResponse: (response: any) => {
        const payload = response?.data || response;
        const items: InventoryItem[] = Array.isArray(payload)
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

    updateStock: builder.mutation<InventoryItem, UpdateStockPayload>({
      query: (data) => ({
        url: '/inventory/update-stock',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Inventory', 'Product'],
      transformResponse: (response: any) => response.data ?? response,
    }),

    getLowStockItems: builder.query<{
      items: InventoryItem[];
      total: number;
    }, void>({
      query: () => '/inventory/low-stock',
      providesTags: ['Inventory'],
      transformResponse: (response: any) => {
        const payload = response?.data || response;
        const items = Array.isArray(payload) ? payload : (payload?.items ?? []);
        return {
          items,
          total: items.length,
        };
      },
    }),

    getStockHistory: builder.query<any[], {
      productId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }>({
      query: (params) => ({
        url: '/inventory/stock-history',
        params,
      }),
      providesTags: ['Inventory'],
      transformResponse: (response: any) => response.data ?? response,
    }),
  }),
});

export const {
  useGetInventoryQuery,
  useUpdateStockMutation,
  useGetLowStockItemsQuery,
  useGetStockHistoryQuery,
} = inventoryApiSlice;
