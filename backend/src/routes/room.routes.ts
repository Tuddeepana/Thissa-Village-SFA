import { Router } from 'express';
import * as roomController from '../controllers/room.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { createRoomSchema, updateRoomSchema } from '../validations/room.validation';
import { Role } from '@prisma/client';

const router = Router();


// All routes require authentication
router.use(authenticate);

// List all rooms
router.get('/', roomController.listRooms);

// Get expanded room list (shows Room 1, Room 2, etc.)
router.get('/expanded', roomController.getExpandedRoomList);

// Get room by ID
router.get('/:id', roomController.getRoomById);

// Create room (ADMIN only)
router.post(
  '/',
  authorize(Role.ADMIN),
  validate(createRoomSchema),
  roomController.createRoom
);

// Update room (ADMIN only)
router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate(updateRoomSchema),
  roomController.updateRoom
);

// Delete room (ADMIN only)
router.delete('/:id', authorize(Role.ADMIN), roomController.deleteRoom);

export default router;

