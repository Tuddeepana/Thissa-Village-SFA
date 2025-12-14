import { apiClient } from '@/lib/api-client';

export interface CategoryDTO {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PaginatedCategories {
  success: boolean;
  data: CategoryDTO[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export const categoryService = {
  async list(params: { page?: number; limit?: number; search?: string; includeDeleted?: boolean } = {}) {
    const res = await apiClient.get<PaginatedCategories>('/categories', { params });
    return res.data;
  },

  async create(payload: CreateCategoryPayload) {
    const res = await apiClient.post<{ success: boolean; data: CategoryDTO }>('/categories', payload);
    return res.data.data;
  },
};
