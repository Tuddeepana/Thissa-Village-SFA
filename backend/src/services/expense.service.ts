import prisma from '../lib/prisma';
import type {
  ExpenseTypeDTO,
  CreateExpenseTypeInput,
  UpdateExpenseTypeInput,
  ExpenseTypeListQuery,
  ExpenseDTO,
  CreateExpenseInput,
  BulkCreateExpenseInput,
  ExpenseListQuery,
  PnLQuery,
  PnLResponse,
} from '../types/expense.types';

class ExpenseService {
  // ═══════════════════════════════════════════
  //  EXPENSE TYPES
  // ═══════════════════════════════════════════

  async createExpenseType(input: CreateExpenseTypeInput): Promise<ExpenseTypeDTO> {
    const existing = await prisma.expenseType.findUnique({ where: { name: input.name } });
    if (existing) throw new Error('Expense type with this name already exists');

    const expenseType = await prisma.expenseType.create({
      data: { name: input.name },
    });
    return expenseType as unknown as ExpenseTypeDTO;
  }

  async listExpenseTypes(query: ExpenseTypeListQuery = {}) {
    const { page = 1, limit = 50, search, includeDeleted = false } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.expenseType.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.expenseType.count({ where }),
    ]);

    return { data: data as unknown as ExpenseTypeDTO[], page, limit, total };
  }

  async getExpenseTypeById(id: string): Promise<ExpenseTypeDTO | null> {
    const et = await prisma.expenseType.findUnique({ where: { id } });
    return et as unknown as ExpenseTypeDTO | null;
  }

  async updateExpenseType(id: string, input: UpdateExpenseTypeInput): Promise<ExpenseTypeDTO> {
    const et = await prisma.expenseType.update({
      where: { id },
      data: { ...input },
    });
    return et as unknown as ExpenseTypeDTO;
  }

  async softDeleteExpenseType(id: string): Promise<ExpenseTypeDTO> {
    const et = await prisma.expenseType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return et as unknown as ExpenseTypeDTO;
  }

  async restoreExpenseType(id: string): Promise<ExpenseTypeDTO> {
    const et = await prisma.expenseType.update({
      where: { id },
      data: { deletedAt: null },
    });
    return et as unknown as ExpenseTypeDTO;
  }

  // ═══════════════════════════════════════════
  //  EXPENSES
  // ═══════════════════════════════════════════

  async createExpense(input: CreateExpenseInput): Promise<ExpenseDTO> {
    const expense = await prisma.expense.create({
      data: {
        amount: Number(input.amount).toFixed(2),
        description: input.description ?? null,
        date: new Date(input.date as string),
        expenseTypeId: input.expenseTypeId,
      },
      include: { expenseType: true },
    });
    return expense as unknown as ExpenseDTO;
  }

  async bulkCreateExpenses(input: BulkCreateExpenseInput): Promise<ExpenseDTO[]> {
    const created: ExpenseDTO[] = [];
    for (const exp of input.expenses) {
      const expense = await prisma.expense.create({
        data: {
          amount: Number(exp.amount).toFixed(2),
          description: exp.description ?? null,
          date: new Date(exp.date as string),
          expenseTypeId: exp.expenseTypeId,
        },
        include: { expenseType: true },
      });
      created.push(expense as unknown as ExpenseDTO);
    }
    return created;
  }

  async listExpenses(query: ExpenseListQuery = {}) {
    const { page = 1, limit = 20, dateFrom, dateTo, expenseTypeId, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }

    if (expenseTypeId) {
      where.expenseTypeId = expenseTypeId;
    }

    if (search) {
      where.description = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { expenseType: true },
      }),
      prisma.expense.count({ where }),
    ]);

    return { data: data as unknown as ExpenseDTO[], page, limit, total };
  }

  async getExpenseById(id: string): Promise<ExpenseDTO | null> {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { expenseType: true },
    });
    return expense as unknown as ExpenseDTO | null;
  }

  async deleteExpense(id: string): Promise<ExpenseDTO> {
    const expense = await prisma.expense.delete({
      where: { id },
      include: { expenseType: true },
    });
    return expense as unknown as ExpenseDTO;
  }

  // ═══════════════════════════════════════════
  //  P&L (PROFIT & LOSS)
  // ═══════════════════════════════════════════

  async getPnL(query: PnLQuery = {}): Promise<PnLResponse> {
    // Default to current month if no dates provided
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : defaultFrom;
    const dateTo = query.dateTo
      ? (() => {
          const d = new Date(query.dateTo);
          d.setHours(23, 59, 59, 999);
          return d;
        })()
      : defaultTo;

    // Revenue from bills
    const billAgg = await prisma.bill.aggregate({
      where: { date: { gte: dateFrom, lte: dateTo } },
      _sum: { total: true },
      _count: { id: true },
    });

    const totalRevenue = Number(billAgg._sum.total ?? 0);
    const billCount = billAgg._count.id;

    // Expenses
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: dateFrom, lte: dateTo } },
      include: { expenseType: true },
    });

    let totalExpenses = 0;
    const byTypeMap = new Map<
      string,
      { expenseTypeId: string; expenseTypeName: string; total: number; count: number }
    >();

    for (const exp of expenses) {
      const amount = Number(exp.amount);
      totalExpenses += amount;

      const existing = byTypeMap.get(exp.expenseTypeId);
      if (existing) {
        existing.total += amount;
        existing.count += 1;
      } else {
        byTypeMap.set(exp.expenseTypeId, {
          expenseTypeId: exp.expenseTypeId,
          expenseTypeName: (exp as any).expenseType?.name ?? 'Unknown',
          total: amount,
          count: 1,
        });
      }
    }

    const netProfitOrLoss = totalRevenue - totalExpenses;

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      netProfitOrLoss: netProfitOrLoss.toFixed(2),
      revenueBreakdown: {
        billCount,
        totalBillAmount: totalRevenue.toFixed(2),
      },
      expenseBreakdown: {
        expenseCount: expenses.length,
        byType: Array.from(byTypeMap.values()).map((v) => ({
          ...v,
          total: v.total.toFixed(2),
        })),
      },
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    };
  }
}

export const expenseService = new ExpenseService();
