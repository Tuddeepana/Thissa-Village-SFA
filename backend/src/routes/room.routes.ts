import { Router } from 'express';
import * as roomController from '../controllers/room.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createRoomSchema, updateRoomSchema } from '../validations/room.validation';

const router = Router();

// Create room
router.post(
  '/',
  authenticate,
  validate(createRoomSchema),
  roomController.createRoom
);

// Get all rooms
router.get(
  '/',
  authenticate,
  roomController.listRooms
);

// Get expanded room list (with individual room instances)
router.get(
  '/expanded',
  authenticate,
  roomController.getExpandedRoomList
);

// Get room by ID
router.get(
  '/:id',
  authenticate,
  roomController.getRoomById
);

// Update room
router.put(
  '/:id',
  authenticate,
  validate(updateRoomSchema),
  roomController.updateRoom
);

// Delete room (soft delete)
router.delete(
  '/:id',
  authenticate,
  roomController.deleteRoom
);

export default router;
