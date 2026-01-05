export type InvoiceDTO = {
  id: string;
  in_number: string;
  invoiceDate: string; // ISO string
  subtotal: number; // Decimal as string
  discount: number; // Decimal as number
  paid_status: 'PAID' | 'PENDING';
  createdAt: string;
  updatedAt: string;
};

export type InvoiceCreateInput = {
  in_number: string;
  invoiceDate: string | Date;
  subtotal?: number | string; // optional on create, will be computed server-side if omitted
  discount?: number | string;
  paid_status?: 'PAID' | 'PENDING';
};

export type InvoiceUpdateInput = Partial<{
  in_number: string;
  invoiceDate: string | Date;
  subtotal: number | string;
  discount: number | string;
  paid_status: 'PAID' | 'PENDING';
}>;

export type InvoiceListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  month?: number; // 0-11
  year?: number; // e.g., 2025
  dateFrom?: string | Date;
  dateTo?: string | Date;
  noPagination?: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};

// Product details as included on an invoice
export type InvoiceProductDetail = {
  productId: string;
  name?: string | null;
  categoryName?: string | null;
  litres?: string | null; // Decimal as string
  bottle_volume?: string | null;
  cost_price?: string | null;
  selling_price?: string | null;
  quantity_moved: number;
};

export type InvoiceWithProductsDTO = {
  id: string;
  in_number: string;
  invoiceDate: string; // ISO
  createdAt: string;
  updatedAt: string;
  subtotal: string;
  discount: string;
  paid_status: 'PAID' | 'PENDING';
  itemCount: number;
  products: InvoiceProductDetail[];
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
