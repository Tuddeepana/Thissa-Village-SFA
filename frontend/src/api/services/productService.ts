import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/types/user.types';
import type { Product, CreateProductPayload, UpdateProductPayload, ProductListQuery, PaginatedResult } from '@/types/product.types';

export const productService = {
  async list(query: ProductListQuery = {}) {
    const res = await api.get<
      | PaginatedResult<Product>
      | ApiResponse<{
          items: Product[];
          page: number;
          limit: number;
          total: number;
          totalPages?: number;
        }>
    >(
      ENDPOINTS.products,
      { params: query, meta: { showLoader: 'local', loaderKey: 'products' } }
    );
    const payload = res.data as any;
    const dataField = payload?.data;

    // Items can come as an array in payload.data or as data.items
    const items: Product[] = Array.isArray(dataField)
      ? dataField
      : (dataField?.items ?? dataField?.data ?? payload?.items ?? []);

    const page: number = payload?.page ?? dataField?.page ?? query.page ?? 1;
  const limit: number = (payload?.limit ?? dataField?.limit ?? query.limit ?? items.length) || 10;
    const total: number = payload?.total ?? dataField?.total ?? items.length;
    const totalPages: number = payload?.totalPages ?? dataField?.totalPages ?? Math.max(1, Math.ceil((total || 1) / (limit || 1)));

    return { items, page, limit, total, totalPages };
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<Product>>(`${ENDPOINTS.products}/${id}`);
    return (res.data as any).data ?? res.data;
  },

  async create(payload: CreateProductPayload) {
    const res = await api.post<ApiResponse<Product>>(ENDPOINTS.products, payload);
    return (res.data as any).data ?? res.data;
  },

  async update(id: string, payload: UpdateProductPayload) {
    const res = await api.put<ApiResponse<Product>>(`${ENDPOINTS.products}/${id}`, payload);
    return (res.data as any).data ?? res.data;
  },

  async delete(id: string) {
    const res = await api.delete<ApiResponse<Product>>(`${ENDPOINTS.products}/${id}`);
    return (res.data as any).data ?? res.data;
  },
};
