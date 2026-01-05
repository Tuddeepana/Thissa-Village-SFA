import { Router } from 'express';
import * as controller from '../controllers/bill.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOrCashier } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { billQuerySchema, createBillWithItemsSchema, updateBillPaymentSchema } from '../validations/bill.validation';

const router = Router();

// List bills
router.get('/', authenticate, validate(billQuerySchema), controller.list);

// Get one bill
router.get('/:id', authenticate, controller.getById);

// Create bill (admin or cashier)
router.post('/', authenticate, adminOrCashier, validate(createBillWithItemsSchema), controller.create);

// Update bill payment (admin or cashier)
router.patch('/:id/payment', authenticate, adminOrCashier, validate(updateBillPaymentSchema), controller.updatePayment);

export default router;
