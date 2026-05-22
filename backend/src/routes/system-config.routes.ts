import { Router } from 'express';
import * as controller from '../controllers/system-config.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/rbac.middleware';

const router = Router();

// GET /api/config?keys=KEY1,KEY2 — batch fetch (any authenticated user)
router.get('/', authenticate, controller.getMultipleConfigs);

// GET /api/config/:key — single fetch (any authenticated user)
router.get('/:key', authenticate, controller.getConfig);

// PUT /api/config/:key — set/update (admin only)
router.put('/:key', authenticate, adminOnly, controller.setConfig);

export default router;
