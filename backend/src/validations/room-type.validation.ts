import { z } from 'zod';

export const createRoomTypeSchema = z.object({
  type: z.string().min(1, 'Type name is required').max(50, 'Type name too long'),
  price_full_day: z.number().min(0, 'Price must be non-negative'),
  price_short_time: z.number().min(0, 'Price must be non-negative'),
  description: z.string().max(500, 'Description too long').nullable().optional(),
});

export const updateRoomTypeSchema = z.object({
  type: z.string().min(1, 'Type name is required').max(50, 'Type name too long').optional(),
  price_full_day: z.number().min(0, 'Price must be non-negative').optional(),
  price_short_time: z.number().min(0, 'Price must be non-negative').optional(),
  description: z.string().max(500, 'Description too long').nullable().optional(),
});

export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>;
