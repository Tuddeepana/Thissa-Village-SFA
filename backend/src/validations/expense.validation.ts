import { z } from 'zod';

// ── Expense Type ──
export const createExpenseTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or less'),
});

export const updateExpenseTypeSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
});

export const expenseTypeQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  search: z.string().trim().optional(),
  includeDeleted: z.preprocess(
    (val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    },
    z.boolean().optional()
  ),
});

// ── Expense ──
export const createExpenseSchema = z.object({
  amount: z
    .union([z.number().positive('Amount must be greater than 0'), z.string().min(1)])
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      { message: 'Amount must be a positive number' }
    ),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
  date: z
    .union([z.string().min(1, 'Date is required'), z.date()])
    .refine(
      (val) => !isNaN(new Date(val as string).getTime()),
      { message: 'Invalid date format' }
    ),
  expenseTypeId: z
    .string()
    .uuid('Invalid expense type ID'),
});

export const bulkCreateExpenseSchema = z.object({
  expenses: z
    .array(createExpenseSchema)
    .min(1, 'At least one expense is required')
    .max(100, 'Cannot bulk create more than 100 expenses at once'),
});

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  dateFrom: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(new Date(val).getTime()),
      { message: 'Invalid dateFrom format' }
    ),
  dateTo: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(new Date(val).getTime()),
      { message: 'Invalid dateTo format' }
    ),
  expenseTypeId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});

// ── P&L ──
export const pnlQuerySchema = z.object({
  dateFrom: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(new Date(val).getTime()),
      { message: 'Invalid dateFrom format' }
    ),
  dateTo: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(new Date(val).getTime()),
      { message: 'Invalid dateTo format' }
    ),
});
