import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type {
  ExpenseType,
  CreateExpenseTypePayload,
  Expense,
  CreateExpensePayload,
  BulkCreateExpensePayload,
  ExpenseListQuery,
  PnLQuery,
  PnLData,
} from '@/types/expense.types';

export const expenseService = {
  // ── Expense Types ──
  async listTypes(query: { search?: string; includeDeleted?: boolean } = {}) {
    const res = await api.get(ENDPOINTS.expenses.types, {
      params: query,
      meta: { showLoader: 'local', loaderKey: 'expense-types' },
    });
    const payload = res.data as any;
    return {
      expenseTypes: (payload.data ?? []) as ExpenseType[],
      total: payload.total,
    };
  },

  async createType(payload: CreateExpenseTypePayload) {
    const res = await api.post(ENDPOINTS.expenses.types, payload);
    return res.data.data as ExpenseType;
  },

  async deleteType(id: string) {
    const res = await api.delete(ENDPOINTS.expenses.typeById(id));
    return res.data.data as ExpenseType;
  },

  // ── Expenses ──
  async listExpenses(query: ExpenseListQuery = {}) {
    const res = await api.get(ENDPOINTS.expenses.base, {
      params: query,
      meta: { showLoader: 'local', loaderKey: 'expenses' },
    });
    const payload = res.data as any;
    return {
      expenses: (payload.data ?? []) as Expense[],
      pagination: payload.pagination as {
        currentPage: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
      },
    };
  },

  async createExpense(payload: CreateExpensePayload) {
    const res = await api.post(ENDPOINTS.expenses.base, payload);
    return res.data.data as Expense;
  },

  async bulkCreateExpenses(payload: BulkCreateExpensePayload) {
    const res = await api.post(ENDPOINTS.expenses.bulk, payload);
    return res.data.data as Expense[];
  },

  async deleteExpense(id: string) {
    const res = await api.delete(ENDPOINTS.expenses.byId(id));
    return res.data.data as Expense;
  },

  // ── P&L ──
  async getPnL(query: PnLQuery = {}) {
    const res = await api.get(ENDPOINTS.expenses.pnl, {
      params: query,
      meta: { showLoader: 'local', loaderKey: 'pnl' },
    });
    return res.data.data as PnLData;
  },
};
