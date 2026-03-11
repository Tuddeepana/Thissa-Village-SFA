import { apiSlice } from './apiSlice';

interface DashboardSummary {
  weeklyIncome: string;
  monthlyIncome: string;
  weeklyIncomeResponse: Record<string, string>;
  monthlyIncomeResponse: Record<string, string>;
  TotalProduct: number;
  lowStockItemsCount?: number;
  lowStockItems: Array<{
    id: string;
    name?: string;
    available_quantity: number;
    low_stock: number;
  }>;
  categoryDistribution: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    percentage: number;
  }>;
}

interface ProductCategoryDistribution {
  categories: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    percentage: number;
  }>;
}

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => '/dashboard/summary',
      providesTags: ['Dashboard'],
      transformResponse: (response: unknown): DashboardSummary => {
        const resp = response as { success: boolean; response: DashboardSummary } | DashboardSummary;
        // Backend returns { success: true, response: { ... } }
        if (resp && typeof resp === 'object' && 'response' in resp && resp.response) {
          return resp.response;
        }
        return resp as DashboardSummary;
      },
    }),

    getProductCategoryDistribution: builder.query<ProductCategoryDistribution, void>({
      query: () => '/dashboard/product-category',
      providesTags: ['Dashboard'],
      transformResponse: (response: unknown): ProductCategoryDistribution => {
        const resp = response as { success: boolean; data: ProductCategoryDistribution } | ProductCategoryDistribution;
        if (resp && typeof resp === 'object' && 'data' in resp && resp.data) {
          return resp.data;
        }
        return resp as ProductCategoryDistribution;
      },
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetProductCategoryDistributionQuery,
} = dashboardApiSlice;

