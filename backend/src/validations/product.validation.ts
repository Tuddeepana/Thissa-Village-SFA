import { z } from 'zod';
import * as PrismaClient from '@prisma/client';
// @ts-ignore
const { BottleVolume } = PrismaClient;

// Coerce string/number inputs into numbers
const decimalNumber = z.coerce.number();

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  litres: decimalNumber.min(0, 'Litres must be >= 0'),
  cost_price: decimalNumber.min(0, 'Cost price must be >= 0'),
  selling_price: decimalNumber.min(0, 'Selling price must be >= 0'),
  bottle_volume: z.nativeEnum(BottleVolume).optional(),
  low_stock: z.number().int().nonnegative('Low stock must be >= 0'),
  categoryId: z.string().uuid('Invalid category id'),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  litres: decimalNumber.min(0, 'Litres must be >= 0').optional(),
  cost_price: decimalNumber.min(0, 'Cost price must be >= 0').optional(),
  selling_price: decimalNumber.min(0, 'Selling price must be >= 0').optional(),
  bottle_volume: z.nativeEnum(BottleVolume).optional(),
  low_stock: z.number().int().nonnegative('Low stock must be >= 0').optional(),
  categoryId: z.string().uuid('Invalid category id').optional(),
});

export const productQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  search: z.string().optional(),
  categoryId: z.string().uuid('Invalid category id').optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;