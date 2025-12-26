import { z } from 'zod';

export const createInvoiceSchema = z.object({
  in_number: z.string().min(1),
  invoiceDate: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()),
});

export const updateInvoiceSchema = z.object({
  in_number: z.string().min(1).optional(),
  invoiceDate: z
    .preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date())
    .optional(),
});

export const invoiceQuerySchema = z.object({
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().optional(),
  search: z.string().optional(),
});
