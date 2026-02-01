import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { Unit, CreateUnitPayload, UpdateUnitPayload, UnitListResponse } from '@/types/unit.types';

export const unitService = {
  async list() {
    const res = await api.get<UnitListResponse>(ENDPOINTS.units);
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get<{ success: boolean; data: Unit }>(`${ENDPOINTS.units}/${id}`);
    return res.data.data;
  },

  async create(payload: CreateUnitPayload) {
    const res = await api.post<{ success: boolean; data: Unit }>(ENDPOINTS.units, payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateUnitPayload) {
    const res = await api.put<{ success: boolean; data: Unit }>(`${ENDPOINTS.units}/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string) {
    const res = await api.delete<{ success: boolean }>(`${ENDPOINTS.units}/${id}`);
    return res.data;
  },
};

