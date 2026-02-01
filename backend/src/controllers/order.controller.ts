import { Request, Response } from 'express';
import orderService from '../services/order.service';
import { CreateOrderDTO, UpdateOrderDTO, AddOrderItemDTO } from '../types/order.types';

export class OrderController {
  /**
   * Create a new order
   */
  async createOrder(req: Request, res: Response) {
    const data: CreateOrderDTO = req.body;
    const order = await orderService.createOrder(data);
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  }

  /**
   * Get all orders with filtering
   */
  async getOrders(req: Request, res: Response) {
    const params = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
      status: req.query.status as string,
      search: req.query.search as string,
      orderType: req.query.orderType as string,
      tableId: req.query.tableId as string,
    };

    const result = await orderService.getOrders(params);
    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  }

  /**
   * Get order by ID
   */
  async getOrderById(req: Request, res: Response) {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    res.status(200).json({
      success: true,
      data: order,
    });
  }

  /**
   * Update order (status, notes)
   */
  async updateOrder(req: Request, res: Response) {
    const { id } = req.params;
    const data: UpdateOrderDTO = req.body;
    const order = await orderService.updateOrder(id, data);
    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  }

  /**
   * Add item to order
   */
  async addItemToOrder(req: Request, res: Response) {
    const { id } = req.params;
    const item: AddOrderItemDTO = req.body;
    const orderItem = await orderService.addItemToOrder(id, item);
    res.status(201).json({
      success: true,
      message: 'Item added to order',
      data: orderItem,
    });
  }

  /**
   * Complete order with payment
   */
  async completeOrder(req: Request, res: Response) {
    const { id } = req.params;
    const paymentData = req.body;
    const result = await orderService.completeOrderWithPayment(id, paymentData);
    res.status(200).json({
      success: true,
      message: 'Order completed successfully',
      data: result,
    });
  }

  /**
   * Cancel order
   */
  async cancelOrder(req: Request, res: Response) {
    const { id } = req.params;
    const order = await orderService.cancelOrder(id);
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  }
}

export default new OrderController();
