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
import { billService } from './bill.service';
import type { BillCreateWithItemsInput } from '../types/bill.types';

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
        customer_type: input.customer_type,
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
   * When status is COMPLETED, creates a bill automatically
   */
  async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput): Promise<OrderDTO> {
    // Get existing order with items before updating
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Update order status
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: input.status },
      include: { items: true },
    });

    // If order is completed, create a bill
    if (input.status === OrderStatus.COMPLETED) {
      // Generate unique bill number using timestamp
      const billNumber = `BILL-${Date.now().toString().slice(-8)}`;

      // Calculate item count
      const itemCount = existingOrder.items.reduce((sum, item) => sum + item.quantity, 0);

      // Prepare bill input
      const billInput: BillCreateWithItemsInput = {
        bill_number: billNumber,
        date: new Date(),
        payment_method: 'CASH', // Default payment method, can be updated later
        customer_name: order.customer_name || null,
        total: Number(order.total),
        cashier_name: order.cashier_name,
        item_count: itemCount,
        credit_note: null,
        cash_given: Number(order.total), // Assuming exact payment for now
        balance_given: 0,
        tax: Number(order.tax),
        items: existingOrder.items.map((item) => ({
          productId: item.productId,
          quantityMoved: item.quantity,
        })),
      };

      // Create bill with inventory movements
      await billService.createBillWithItems(billInput);
    }

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
    const [pending, completed, cancelled, total] = await Promise.all([
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      prisma.order.count(),
    ]);

    return {
      pending,
      completed,
      cancelled,
      total,
    };
  }

  /**
   * Get table status with current orders
   */
  async getTableStatus(params?: {
    status?: 'available' | 'occupied' | 'all';
    date_from?: Date;
    date_to?: Date;
  }) {
    // Get all expanded tables
    const expandedTables = await (prisma as any).restaurantTable.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    // Expand tables based on quantity
    const allTables: any[] = [];
    for (const table of expandedTables) {
      for (let i = 1; i <= table.quantity; i++) {
        allTables.push({
          id: `${table.id}-${i}`,
          displayName: `${table.name} ${i}`,
          baseName: table.name,
          tableNumber: i,
          table_type: table.table_type,
          parentId: table.id,
        });
      }
    }

    // Build where clause for orders
    const orderWhere: Prisma.OrderWhereInput = {
      status: OrderStatus.PENDING,
      order_type: 'DINE_IN',
    };

    if (params?.date_from || params?.date_to) {
      orderWhere.createdAt = {};
      if (params.date_from) {
        orderWhere.createdAt.gte = params.date_from;
      }
      if (params.date_to) {
        orderWhere.createdAt.lte = params.date_to;
      }
    }

    // Get all pending dine-in orders
    const pendingOrders = await prisma.order.findMany({
      where: orderWhere,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    // Map orders to table numbers
    const ordersByTable = new Map<string, any>();
    for (const order of pendingOrders) {
      if (order.table_id) {
        ordersByTable.set(order.table_id, this.mapToDTO(order));
      }
    }

    // Combine table info with order status
    const tableStatus = allTables.map((table) => {
      const currentOrder = ordersByTable.get(table.id);

      return {
        table_id: table.id,
        table_number: table.tableNumber,
        table_name: table.displayName,
        table_type: table.table_type,
        status: currentOrder ? 'occupied' : 'available',
        current_order: currentOrder || null,
        customer_name: currentOrder?.customer_name || null,
        order_time: currentOrder?.createdAt || null,
        total_amount: currentOrder?.total || null,
        item_count: currentOrder?.items?.length || null,
      };
    });

    // Apply status filter if provided
    let filteredTables = tableStatus;
    if (params?.status && params.status !== 'all') {
      filteredTables = tableStatus.filter(t => t.status === params.status);
    }

    // Calculate summary
    const summary = {
      total: tableStatus.length,
      occupied: tableStatus.filter(t => t.status === 'occupied').length,
      available: tableStatus.filter(t => t.status === 'available').length,
      reserved: 0, // Reserved feature can be added later
    };

    return {
      tables: filteredTables,
      summary,
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
      customer_type: order.customer_type || 'local',
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
