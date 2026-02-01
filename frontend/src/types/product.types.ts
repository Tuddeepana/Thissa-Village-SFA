export type Product = {
  id: string;
  name: string;
  description?: string | null;
  barcode?: string | null;
  unit_type?: string | null;
  product_type?: 'HANDMADE' | 'PURCHASE';
  // Decimal fields are serialized as strings from backend; handle as string in UI and coerce as needed
  cost_price: string;
  foreigner_price: string;
  local_price: string;
  low_stock?: number | null;
  categoryId: string;
  categoryName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateProductPayload = {
  name: string;
  description?: string | null;
  barcode?: string | null;
  unit_type?: string | null;
  product_type?: 'HANDMADE' | 'PURCHASE';
  cost_price: string; // send as string
  foreigner_price: string; // send as string
  local_price: string; // send as string
  low_stock?: number | null;
  categoryId: string;
};

export type UpdateProductPayload = Partial<{
  name: string;
  description?: string | null;
  barcode?: string | null;
  unit_type?: string | null;
  product_type: 'HANDMADE' | 'PURCHASE';
  cost_price: string;
  foreigner_price: string;
  local_price: string;
  low_stock: number | null;
  categoryId: string;
}>;

export type ProductListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
};

export type PaginatedResult<T> = {
  success: boolean;
  data: {
    items: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
