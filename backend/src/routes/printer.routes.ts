import { Router } from 'express';
import * as controller from '../controllers/printer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/rbac.middleware';

const router = Router();

// All printer routes require admin authentication
router.use(authenticate, adminOnly);

// GET /api/printers - List all printers
router.get('/', controller.getAllPrinters);

// GET /api/printers/:id - Get single printer
router.get('/:id', controller.getPrinterById);

// POST /api/printers - Create a new printer
router.post('/', controller.createPrinter);

// PUT /api/printers/:id - Update a printer
router.put('/:id', controller.updatePrinter);

// DELETE /api/printers/:id - Delete a printer
router.delete('/:id', controller.deletePrinter);

// POST /api/printers/:id/test - Test printer connectivity
router.post('/:id/test', controller.testPrinter);

export default router;
