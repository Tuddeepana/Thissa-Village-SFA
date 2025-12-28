import { Router } from 'express';
import * as controller from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

// List inventory records (authenticated)
router.get('/', authenticate, controller.list);

// Get one record
router.get('/:id', authenticate, controller.getById);

export default router;