export type InvoiceDTO = {
  id: string;
  in_number: string;
  invoiceDate: string; // ISO string
  createdAt: string;
  updatedAt: string;
};

export type InvoiceCreateInput = {
  in_number: string;
  invoiceDate: string | Date;
};

export type InvoiceUpdateInput = Partial<{
  in_number: string;
  invoiceDate: string | Date;
}>;

export type InvoiceListQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};

// Inventory DTO
export type InventoryDTO = {
  id: string;
  productId: string;
  invoiceId: string;
  quantity_moved: number;
  available_quantity: number;
  createdAt: string;
  updatedAt: string;
};

// Create invoice with items
export type InvoiceItemInput = {
  productId: string;
  quantityMoved: number;
};

export type InvoiceCreateWithItemsInput = InvoiceCreateInput & {
  items: InvoiceItemInput[];
};
