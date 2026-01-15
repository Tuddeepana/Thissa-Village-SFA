export type Product = {
  id: string;
  name: string;
  description?: string | null;
  barcode?: string | null;
  // Decimal fields are serialized as strings from backend; handle as string in UI and coerce as needed
  litres: string; // stored as litres (e.g., "0.75")
  cost_price: string;
  selling_price: string;
  low_stock: number;
  categoryId: string;
  categoryName?: string;
  createdAt?: string;
  updatedAt?: string;
  bottle_volume?: 'L' | 'ML' | string;
};

export type CreateProductPayload = {
  name: string;
  description?: string | null;
  barcode?: string | null;
  litres: string; // send as string
  cost_price: string; // send as string
  selling_price: string; // send as string
  low_stock: number;
  categoryId: string;
  bottle_volume?: 'L' | 'ML' | string;
};

export type UpdateProductPayload = Partial<{
  name: string;
  description?: string | null;
  barcode?: string | null;
  litres: string;
  cost_price: string;
  selling_price: string;
  low_stock: number;
  categoryId: string;
  bottle_volume?: 'L' | 'ML' | string;
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
