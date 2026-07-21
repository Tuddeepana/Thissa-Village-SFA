export interface RoomTypeConfig {
  id: string;
  type: string;
  price_full_day: number;
  price_short_time: number;
  description?: string | null;
  createdAt?: string;
}

export interface RoomTypeListResponse {
  success?: boolean;
  roomTypes: RoomTypeConfig[];
  total?: number;
}
