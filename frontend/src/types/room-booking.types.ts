export interface BookedRoom {
  id: string;
  bookingId: string;
  roomId: string;
  roomName: string;
  pricePerNight: number;
  createdAt: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  date: string;
  payment_method: string;
  customer_name?: string | null;
  total: string;
  cashier_name: string;
  item_count: number;
  credit_note?: string | null;
  cash_given: string;
  balance_given: string;
  tax?: string | null;
  createdAt: string;
  updatedAt: string;
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
  paymentMethod?: string;
  cashGiven?: number;
  generateBill?: boolean;
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
