import { Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { expenseService } from '../services/expense.service';
import {
  createExpenseTypeSchema,
  updateExpenseTypeSchema,
  expenseTypeQuerySchema,
  createExpenseSchema,
  bulkCreateExpenseSchema,
  expenseQuerySchema,
  pnlQuerySchema,
} from '../validations/expense.validation';

// ─── Helper: map service errors to HTTP status codes ───────────────────────
const handleServiceError = (err: any): never => {
  const msg: string = err?.message ?? 'An unexpected error occurred';

  if (
    msg.includes('already exists') ||
    msg.includes('Cannot delete') ||
    msg.includes('Invalid or deleted')
  ) {
    throw new AppError(msg, 409);
  }
  if (msg.includes('not found')) {
    throw new AppError(msg, 404);
  }
  throw new AppError(msg, 500);
};

// ═══════════════════════════════════════════
//  EXPENSE TYPES
// ═══════════════════════════════════════════

export const createExpenseType = async (req: Request, res: Response) => {
  const parsed = createExpenseTypeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues.map((i) => i.message).join(', '),
      400
    );
  }
  try {
    const et = await expenseService.createExpenseType(parsed.data);
    res.status(201).json({ success: true, data: et });
  } catch (err: any) {
    handleServiceError(err);
  }
};

export const listExpenseTypes = async (req: Request, res: Response) => {
  const parsed = expenseTypeQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError('Invalid query params', 400);
  const result = await expenseService.listExpenseTypes(parsed.data);
  res.json({ success: true, data: result.data, total: result.total });
};

export const getExpenseTypeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const et = await expenseService.getExpenseTypeById(id);
  if (!et) throw new AppError('Expense type not found', 404);
  res.json({ success: true, data: et });
};

export const updateExpenseType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = updateExpenseTypeSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation failed', 400);
  try {
    const et = await expenseService.updateExpenseType(id, parsed.data);
    res.json({ success: true, data: et });
  } catch (err: any) {
    handleServiceError(err);
  }
};

export const softDeleteExpenseType = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const et = await expenseService.softDeleteExpenseType(id);
    res.json({ success: true, data: et });
  } catch (err: any) {
    handleServiceError(err);
  }
};

export const restoreExpenseType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const et = await expenseService.restoreExpenseType(id);
  res.json({ success: true, data: et });
};

// ═══════════════════════════════════════════
//  EXPENSES
// ═══════════════════════════════════════════

export const createExpense = async (req: Request, res: Response) => {
  const parsed = createExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues.map((i) => i.message).join(', '),
      400
    );
  }
  try {
    const expense = await expenseService.createExpense(parsed.data);
    res.status(201).json({ success: true, data: expense });
  } catch (err: any) {
    handleServiceError(err);
  }
};

export const bulkCreateExpenses = async (req: Request, res: Response) => {
  const parsed = bulkCreateExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues.map((i) => i.message).join(', '),
      400
    );
  }
  try {
    const expenses = await expenseService.bulkCreateExpenses(parsed.data);
    res.status(201).json({ success: true, data: expenses });
  } catch (err: any) {
    handleServiceError(err);
  }
};

export const listExpenses = async (req: Request, res: Response) => {
  const parsed = expenseQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError('Invalid query params', 400);
  const result = await expenseService.listExpenses(parsed.data);
  res.json({
    success: true,
    data: result.data,
    pagination: {
      currentPage: result.page,
      pageSize: result.limit,
      totalRecords: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    },
  });
};

export const getExpenseById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const expense = await expenseService.getExpenseById(id);
  if (!expense) throw new AppError('Expense not found', 404);
  res.json({ success: true, data: expense });
};

export const deleteExpense = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const expense = await expenseService.deleteExpense(id);
    res.json({ success: true, data: expense });
  } catch (err: any) {
    handleServiceError(err);
  }
};

// ═══════════════════════════════════════════
//  P&L
// ═══════════════════════════════════════════

export const getPnL = async (req: Request, res: Response) => {
  const parsed = pnlQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError('Invalid query params', 400);
  const pnl = await expenseService.getPnL(parsed.data);
  res.json({ success: true, data: pnl });
};
