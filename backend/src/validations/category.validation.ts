import { z } from "zod";

export const paginationSchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  search: z.string().optional(),
  includeDeleted: z
    .string()
    .optional()
    .transform((v) => (v ? v === "true" : undefined)),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  deletedAt: z
    .preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date().optional().nullable()),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
