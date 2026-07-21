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
