import { Router } from 'express';
import orderController from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create new order
router.post('/', orderController.createOrder);

// Get all orders with filtering
router.get('/', orderController.getOrders);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Update order
router.patch('/:id', orderController.updateOrder);

// Add item to order
router.post('/:id/items', orderController.addItemToOrder);

// Complete order with payment
router.post('/:id/complete', orderController.completeOrder);

// Cancel order
router.delete('/:id', orderController.cancelOrder);

export default router;
