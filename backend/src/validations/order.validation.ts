import { z } from 'zod';
import { OrderStatus, OrderType } from '../types/order.types';

export const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit_price: z.number().positive('Unit price must be positive'),
});

export const createOrderSchema = z.object({
  customer_name: z.string().optional().default("Guest").transform(val => val || "Guest"),
  customer_phone: z.string().optional().default("0000000000").transform(val => val || "0000000000"),
  customer_type: z.enum(['local', 'foreigner']).default('local'),
  order_type: z.nativeEnum(OrderType, { message: 'Invalid order type' }),
  table_id: z.any().optional(),
  table_name: z.any().optional(),
  table_number: z.any().optional(),
  tax: z.number().nonnegative().optional().default(0),
  discount: z.number().nonnegative().optional().default(0),
  terminal_id: z.string().min(1, 'Terminal ID is required'),
  cashier_name: z.string().min(1, 'Cashier name is required'),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
}).refine(
  (data) => {
    // If order type is DINE_IN, table_id is required
    if (data.order_type === OrderType.DINE_IN) {
      return !!data.table_id && !!data.table_name;
    }
    return true;
  },
  {
    message: 'Table information is required for dine-in orders',
    path: ['table_id'],
  }
);

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, { message: 'Invalid order status' }),
});

export const addItemsToOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

export const orderQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  order_type: z.nativeEnum(OrderType).optional(),
  customer_name: z.string().optional(),
  table_number: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (typeof val === 'number') return val;
    return val ? parseInt(val, 10) : 1;
  }),
  pageSize: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (typeof val === 'number') return val;
    return val ? parseInt(val, 10) : 50;
  }),
});
