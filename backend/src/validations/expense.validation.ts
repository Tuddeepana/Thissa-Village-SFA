import { z } from 'zod';

// ── Expense Type ──
export const createExpenseTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

export const updateExpenseTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const expenseTypeQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
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
  amount: z.union([z.number().positive(), z.string().min(1)]),
  description: z.string().max(500).optional().nullable(),
  date: z.union([z.string(), z.date()]),
  expenseTypeId: z.string().uuid(),
});

export const bulkCreateExpenseSchema = z.object({
  expenses: z.array(createExpenseSchema).min(1, 'At least one expense is required'),
});

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  expenseTypeId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// ── P&L ──
export const pnlQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
