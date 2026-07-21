import { Router } from 'express';
import * as controller from '../controllers/room-type.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// List all room types
router.get('/', authenticate, controller.list);

// Get room type by ID
router.get('/:id', authenticate, controller.getById);

// Create room type
router.post('/', authenticate, controller.create);

// Update room type
router.put('/:id', authenticate, controller.update);

// Soft delete room type
router.delete('/:id', authenticate, controller.softDelete);

export default router;
