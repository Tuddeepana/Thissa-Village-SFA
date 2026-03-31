export type BillDTO = {
  id: string;
  bill_number: string;
  date: string; // ISO
  payment_method: string;
  customer_name?: string | null;
  total: string; // Decimal as string
  cashier_name: string;
  item_count: number;
  credit_note?: string | null;
  cash_given: string; // Decimal as string
  balance_given: string; // Decimal as string
  tax?: string | null; // Decimal as string
  createdAt: string;
  updatedAt: string;
};

export type BillItemInput = {
  productId: string;
  quantityMoved: number; // for bills, typically positive in UI; will be stored negative in inventory
};

export type BillCreateInput = {
  bill_number?: string;
  date: string | Date;
  payment_method: string;
  customer_name?: string | null;
  total: number | string;
  cashier_name: string;
  item_count: number;
  credit_note?: string | null;
  cash_given: number | string;
  balance_given: number | string;
  tax?: number | string | null;
};

export type BillCreateWithItemsInput = BillCreateInput & {
  items: BillItemInput[];
};

export type BillListQuery = {
  billNo?: string;
  dateFrom?: string;
  dateTo?: string;
  today?: boolean;
  paymentMethod?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
};

export type PaginatedResult<T> = {
  data: T[];
  page: number;
  // preferred name
  pageSize: number;
  // backward-compatible alias
  limit: number;
  total: number;
};

export type CardSummary = {
  totalBills: number;
  totalRevenue: string; // decimal as string
  cash: string;
  card: string;
  credit: string;
  other?: Record<string, string>;
};
