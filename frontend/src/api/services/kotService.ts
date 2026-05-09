import api from '../client';
import { ENDPOINTS } from '../endpoints';
import { OrderType } from '@/types/order.types';

export interface CreateKotLogItemInput {
  orderItemId?: string;
  product_name: string;
  quantity: number;
  unit?: string;
}

export interface CreateKotLogInput {
  orderId?: string;
  steward: string;
  table_name?: string;
  order_type: OrderType;
  total_amount: number;
  remark?: string | null;
  items: CreateKotLogItemInput[];
}

export interface KotLogItemDTO {
  id: string;
  kotLogId: string;
  orderItemId?: string | null;
  product_name: string;
  quantity: number;
  unit?: string | null;
}

export interface KotLogDTO {
  id: string;
  orderId?: string | null;
  steward: string;
  table_name?: string | null;
  order_type: OrderType;
  total_amount: number;
  status: 'PENDING' | 'COMPLETED';
  remark?: string | null;
  createdAt: string;
  items: KotLogItemDTO[];
}

export const kotService = {
  /**
   * Create a new KOT log and mark items as sent
   */
  async createKotLog(input: CreateKotLogInput) {
    const response = await api.post(ENDPOINTS.kot.base, input);
    return response.data;
  },

  /**
   * Get KOT logs
   */
  async getKotLogs(filters?: { steward?: string; status?: 'PENDING' | 'COMPLETED' }) {
    const response = await api.get<{ kotLogs: KotLogDTO[] }>(ENDPOINTS.kot.base, { params: filters });
    return response.data;
  },

  /**
   * Update KOT status
   */
  async updateKotStatus(id: string, status: 'PENDING' | 'COMPLETED') {
    const response = await api.patch<{ message: string; kotLog: KotLogDTO }>(`${ENDPOINTS.kot.base}/${id}/status`, { status });
    return response.data;
  }
};
