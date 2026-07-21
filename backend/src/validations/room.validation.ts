import { z } from 'zod';

export const createRoomSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Room name is required').max(100, 'Name too long'),
    roomTypeId: z.string().min(1, 'Room type is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Maximum 100 rooms').default(1),
    price_full_day: z.number().min(0, 'Price must be non-negative').default(0),
    price_short_time: z.number().min(0, 'Price must be non-negative').default(0),
  })
});

export const updateRoomSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Room name is required').max(100, 'Name too long').optional(),
    roomTypeId: z.string().optional(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Maximum 100 rooms').optional(),
    price_full_day: z.number().min(0, 'Price must be non-negative').optional(),
    price_short_time: z.number().min(0, 'Price must be non-negative').optional(),
  })
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
