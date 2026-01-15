import { Router } from 'express';
import { getSalesSummaryController } from '../controllers/sales-summary.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/sales-summary
router.get('/', authenticate, getSalesSummaryController);

export default router;
