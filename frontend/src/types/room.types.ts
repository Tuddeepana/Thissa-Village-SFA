export type RoomType = string;

export interface Room {
  id: string;
  name: string;
  room_types: string[];
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateRoomPayload {
  name: string;
  room_types: string[];
  quantity: number;
}

export interface UpdateRoomPayload {
  name?: string;
  room_types?: string[];
  quantity?: number;
}

export interface RoomListResponse {
  success: boolean;
  rooms: Room[];
  total: number;
}

export interface ExpandedRoomItem {
  id: string;
  displayName: string;
  room_types: string[];
  baseRoomId: string;
}

export interface ExpandedRoomListResponse {
  success: boolean;
  rooms: ExpandedRoomItem[];
  total: number;
}
