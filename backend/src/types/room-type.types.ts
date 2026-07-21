export interface RoomTypeCreateInput {
  type: string;
  price_full_day: number;
  price_short_time: number;
  description?: string | null;
}

export interface RoomTypeUpdateInput {
  type?: string;
  price_full_day?: number;
  price_short_time?: number;
  description?: string | null;
}

export interface RoomTypeDTO {
  id: string;
  type: string;
  price_full_day: number;
  price_short_time: number;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
