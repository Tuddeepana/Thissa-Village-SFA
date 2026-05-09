import { Router } from 'express';
import { createKotLog } from '../controllers/kot.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/kot
 * Create a new KOT log and mark items as sent
 */
router.post('/', createKotLog);

export default router;
