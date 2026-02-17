// ── Expense Type ──
export interface ExpenseType {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export type CreateExpenseTypePayload = {
  name: string;
};

// ── Expense ──
export interface Expense {
  id: string;
  amount: string;
  description?: string | null;
  date: string;
  expenseTypeId: string;
  expenseType?: ExpenseType;
  createdAt: string;
  updatedAt: string;
}

export type CreateExpensePayload = {
  amount: number | string;
  description?: string | null;
  date: string;
  expenseTypeId: string;
};

export type BulkCreateExpensePayload = {
  expenses: CreateExpensePayload[];
};

export type ExpenseListQuery = {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  expenseTypeId?: string;
  search?: string;
};

// ── P&L ──
export type PnLQuery = {
  dateFrom?: string;
  dateTo?: string;
};

export type PnLData = {
  totalRevenue: string;
  totalExpenses: string;
  netProfitOrLoss: string;
  revenueBreakdown: {
    billCount: number;
    totalBillAmount: string;
  };
  expenseBreakdown: {
    expenseCount: number;
    byType: Array<{
      expenseTypeId: string;
      expenseTypeName: string;
      total: string;
      count: number;
    }>;
  };
  dateFrom: string;
  dateTo: string;
};
