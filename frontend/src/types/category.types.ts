export interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export type CategoryListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
};

export type CreateCategoryPayload = {
  name: string;
  description?: string;
};

export type UpdateCategoryPayload = Partial<{
  name: string;
  description?: string | null;
  deletedAt?: string | null;
}>;