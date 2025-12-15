import { z } from "zod";

export const paginationSchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  search: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  litres: z.string().min(1, "Litres is required"),
  cost_price: z.number().nonnegative(),
  selling_price: z.number().nonnegative(),
  low_stock: z.number().int().nonnegative(),
  categoryId: z.string().uuid("Invalid categoryId"),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  litres: z.string().optional(),
  cost_price: z.number().nonnegative().optional(),
  selling_price: z.number().nonnegative().optional(),
  low_stock: z.number().int().nonnegative().optional(),
  categoryId: z.string().uuid().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
