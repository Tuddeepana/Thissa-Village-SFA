import { Router } from 'express';
import { getSalesSummaryController, getVolumeWiseSummaryController } from '../controllers/sales-summary.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/sales-summary
router.get('/', authenticate, getSalesSummaryController);

// GET /api/sales-summary/volume-wise
router.get('/volume-wise', authenticate, getVolumeWiseSummaryController);

export default router;
