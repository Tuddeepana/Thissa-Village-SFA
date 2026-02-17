import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type {
  Room,
  CreateRoomPayload,
  UpdateRoomPayload,
  RoomListResponse,
  ExpandedRoomListResponse
} from '@/types/room.types';

export const roomService = {
  async list() {
    const res = await api.get<RoomListResponse>(ENDPOINTS.rooms);
    return res.data;
  },

  async getExpanded() {
    const res = await api.get<ExpandedRoomListResponse>(`${ENDPOINTS.rooms}/expanded`);
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get<{ success: boolean; data: Room }>(`${ENDPOINTS.rooms}/${id}`);
    return res.data.data;
  },

  async create(payload: CreateRoomPayload) {
    const res = await api.post<{ success: boolean; data: Room }>(ENDPOINTS.rooms, payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateRoomPayload) {
    const res = await api.put<{ success: boolean; data: Room }>(`${ENDPOINTS.rooms}/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string) {
    const res = await api.delete<{ success: boolean }>(`${ENDPOINTS.rooms}/${id}`);
    return res.data;
  },
};

