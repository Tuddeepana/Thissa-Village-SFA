import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100, 'Name too long'),
  room_type: z.enum(['VIP', 'NORMAL']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Maximum 100 rooms'),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100, 'Name too long').optional(),
  room_type: z.enum(['VIP', 'NORMAL']).optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Maximum 100 rooms').optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

