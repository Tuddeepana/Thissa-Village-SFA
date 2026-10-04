export type InventoryDTO = {
  id: string;
  productId: string;
  invoiceId?: string;
  billId?: string;
  quantity_moved: number;
  available_quantity: number;
  unit_price?: string | null; // Price snapshot at time of sale
  createdAt: string;
  updatedAt: string;
};

export type InventoryCreateInput = {
  productId: string;
  invoiceId?: string;
  billId?: string;
  quantity_moved: number; // positive for incoming stock; negative for outgoing
  unit_price?: number | null; // Price snapshot at time of sale (bills only)
};

export type InventoryListQuery = {
  page?: number;
  limit?: number;
  productId?: string;
  invoiceId?: string;
  billId?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};