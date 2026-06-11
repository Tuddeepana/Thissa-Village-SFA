import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/dashboard/summary
router.get('/summary', authenticate, controller.getSummary);
// GET /api/dashboard/product-category
router.get('/product-category', authenticate, controller.getProductCategory);
// GET /api/dashboard/product-sales
router.get('/product-sales', authenticate, controller.getProductSales);

export default router;
