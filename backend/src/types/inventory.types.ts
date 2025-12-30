export type InventoryDTO = {
  id: string;
  productId: string;
  invoiceId?: string;
  billId?: string;
  quantity_moved: number;
  available_quantity: number;
  createdAt: string;
  updatedAt: string;
};

export type InventoryCreateInput = {
  productId: string;
  invoiceId?: string;
  billId?: string;
  quantity_moved: number; // positive for incoming stock; negative for outgoing
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