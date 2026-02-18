import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  OrderDTO,
  CreateOrderInput,
  UpdateOrderStatusInput,
  AddItemsToOrderInput,
  OrderStatsDTO,
  OrderStatus,
  OrderType,
} from '../types/order.types';

export class OrderService {
  /**
   * Create a new order with items
   */
  async createOrder(input: CreateOrderInput): Promise<OrderDTO> {
    // Calculate totals
    const subtotal = input.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const tax = input.tax || 0;
    const discount = input.discount || 0;
    const total = subtotal + tax - discount;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

    const order = await prisma.order.create({
      data: {
        order_number: orderNumber,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        order_type: input.order_type,
        table_id: input.table_id,
        table_name: input.table_name,
        table_number: input.table_number,
        subtotal: new Prisma.Decimal(subtotal),
        tax: new Prisma.Decimal(tax),
        discount: new Prisma.Decimal(discount),
        total: new Prisma.Decimal(total),
        terminal_id: input.terminal_id,
        cashier_name: input.cashier_name,
        notes: input.notes,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: new Prisma.Decimal(item.unit_price),
            total: new Prisma.Decimal(item.unit_price * item.quantity),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return this.mapToDTO(order);
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<OrderDTO | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    return order ? this.mapToDTO(order) : null;
  }

  /**
   * List orders with optional filters
   */
  async listOrders(params: {
    status?: OrderStatus;
    order_type?: OrderType;
    customer_name?: string;
    table_number?: string;
    date_from?: Date;
    date_to?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{ orders: OrderDTO[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const {
      status,
      order_type,
      customer_name,
      table_number,
      date_from,
      date_to,
      page = 1,
      pageSize = 50,
    } = params;

    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (order_type) {
      where.order_type = order_type;
    }

    if (customer_name) {
      where.customer_name = {
        contains: customer_name,
        mode: 'insensitive',
      };
    }

    if (table_number) {
      where.table_number = parseInt(table_number, 10);
    }

    if (date_from || date_to) {
      where.createdAt = {};
      if (date_from) {
        where.createdAt.gte = date_from;
      }
      if (date_to) {
        where.createdAt.lte = date_to;
      }
    }

    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map(this.mapToDTO),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput): Promise<OrderDTO> {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: input.status },
      include: { items: true },
    });

    return this.mapToDTO(order);
  }

  /**
   * Add items to existing order
   * Recalculates totals
   */
  async addItemsToOrder(orderId: string, input: AddItemsToOrderInput): Promise<OrderDTO> {
    // Get existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Calculate new item totals
    const newItemsSubtotal = input.items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const currentSubtotal = Number(existingOrder.subtotal);
    const newSubtotal = currentSubtotal + newItemsSubtotal;
    const newTax = (newSubtotal * Number(existingOrder.tax)) / currentSubtotal || 0;
    const newDiscount = (newSubtotal * Number(existingOrder.discount)) / currentSubtotal || 0;
    const newTotal = newSubtotal + newTax - newDiscount;

    // Update order with new items and totals
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: new Prisma.Decimal(newSubtotal),
        tax: new Prisma.Decimal(newTax),
        discount: new Prisma.Decimal(newDiscount),
        total: new Prisma.Decimal(newTotal),
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: new Prisma.Decimal(item.unit_price),
            total: new Prisma.Decimal(item.unit_price * item.quantity),
          })),
        },
      },
      include: { items: true },
    });

    return this.mapToDTO(order);
  }

  /**
   * Delete order (cancel)
   */
  async cancelOrder(orderId: string): Promise<OrderDTO> {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
      include: { items: true },
    });

    return this.mapToDTO(order);
  }

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<OrderStatsDTO> {
    const [pending, preparing, ready, completed, cancelled, total] = await Promise.all([
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.PREPARING } }),
      prisma.order.count({ where: { status: OrderStatus.READY } }),
      prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      prisma.order.count(),
    ]);

    return {
      pending,
      preparing,
      ready,
      completed,
      cancelled,
      total,
    };
  }

  /**
   * Map Prisma order to DTO
   */
  private mapToDTO(order: any): OrderDTO {
    return {
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      order_type: order.order_type,
      table_id: order.table_id,
      table_name: order.table_name,
      table_number: order.table_number,
      status: order.status,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      discount: Number(order.discount),
      total: Number(order.total),
      terminal_id: order.terminal_id,
      cashier_name: order.cashier_name,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total: Number(item.total),
        createdAt: item.createdAt,
      })),
    };
  }
}
