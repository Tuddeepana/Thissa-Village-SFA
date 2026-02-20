import { Router } from 'express';
import * as roomBookingController from '../controllers/room-booking.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createRoomBookingSchema,
  updateRoomBookingSchema,
  availableRoomsQuerySchema,
} from '../validations/room-booking.validation';

const router = Router();

// Get available rooms for a date range
router.get(
  '/available',
  authenticate,
  roomBookingController.getAvailableRooms
);

// Get all room bookings (with optional status filter)
router.get(
  '/',
  authenticate,
  roomBookingController.listRoomBookings
);

// Get room booking by ID
router.get(
  '/:id',
  authenticate,
  roomBookingController.getRoomBookingById
);

// Create room booking
router.post(
  '/',
  authenticate,
  validate(createRoomBookingSchema),
  roomBookingController.createRoomBooking
);

// Update room booking
router.put(
  '/:id',
  authenticate,
  validate(updateRoomBookingSchema),
  roomBookingController.updateRoomBooking
);

// Check out a booking
router.patch(
  '/:id/checkout',
  authenticate,
  roomBookingController.checkOutBooking
);

// Cancel a booking
router.patch(
  '/:id/cancel',
  authenticate,
  roomBookingController.cancelBooking
);

export default router;
