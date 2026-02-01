import { z } from 'zod';

export const createUnitSchema = z.object({
  name: z.string().min(1, 'Unit name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional().nullable(),
});

export const updateUnitSchema = z.object({
  name: z.string().min(1, 'Unit name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional().nullable(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;

