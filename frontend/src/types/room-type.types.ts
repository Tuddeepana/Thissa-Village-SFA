export interface RoomType {
  id: string;
  type: string;
  description?: string | null;
  price_full_day: number;
  price_short_time: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomTypePayload {
  type: string;
  description?: string;
  price_full_day: number;
  price_short_time: number;
}

export interface UpdateRoomTypePayload {
  type?: string;
  description?: string;
  price_full_day?: number;
  price_short_time?: number;
}

export interface RoomTypeListResponse {
  success: boolean;
  roomTypes: RoomType[];
  total: number;
}
