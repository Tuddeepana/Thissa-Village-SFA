export interface BookedRoom {
  id: string;
  bookingId: string;
  roomId: string;
  roomName: string;
  pricePerNight: number;
  createdAt: string;
}
export interface RoomBooking {
  id: string;
  customerName: string;
  customerNic?: string;
  customerPhone: string;
  customerAddress?: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  status: 'ACTIVE' | 'CHECKED_OUT' | 'CANCELLED';
  cashierName: string;
  createdAt: string;
  updatedAt: string;
  bookedRooms: BookedRoom[];
}
export interface CreateRoomBookingPayload {
  customerName: string;
  customerNic?: string;
  customerPhone: string;
  customerAddress?: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  cashierName: string;
  rooms: {
    roomId: string;
    roomName: string;
    pricePerNight: number;
  }[];
}
export interface UpdateRoomBookingPayload {
  customerName?: string;
  customerNic?: string;
  customerPhone?: string;
  customerAddress?: string;
  checkInDate?: string;
  checkOutDate?: string;
  totalAmount?: number;
  status?: 'ACTIVE' | 'CHECKED_OUT' | 'CANCELLED';
}
export interface AvailableRoom {
  id: string;
  displayName: string;
  room_type: string;
  baseRoomId: string;
}
export interface RoomBookingListResponse {
  success: boolean;
  bookings: RoomBooking[];
  total: number;
}
export interface AvailableRoomsResponse {
  success: boolean;
  rooms: AvailableRoom[];
  total: number;
}
