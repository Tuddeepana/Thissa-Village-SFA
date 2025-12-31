import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/dashboard/summary
router.get('/summary', authenticate, controller.getSummary);

export default router;

