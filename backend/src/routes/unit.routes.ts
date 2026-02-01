import { Router } from 'express';
import * as unitController from '../controllers/unit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { createUnitSchema, updateUnitSchema } from '../validations/unit.validation';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List all units
router.get('/', unitController.listUnits);

// Get unit by ID
router.get('/:id', unitController.getUnitById);

// Create unit (ADMIN only)
router.post(
  '/',
  authorize(Role.ADMIN),
  validate(createUnitSchema),
  unitController.createUnit
);

// Update unit (ADMIN only)
router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate(updateUnitSchema),
  unitController.updateUnit
);

// Delete unit (ADMIN only)
router.delete('/:id', authorize(Role.ADMIN), unitController.deleteUnit);

export default router;

