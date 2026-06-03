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
    // Check for existing (case-insensitive)
    const existing = await prisma.expenseType.findFirst({
      where: {
        name: { equals: input.name.trim(), mode: 'insensitive' },
        deletedAt: null,
      },
    });
    if (existing) throw new Error(`Expense type "${input.name}" already exists`);

    const expenseType = await prisma.expenseType.create({
      data: { name: input.name.trim() },
    });
    return expenseType as unknown as ExpenseTypeDTO;
  }

  async listExpenseTypes(query: ExpenseTypeListQuery = {}) {
    const { page = 1, limit = 100, search, includeDeleted = false } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (search) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.expenseType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.expenseType.count({ where }),
    ]);

    return { data: data as unknown as ExpenseTypeDTO[], page, limit, total };
  }

  async getExpenseTypeById(id: string): Promise<ExpenseTypeDTO | null> {
    const et = await prisma.expenseType.findUnique({ where: { id } });
    return et as unknown as ExpenseTypeDTO | null;
  }

  async updateExpenseType(id: string, input: UpdateExpenseTypeInput): Promise<ExpenseTypeDTO> {
    // Check uniqueness if name is being changed
    if (input.name) {
      const conflict = await prisma.expenseType.findFirst({
        where: {
          name: { equals: input.name.trim(), mode: 'insensitive' },
          deletedAt: null,
          NOT: { id },
        },
      });
      if (conflict) throw new Error(`Expense type "${input.name}" already exists`);
    }
    const et = await prisma.expenseType.update({
      where: { id },
      data: { ...(input.name ? { name: input.name.trim() } : {}) },
    });
    return et as unknown as ExpenseTypeDTO;
  }

  async softDeleteExpenseType(id: string): Promise<ExpenseTypeDTO> {
    // Check that no active expenses reference this type
    const activeCount = await prisma.expense.count({ where: { expenseTypeId: id } });
    if (activeCount > 0) {
      throw new Error(
        `Cannot delete: ${activeCount} expense(s) use this type. Delete those expenses first.`
      );
    }
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
    // Validate expense type exists and is not deleted
    const et = await prisma.expenseType.findFirst({
      where: { id: input.expenseTypeId, deletedAt: null },
    });
    if (!et) throw new Error('Expense type not found or has been deleted');

    const expense = await prisma.expense.create({
      data: {
        amount: Number(input.amount).toFixed(2),
        description: input.description?.trim() ?? null,
        date: new Date(input.date as string),
        expenseTypeId: input.expenseTypeId,
      },
      include: { expenseType: true },
    });
    return expense as unknown as ExpenseDTO;
  }

  async bulkCreateExpenses(input: BulkCreateExpenseInput): Promise<ExpenseDTO[]> {
    if (!input.expenses || input.expenses.length === 0) {
      throw new Error('At least one expense is required');
    }

    // Validate all expense types up front (single query)
    const typeIds = [...new Set(input.expenses.map((e) => e.expenseTypeId))];
    const validTypes = await prisma.expenseType.findMany({
      where: { id: { in: typeIds }, deletedAt: null },
      select: { id: true },
    });
    const validTypeIds = new Set(validTypes.map((t) => t.id));
    const invalidIds = typeIds.filter((id) => !validTypeIds.has(id));
    if (invalidIds.length > 0) {
      throw new Error(`Invalid or deleted expense type(s): ${invalidIds.join(', ')}`);
    }

    // Use a transaction for atomicity
    const created = await prisma.$transaction(
      input.expenses.map((exp) =>
        prisma.expense.create({
          data: {
            amount: Number(exp.amount).toFixed(2),
            description: exp.description?.trim() ?? null,
            date: new Date(exp.date as string),
            expenseTypeId: exp.expenseTypeId,
          },
          include: { expenseType: true },
        })
      )
    );

    return created as unknown as ExpenseDTO[];
  }

  async listExpenses(query: ExpenseListQuery = {}) {
    const { page = 1, limit = 20, dateFrom, dateTo, expenseTypeId, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Date range filter
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        where.date.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }

    // Expense type filter
    if (expenseTypeId) {
      where.expenseTypeId = expenseTypeId;
    }

    // Text search across description and expense type name
    if (search && search.trim()) {
      where.OR = [
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { expenseType: { name: { contains: search.trim(), mode: 'insensitive' } } },
      ];
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
    // Verify expense exists before deleting
    const exists = await prisma.expense.findUnique({ where: { id } });
    if (!exists) throw new Error('Expense not found');

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
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const dateFrom = query.dateFrom
      ? (() => {
          const d = new Date(query.dateFrom);
          d.setHours(0, 0, 0, 0);
          return d;
        })()
      : defaultFrom;

    const dateTo = query.dateTo
      ? (() => {
          const d = new Date(query.dateTo);
          d.setHours(23, 59, 59, 999);
          return d;
        })()
      : defaultTo;

    // Run revenue and expense queries in parallel
    const [billAgg, expenses] = await Promise.all([
      // Revenue: sum of all bills in the period
      prisma.bill.aggregate({
        where: {
          date: { gte: dateFrom, lte: dateTo },
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Expenses: all expenses with their types in the period
      prisma.expense.findMany({
        where: {
          date: { gte: dateFrom, lte: dateTo },
        },
        include: { expenseType: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    const totalRevenue = Number(billAgg._sum.total ?? 0);
    const billCount = billAgg._count.id;

    // Aggregate expenses by type
    let totalExpenses = 0;
    const byTypeMap = new Map<
      string,
      { expenseTypeId: string; expenseTypeName: string; total: number; count: number }
    >();

    for (const exp of expenses) {
      const amount = Number(exp.amount);
      totalExpenses += amount;

      const typeName = (exp as any).expenseType?.name ?? 'Unknown';
      const existing = byTypeMap.get(exp.expenseTypeId);
      if (existing) {
        existing.total += amount;
        existing.count += 1;
      } else {
        byTypeMap.set(exp.expenseTypeId, {
          expenseTypeId: exp.expenseTypeId,
          expenseTypeName: typeName,
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
        byType: Array.from(byTypeMap.values())
          .sort((a, b) => b.total - a.total) // Sort by highest expense first
          .map((v) => ({
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
