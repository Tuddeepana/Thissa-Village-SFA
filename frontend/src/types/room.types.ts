export type RoomType = 'VIP' | 'NORMAL';

export interface Room {
  id: string;
  name: string;
  roomTypeId: string;
  room_type: string; // The populated type name
  quantity: number;
  price_full_day: number;
  price_short_time: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateRoomPayload {
  name: string;
  roomTypeId: string;
  quantity: number;
  price_full_day: number;
  price_short_time: number;
}

export interface UpdateRoomPayload {
  name?: string;
  roomTypeId?: string;
  quantity?: number;
  price_full_day?: number;
  price_short_time?: number;
}

export interface RoomListResponse {
  success: boolean;
  rooms: Room[];
  total: number;
}

export interface ExpandedRoomItem {
  id: string;
  displayName: string;
  room_type: string;
  baseRoomId: string;
}

export interface ExpandedRoomListResponse {
  success: boolean;
  rooms: ExpandedRoomItem[];
  total: number;
}

