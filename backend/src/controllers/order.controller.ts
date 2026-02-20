import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { AppError } from '../errors/AppError';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  addItemsToOrderSchema,
  orderQuerySchema,
} from '../validations/order.validation';

const orderService = new OrderService();

/**
 * Create a new order
 */
export const createOrder = async (req: Request, res: Response) => {
  const validatedData = createOrderSchema.parse(req.body);
  const order = await orderService.createOrder(validatedData);
  res.status(201).json({ message: 'Order created successfully', order });
};

/**
 * Get order by ID
 */
export const getOrderById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await orderService.getOrderById(id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.json({ order });
};

/**
 * List orders with filters
 */
export const listOrders = async (req: Request, res: Response) => {
  const validatedQuery = orderQuerySchema.parse(req.query);

  const result = await orderService.listOrders({
    status: validatedQuery.status,
    order_type: validatedQuery.order_type,
    customer_name: validatedQuery.customer_name,
    table_number: validatedQuery.table_number,
    date_from: validatedQuery.date_from ? new Date(validatedQuery.date_from) : undefined,
    date_to: validatedQuery.date_to ? new Date(validatedQuery.date_to) : undefined,
    page: validatedQuery.page,
    pageSize: validatedQuery.pageSize,
  });

  res.json(result);
};

/**
 * Update order status
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateOrderStatusSchema.parse(req.body);

  const order = await orderService.updateOrderStatus(id, validatedData);
  res.json({ message: 'Order status updated successfully', order });
};

/**
 * Add items to existing order
 */
export const addItemsToOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = addItemsToOrderSchema.parse(req.body);

  const order = await orderService.addItemsToOrder(id, validatedData);
  res.json({ message: 'Items added to order successfully', order });
};

/**
 * Cancel order
 */
export const cancelOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await orderService.cancelOrder(id);
  res.json({ message: 'Order cancelled successfully', order });
};

/**
 * Get order statistics
 */
export const getOrderStats = async (req: Request, res: Response) => {
  const stats = await orderService.getOrderStats();
  res.json({ stats });
};
