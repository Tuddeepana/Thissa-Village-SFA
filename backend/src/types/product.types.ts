export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string; // name contains
}

export interface ProductCreateInput {
  name: string;
  description?: string | null;
  litres: string; // keep as string as per schema
  cost_price: number;
  selling_price: number;
  low_stock: number;
  categoryId: string;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string | null;
  litres?: string;
  cost_price?: number;
  selling_price?: number;
  low_stock?: number;
  categoryId?: string;
}

export interface ProductDTO {
  id: string;
  name: string;
  description?: string | null;
  litres: string;
  cost_price: number;
  selling_price: number;
  low_stock: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}
