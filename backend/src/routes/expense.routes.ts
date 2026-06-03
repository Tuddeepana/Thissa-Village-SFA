import { Router } from 'express';
import * as controller from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ── Expense Types ──
// IMPORTANT: specific paths MUST come before /:id to avoid Express matching 'types' as an id param
router.get('/types', authenticate, controller.listExpenseTypes);
router.post('/types', authenticate, controller.createExpenseType);
router.get('/types/:id', authenticate, controller.getExpenseTypeById);
router.put('/types/:id', authenticate, controller.updateExpenseType);
router.delete('/types/:id', authenticate, controller.softDeleteExpenseType);
router.post('/types/:id/restore', authenticate, controller.restoreExpenseType);

// ── Expenses ──
// IMPORTANT: /pnl and /bulk MUST come before /:id
router.get('/pnl', authenticate, controller.getPnL);
router.post('/bulk', authenticate, controller.bulkCreateExpenses);
router.get('/', authenticate, controller.listExpenses);
router.post('/', authenticate, controller.createExpense);
router.get('/:id', authenticate, controller.getExpenseById);
router.delete('/:id', authenticate, controller.deleteExpense);

export default router;
