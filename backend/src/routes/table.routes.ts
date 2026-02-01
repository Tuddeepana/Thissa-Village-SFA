import { Router } from 'express';
import * as tableController from '../controllers/table.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { createRestaurantTableSchema, updateRestaurantTableSchema } from '../validations/table.validation';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List all tables
router.get('/', tableController.listRestaurantTables);

// Get expanded table list (shows Table 1, Table 2, etc.)
router.get('/expanded', tableController.getExpandedTableList);

// Get table by ID
router.get('/:id', tableController.getRestaurantTableById);

// Create table (ADMIN only)
router.post(
  '/',
  authorize(Role.ADMIN),
  validate(createRestaurantTableSchema),
  tableController.createRestaurantTable
);

// Update table (ADMIN only)
router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate(updateRestaurantTableSchema),
  tableController.updateRestaurantTable
);

// Delete table (ADMIN only)
router.delete('/:id', authorize(Role.ADMIN), tableController.deleteRestaurantTable);

export default router;

