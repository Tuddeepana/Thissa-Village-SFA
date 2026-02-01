import { z } from 'zod';

export const createRestaurantTableSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(100, 'Name too long'),
  table_type: z.enum(['VIP', 'NORMAL']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Maximum 100 tables'),
});

export const updateRestaurantTableSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(100, 'Name too long').optional(),
  table_type: z.enum(['VIP', 'NORMAL']).optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Maximum 100 tables').optional(),
});

export type CreateRestaurantTableInput = z.infer<typeof createRestaurantTableSchema>;
export type UpdateRestaurantTableInput = z.infer<typeof updateRestaurantTableSchema>;

