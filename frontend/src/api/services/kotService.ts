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
  items: CreateKotLogItemInput[];
}

export const kotService = {
  /**
   * Create a new KOT log and mark items as sent
   */
  async createKotLog(input: CreateKotLogInput) {
    const response = await api.post(ENDPOINTS.kot.base, input);
    return response.data;
  },
};
