import { z } from 'zod';

export const createRoomTypeSchema = z.object({
  body: z.object({
    type: z.string({
      required_error: 'Type is required',
    }),
    description: z.string().optional(),
    price_full_day: z.number().min(0, 'Price must be greater than or equal to 0'),
    price_short_time: z.number().min(0, 'Price must be greater than or equal to 0'),
  }),
});

export const updateRoomTypeSchema = z.object({
  body: z.object({
    type: z.string().optional(),
    description: z.string().optional(),
    price_full_day: z.number().min(0).optional(),
    price_short_time: z.number().min(0).optional(),
  }),
});
