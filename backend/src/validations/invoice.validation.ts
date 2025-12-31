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
  // Additional filters to support frontend query params
  category: z.string().optional(),
  month: z.coerce.number().min(0).max(11).optional(),
  year: z.coerce.number().min(1970).optional(),
  dateFrom: z
    .preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date())
    .optional(),
  dateTo: z
    .preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date())
    .optional(),
});

export const createInvoiceWithItemsSchema = z.object({
  in_number: z.string().min(1),
  invoiceDate: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()),
  // frontend must provide subtotal (sum of item unit price * qty)
  subtotal: z.coerce.number().nonnegative(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantityMoved: z.coerce.number().int(),
      })
    )
    .min(1),
});
