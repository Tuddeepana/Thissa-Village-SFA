import { Router } from 'express';
import { getMyStockController } from '../controllers/mystock.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/mystock
router.get('/', authenticate, getMyStockController);

export default router;

