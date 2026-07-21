import api from '../client';
import type { 
  RoomType, 
  CreateRoomTypePayload, 
  UpdateRoomTypePayload,
  RoomTypeListResponse 
} from '../../types/room-type.types';

export const roomTypeService = {
  create: async (data: CreateRoomTypePayload) => {
    const response = await api.post('/room-types', data);
    return response.data;
  },

  list: async (): Promise<RoomTypeListResponse> => {
    const response = await api.get('/room-types');
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; roomType: RoomType }> => {
    const response = await api.get(`/room-types/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateRoomTypePayload) => {
    const response = await api.put(`/room-types/${id}`, data);
    return response.data;
  },

  softDelete: async (id: string) => {
    const response = await api.delete(`/room-types/${id}`);
    return response.data;
  }
};
