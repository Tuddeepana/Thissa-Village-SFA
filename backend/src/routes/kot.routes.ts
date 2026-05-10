import { Router } from 'express';
import { createKotLog, getKotLogs, updateKotStatus } from '../controllers/kot.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/kot
 * Get KOT logs
 */
router.get('/', getKotLogs);

/**
 * POST /api/kot
 * Create a new KOT log and mark items as sent
 */
router.post('/', createKotLog);

/**
 * PATCH /api/kot/:id/status
 * Update KOT status
 */
router.patch('/:id/status', updateKotStatus);

export default router;
