import { Router } from 'express';
import * as controller from '../controllers/service-charge.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/service-charge - Get current service charge configuration
router.get('/', authenticate, controller.getServiceCharge);

// PUT /api/service-charge - Update service charge configuration
router.put('/', authenticate, controller.updateServiceCharge);

export default router;

