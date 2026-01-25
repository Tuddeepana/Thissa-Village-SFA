import api from '../client';
import { ENDPOINTS } from '../endpoints';
import type { SalesSummaryQuery, SalesSummaryResponse, VolumeWiseSummaryResponse } from '../../types/sales-summary.types';

export const salesSummaryService = {
  getSalesSummary: async (query: SalesSummaryQuery): Promise<SalesSummaryResponse> => {
    const response = await api.get(ENDPOINTS.salesSummary, {
      params: query,
      meta: { showLoader: 'local', loaderKey: 'sales-summary' },
    });
    return response.data;
  },

  getVolumeWiseSummary: async (query: SalesSummaryQuery): Promise<VolumeWiseSummaryResponse> => {
    const response = await api.get(`${ENDPOINTS.salesSummary}/volume-wise`, {
      params: query,
      meta: { showLoader: 'local', loaderKey: 'volume-wise-summary' },
    });
    return response.data;
  },
};
