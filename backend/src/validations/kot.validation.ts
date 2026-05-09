import { z } from 'zod';
import { OrderType } from '../types/order.types';

export const kotLogItemSchema = z.object({
  orderItemId: z.string().optional(),
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit: z.string().optional().nullable(),
});

export const createKotLogSchema = z.object({
  orderId: z.string().optional(),
  steward: z.string().min(1, 'Steward name is required'),
  table_name: z.string().optional(),
  order_type: z.nativeEnum(OrderType, { message: 'Invalid order type' }),
  total_amount: z.number().nonnegative(),
  remark: z.string().optional().nullable(),
  items: z.array(kotLogItemSchema).min(1, 'At least one item is required'),
});

export const updateKotStatusSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED']),
});
