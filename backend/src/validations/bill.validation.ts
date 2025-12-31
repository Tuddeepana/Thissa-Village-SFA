import { z } from 'zod';

export const billItemSchema = z.object({
  productId: z.string().uuid(),
  quantityMoved: z.number().int().positive(), // will be negated when writing to inventory
});

export const createBillSchema = z.object({
  bill_number: z.string().min(1),
  date: z.union([z.string(), z.date()]),
  payment_method: z.string().min(1),
  customer_name: z.string().optional().nullable(),
  total: z.union([z.number(), z.string()]),
  cashier_name: z.string().min(1),
  item_count: z.number().int().min(0),
  credit_note: z.string().optional().nullable(),
  cash_given: z.union([z.number(), z.string()]),
  balance_given: z.union([z.number(), z.string()]),
  tax: z.union([z.number(), z.string()]).optional().nullable(),
});

export const createBillWithItemsSchema = createBillSchema.extend({
  items: z.array(billItemSchema).min(1),
});

export const billQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});
