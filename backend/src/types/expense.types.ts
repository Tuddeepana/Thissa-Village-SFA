// ── Expense Type ──
export type ExpenseTypeDTO = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type CreateExpenseTypeInput = {
  name: string;
};

export type UpdateExpenseTypeInput = Partial<{
  name: string;
}>;

export type ExpenseTypeListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
};

// ── Expense ──
export type ExpenseDTO = {
  id: string;
  amount: string; // Decimal as string
  description?: string | null;
  date: string; // ISO
  expenseTypeId: string;
  expenseType?: ExpenseTypeDTO;
  createdAt: string;
  updatedAt: string;
};

export type CreateExpenseInput = {
  amount: number | string;
  description?: string | null;
  date: string | Date;
  expenseTypeId: string;
};

export type BulkCreateExpenseInput = {
  expenses: CreateExpenseInput[];
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

export type PnLResponse = {
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
