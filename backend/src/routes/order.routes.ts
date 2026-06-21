import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
  addItemsToOrder,
  updateOrderItem,
  deleteItemFromOrder,
  cancelOrder,
  getOrderStats,
  getTableStatus,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  addItemsToOrderSchema,
  updateOrderItemSchema,
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
 * GET /api/orders/table-status
 * Get table status with current orders
 */
router.get('/table-status', getTableStatus);

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
 * PATCH /api/orders/:id/items/:itemId
 * Update order item quantity
 */
router.patch('/:id/items/:itemId', validate(updateOrderItemSchema), updateOrderItem);

/**
 * DELETE /api/orders/:id/items/:itemId
 * Delete item from order
 */
router.delete('/:id/items/:itemId', deleteItemFromOrder);

/**
 * DELETE /api/orders/:id
 * Cancel order
 */
router.delete('/:id', cancelOrder);

export default router;
