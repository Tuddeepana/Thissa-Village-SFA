import { Router } from 'express';
import * as controller from '../controllers/service-charge.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/service-charge - Get current service charge configuration
// NOTE: This endpoint is used from the Settings (SFA) screen. If your deployment
// doesn't use auth tokens for settings, keep it public. If you want to lock it
// down, re-enable `authenticate`.
router.get('/', controller.getServiceCharge);

// PUT /api/service-charge - Update service charge configuration
router.put('/', controller.updateServiceCharge);

export default router;

