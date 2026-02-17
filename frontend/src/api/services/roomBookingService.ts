import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type {
  RoomBooking,
  CreateRoomBookingPayload,
  UpdateRoomBookingPayload,
  RoomBookingListResponse,
  AvailableRoomsResponse
} from '@/types/room-booking.types';

export const roomBookingService = {
  async list(status?: string) {
    const params = status ? { status } : {};
    const res = await api.get<RoomBookingListResponse>(ENDPOINTS.roomBookings, { params });
    return res.data;
  },

  async getAvailableRooms(checkInDate: string, checkOutDate: string) {
    const res = await api.get<AvailableRoomsResponse>(`${ENDPOINTS.roomBookings}/available`, {
      params: { checkInDate, checkOutDate }
    });
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get<{ success: boolean; data: RoomBooking }>(`${ENDPOINTS.roomBookings}/${id}`);
    return res.data.data;
  },

  async create(payload: CreateRoomBookingPayload) {
    const res = await api.post<{ success: boolean; data: RoomBooking }>(ENDPOINTS.roomBookings, payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateRoomBookingPayload) {
    const res = await api.put<{ success: boolean; data: RoomBooking }>(`${ENDPOINTS.roomBookings}/${id}`, payload);
    return res.data.data;
  },

  async checkOut(id: string) {
    const res = await api.patch<{ success: boolean; data: RoomBooking }>(`${ENDPOINTS.roomBookings}/${id}/checkout`);
    return res.data.data;
  },

  async cancel(id: string) {
    const res = await api.patch<{ success: boolean; data: RoomBooking }>(`${ENDPOINTS.roomBookings}/${id}/cancel`);
    return res.data.data;
  },
};

