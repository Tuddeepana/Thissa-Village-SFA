import { Router } from 'express';
import * as controller from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

// ── Expense Types ──
router.get('/types', authenticate, controller.listExpenseTypes);
router.get('/types/:id', authenticate, controller.getExpenseTypeById);
router.post('/types', authenticate, controller.createExpenseType);
router.put('/types/:id', authenticate, controller.updateExpenseType);
router.delete('/types/:id', authenticate, controller.softDeleteExpenseType);
router.post('/types/:id/restore', authenticate, controller.restoreExpenseType);

// ── Expenses ──
router.get('/', authenticate, controller.listExpenses);
router.get('/pnl', authenticate, controller.getPnL);
router.get('/:id', authenticate, controller.getExpenseById);
router.post('/', authenticate, controller.createExpense);
router.post('/bulk', authenticate, controller.bulkCreateExpenses);
router.delete('/:id', authenticate, controller.deleteExpense);

export default router;
