import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
  addItemsToOrder,
  cancelOrder,
  getOrderStats,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  addItemsToOrderSchema,
  orderQuerySchema,
} from '../validations/order.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/orders/stats
 * Get order statistics
 */
router.get('/stats', getOrderStats);

/**
 * GET /api/orders
 * List orders with optional filters
 */
router.get('/', validate({ query: orderQuerySchema }), listOrders);

/**
 * GET /api/orders/:id
 * Get order by ID
 */
router.get('/:id', getOrderById);

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', validate(createOrderSchema), createOrder);

/**
 * PATCH /api/orders/:id/status
 * Update order status
 */
router.patch('/:id/status', validate(updateOrderStatusSchema), updateOrderStatus);

/**
 * POST /api/orders/:id/items
 * Add items to existing order
 */
router.post('/:id/items', validate(addItemsToOrderSchema), addItemsToOrder);

/**
 * DELETE /api/orders/:id
 * Cancel order
 */
router.delete('/:id', cancelOrder);

export default router;
