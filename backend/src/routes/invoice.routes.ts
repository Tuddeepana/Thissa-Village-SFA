import { Router } from 'express';
import * as controller from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { Role } from '@prisma/client';
import { validate } from '../middleware/validate.middleware';
import { createInvoiceWithItemsSchema, updateInvoiceSchema, invoiceQuerySchema } from '../validations/invoice.validation';

const router = Router();

// List (with pagination & search) - authenticated
router.get('/', authenticate, validate(invoiceQuerySchema), controller.list);

// List invoices with included product details (paginated)
router.get('/with-products', authenticate, validate(invoiceQuerySchema), controller.listWithProducts);

// Get
router.get('/:id', authenticate, controller.getById);

// Create - admin only
router.post('/', authenticate, authorize(Role.ADMIN), validate(createInvoiceWithItemsSchema), controller.create);

// Update - admin only
router.put('/:id', authenticate, authorize(Role.ADMIN), validate(updateInvoiceSchema), controller.update);

// Delete - admin only
router.delete('/:id', authenticate, authorize(Role.ADMIN), controller.remove);

export default router;
