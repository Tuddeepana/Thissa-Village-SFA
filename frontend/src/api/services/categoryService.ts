import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/types/user.types';
import type { Category, CategoryListQuery, CreateCategoryPayload, UpdateCategoryPayload } from '@/types/category.types';

export const categoryService = {
  async list(query: CategoryListQuery = {}) {
    const res = await api.get<ApiResponse<{ data: Category[]; page?: number; limit?: number; total?: number } | any>>(ENDPOINTS.categories, {
      params: query,
    });
    // Controller returns { success, data, page, limit, total }
    const payload = res.data as any;
    const categories: Category[] = payload.data ?? payload?.data ?? [];
    return {
      categories,
      page: payload.page,
      limit: payload.limit,
      total: payload.total,
    };
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<Category>>(`${ENDPOINTS.categories}/${id}`);
    return res.data.data;
  },

  async create(payload: CreateCategoryPayload) {
    const res = await api.post<ApiResponse<Category>>(ENDPOINTS.categories, payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateCategoryPayload) {
    const res = await api.put<ApiResponse<Category>>(`${ENDPOINTS.categories}/${id}`, payload);
    return res.data.data;
  },

  async softDelete(id: string) {
    const res = await api.delete<ApiResponse<Category>>(`${ENDPOINTS.categories}/${id}`);
    return res.data.data;
  },

  async restore(id: string) {
    const res = await api.post<ApiResponse<Category>>(`${ENDPOINTS.categories}/${id}/restore`);
    return res.data.data;
  },

  async hardDelete(id: string) {
    const res = await api.delete<ApiResponse<Category>>(`${ENDPOINTS.categories}/${id}/hard`);
    return res.data.data;
  },
};
