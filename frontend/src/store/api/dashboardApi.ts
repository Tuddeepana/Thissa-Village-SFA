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
  lastUpdatedAt?: string; // ISO timestamp of when data was fetched
}

// Cache duration in milliseconds (5 minutes)
const DASHBOARD_CACHE_DURATION = 5 * 60 * 1000;

// Key for storing dashboard data in localStorage
const DASHBOARD_CACHE_KEY = 'dashboard_summary_cache';
const DASHBOARD_TIMESTAMP_KEY = 'dashboard_summary_timestamp';

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
        let data: DashboardSummary;
        if (resp && typeof resp === 'object' && 'response' in resp && resp.response) {
          data = resp.response;
        } else {
          data = resp as DashboardSummary;
        }

        // Add timestamp to track when data was last fetched
        const dataWithTimestamp: DashboardSummary = {
          ...data,
          lastUpdatedAt: new Date().toISOString(),
        };

        // Store in localStorage cache
        try {
          localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(dataWithTimestamp));
          localStorage.setItem(DASHBOARD_TIMESTAMP_KEY, new Date().getTime().toString());
        } catch (err) {
          console.warn('Failed to cache dashboard data:', err);
        }

        return dataWithTimestamp;
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

// Helper function to get cached dashboard data
export const getCachedDashboardData = (): (DashboardSummary & { isCached: boolean }) | null => {
  try {
    const cachedData = localStorage.getItem(DASHBOARD_CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(DASHBOARD_TIMESTAMP_KEY);

    if (!cachedData || !cachedTimestamp) {
      return null;
    }

    const timestamp = parseInt(cachedTimestamp, 10);
    const now = new Date().getTime();
    const isExpired = now - timestamp > DASHBOARD_CACHE_DURATION;

    if (isExpired) {
      // Clear expired cache
      localStorage.removeItem(DASHBOARD_CACHE_KEY);
      localStorage.removeItem(DASHBOARD_TIMESTAMP_KEY);
      return null;
    }

    const data = JSON.parse(cachedData) as DashboardSummary;
    return { ...data, isCached: true };
  } catch (err) {
    console.warn('Failed to retrieve cached dashboard data:', err);
    return null;
  }
};

// Helper function to get cache age in seconds
export const getDashboardCacheAge = (): number | null => {
  try {
    const cachedTimestamp = localStorage.getItem(DASHBOARD_TIMESTAMP_KEY);
    if (!cachedTimestamp) return null;

    const timestamp = parseInt(cachedTimestamp, 10);
    const now = new Date().getTime();
    return Math.floor((now - timestamp) / 1000);
  } catch (err) {
    console.warn('Failed to get cache age:', err);
    return null;
  }
};

