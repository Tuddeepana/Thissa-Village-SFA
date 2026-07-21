import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { RoomTypeConfig, RoomTypeListResponse } from '@/types/room-type.types';

export const roomTypeService = {
  async list() {
    const res = await api.get<RoomTypeListResponse>(ENDPOINTS.roomTypes);
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get<{ success: boolean; data: RoomTypeConfig }>(`${ENDPOINTS.roomTypes}/${id}`);
    return res.data.data;
  },

  async create(payload: Omit<RoomTypeConfig, 'id' | 'createdAt'>) {
    const res = await api.post<{ success: boolean; data: RoomTypeConfig }>(ENDPOINTS.roomTypes, payload);
    return res.data.data;
  },

  async update(id: string, payload: Partial<RoomTypeConfig>) {
    const res = await api.put<{ success: boolean; data: RoomTypeConfig }>(`${ENDPOINTS.roomTypes}/${id}`, payload);
    return res.data.data;
  },

  async softDelete(id: string) {
    const res = await api.delete(`${ENDPOINTS.roomTypes}/${id}`);
    return res.data;
  },
};
