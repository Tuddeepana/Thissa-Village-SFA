import { z } from 'zod';

// Schema for booked room item
const bookedRoomSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  roomName: z.string().min(1, 'Room name is required'),
  pricePerNight: z.number().positive('Price must be positive'),
});

// Schema for creating a room booking
export const createRoomBookingSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(255, 'Name too long'),
  customerNic: z.string().max(20, 'NIC too long').optional(),
  customerPhone: z.string().min(1, 'Phone number is required').max(20, 'Phone too long'),
  customerAddress: z.string().max(500, 'Address too long').optional(),
  checkInDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid check-in date',
  }),
  checkOutDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid check-out date',
  }),
  totalAmount: z.number().positive('Total amount must be positive'),
  cashierName: z.string().min(1, 'Cashier name is required').max(255, 'Name too long'),
  rooms: z.array(bookedRoomSchema).min(1, 'At least one room is required'),
}).refine(
  (data) => {
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    return checkOut > checkIn;
  },
  {
    message: 'Check-out date must be after check-in date',
    path: ['checkOutDate'],
  }
);

// Schema for updating a room booking
export const updateRoomBookingSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(255, 'Name too long').optional(),
  customerNic: z.string().max(20, 'NIC too long').optional(),
  customerPhone: z.string().min(1, 'Phone number is required').max(20, 'Phone too long').optional(),
  customerAddress: z.string().max(500, 'Address too long').optional(),
  checkInDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid check-in date',
  }).optional(),
  checkOutDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid check-out date',
  }).optional(),
  totalAmount: z.number().positive('Total amount must be positive').optional(),
  status: z.enum(['ACTIVE', 'CHECKED_OUT', 'CANCELLED']).optional(),
});

// Schema for available rooms query
export const availableRoomsQuerySchema = z.object({
  checkInDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid check-in date',
  }),
  checkOutDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid check-out date',
  }),
}).refine(
  (data) => {
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    return checkOut > checkIn;
  },
  {
    message: 'Check-out date must be after check-in date',
    path: ['checkOutDate'],
  }
);

export type CreateRoomBookingInput = z.infer<typeof createRoomBookingSchema>;
export type UpdateRoomBookingInput = z.infer<typeof updateRoomBookingSchema>;
export type AvailableRoomsQuery = z.infer<typeof availableRoomsQuerySchema>;
