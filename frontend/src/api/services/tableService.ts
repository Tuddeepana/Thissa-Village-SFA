import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type {
  RestaurantTable,
  CreateTablePayload,
  UpdateTablePayload,
  TableListResponse,
  ExpandedTableListResponse
} from '@/types/table.types';

export const tableService = {
  async list() {
    const res = await api.get<TableListResponse>(ENDPOINTS.tables);
    return res.data;
  },

  async getExpanded() {
    const res = await api.get<ExpandedTableListResponse>(`${ENDPOINTS.tables}/expanded`);
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get<{ success: boolean; data: RestaurantTable }>(`${ENDPOINTS.tables}/${id}`);
    return res.data.data;
  },

  async create(payload: CreateTablePayload) {
    const res = await api.post<{ success: boolean; data: RestaurantTable }>(ENDPOINTS.tables, payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateTablePayload) {
    const res = await api.put<{ success: boolean; data: RestaurantTable }>(`${ENDPOINTS.tables}/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string) {
    const res = await api.delete<{ success: boolean }>(`${ENDPOINTS.tables}/${id}`);
    return res.data;
  },
};

