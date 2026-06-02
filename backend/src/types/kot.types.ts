import { OrderType } from './order.types';

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
  kot_number?: string | null;
  orderId?: string | null;
  steward: string;
  table_name?: string | null;
  order_type: OrderType;
  total_amount: number;
  status: 'PENDING' | 'COMPLETED';
  remark?: string | null;
  createdAt: Date;
  items: KotLogItemDTO[];
}

export interface CreateKotLogItemInput {
  orderItemId?: string;
  product_name: string;
  quantity: number;
  unit?: string | null;
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
