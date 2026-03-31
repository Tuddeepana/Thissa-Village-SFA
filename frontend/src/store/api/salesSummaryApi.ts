import { apiSlice } from './apiSlice';
import type {
  SalesSummaryQuery,
  SalesSummaryResponse,
  SalesSummaryCardResponse,
  VolumeWiseSummaryResponse
} from '@/types/sales-summary.types';

export const salesSummaryApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSalesSummary: builder.query<SalesSummaryResponse, SalesSummaryQuery>({
      query: (params) => ({
        url: '/sales-summary',
        params,
      }),
      providesTags: ['SalesSummary'],
      transformResponse: (response: any) => response.data ?? response,
    }),

    getSalesSummaryCards: builder.query<SalesSummaryCardResponse, SalesSummaryQuery>({
      query: (params) => ({
        url: '/sales-summary/cards',
        params,
      }),
      providesTags: ['SalesSummary'],
      transformResponse: (response: any) => response.data?.cardResponse ?? response.cardResponse ?? response,
    }),

    getVolumeWiseSummary: builder.query<VolumeWiseSummaryResponse, SalesSummaryQuery>({
      query: (params) => ({
        url: '/sales-summary/volume-wise',
        params,
      }),
      providesTags: ['SalesSummary'],
      transformResponse: (response: any) => response.data ?? response,
    }),

    // Dashboard-specific endpoints
    getDashboardStats: builder.query<{
      totalRevenue: number;
      totalOrders: number;
      totalCustomers: number;
      lowStockProducts: number;
      recentSales: any[];
      topProducts: any[];
    }, { period?: 'today' | 'week' | 'month' | 'year' }>({
      query: (params) => ({
        url: '/dashboard/stats',
        params,
      }),
      providesTags: ['Dashboard', 'SalesSummary'],
      transformResponse: (response: any) => response.data ?? response,
    }),
  }),
});

export const {
  useGetSalesSummaryQuery,
  useGetSalesSummaryCardsQuery,
  useGetVolumeWiseSummaryQuery,
  useGetDashboardStatsQuery,
} = salesSummaryApiSlice;
