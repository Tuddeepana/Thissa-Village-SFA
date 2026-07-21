import { z } from 'zod';

export const createRoomTypeSchema = z.object({
  body: z.object({
    type: z.string().min(1, 'Type is required'),
    description: z.string().optional(),
    price_full_day: z.number().min(0, 'Price must be positive'),
    price_short_time: z.number().min(0, 'Price must be positive'),
  }),
});

export const updateRoomTypeSchema = z.object({
  body: z.object({
    type: z.string().optional(),
    description: z.string().optional(),
    price_full_day: z.number().min(0, 'Price must be positive').optional(),
    price_short_time: z.number().min(0, 'Price must be positive').optional(),
  }),
});
