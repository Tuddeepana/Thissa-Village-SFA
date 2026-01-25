export interface ProductDTO {
  id: string;
  name: string;
  description?: string | null;
  cost_price: string; // Decimal
  foreigner_price: string; // Decimal
  local_price: string; // Decimal
  low_stock?: number | null;
  categoryId: string;
  categoryName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCreateInput = {
  name: string;
  description?: string | null;
  cost_price: number | string;
  foreigner_price: number | string;
  local_price: number | string;
  low_stock?: number | null;
  categoryId: string;
};

export type ProductUpdateInput = Partial<{
  name: string;
  description: string | null;
  cost_price: number | string;
  foreigner_price: number | string;
  local_price: number | string;
  low_stock: number | null;
  categoryId: string;
}>;

export type PaginationQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};