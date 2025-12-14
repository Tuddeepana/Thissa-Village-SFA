export interface PaginationQuery {
  page?: number; // 1-based
  limit?: number; // items per page
  search?: string; // name contains
  includeDeleted?: boolean; // include soft-deleted
}

export interface CategoryCreateInput {
  name: string;
  description?: string | null;
}

export interface CategoryUpdateInput {
  name?: string;
  description?: string | null;
  deletedAt?: Date | null;
}

export interface CategoryDTO {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}
