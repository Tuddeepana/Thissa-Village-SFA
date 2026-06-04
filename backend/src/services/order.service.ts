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

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          order_number: orderNumber,
          customer_name: input.customer_name,
          customer_phone: input.customer_phone,
          customer_type: input.customer_type,
          order_type: input.order_type,
          table_id: input.table_id,
          table_name: input.table_name,
          table_number: input.table_number,
          steward_name: input.steward_name,
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
              kot_sent: item.kot_sent || false,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Link any previously created KOTs to this new order
      if (input.unlinkedKotIds && input.unlinkedKotIds.length > 0) {
        await tx.kotLog.updateMany({
          where: { id: { in: input.unlinkedKotIds } },
          data: { orderId: newOrder.id },
        });
      }

      return newOrder;
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
   * Delete item from order
   * Recalculates totals
   */
  async deleteItemFromOrder(orderId: string, itemId: string): Promise<OrderDTO> {
    // Get existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Find the item to delete
    const itemToDelete = existingOrder.items.find((item) => item.id === itemId);
    if (!itemToDelete) {
      throw new Error('Order item not found');
    }

    // Delete the item
    await prisma.orderItem.delete({
      where: { id: itemId },
    });

    // Recalculate totals
    const remainingItems = existingOrder.items.filter((item) => item.id !== itemId);

    if (remainingItems.length === 0) {
      // If no items left, just update totals to 0
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          subtotal: new Prisma.Decimal(0),
          tax: new Prisma.Decimal(0),
          discount: new Prisma.Decimal(0),
          total: new Prisma.Decimal(0),
        },
        include: { items: true },
      });
      return this.mapToDTO(order);
    }

    // Calculate new subtotal
    const newSubtotal = remainingItems.reduce(
      (sum, item) => sum + Number(item.unit_price) * item.quantity,
      0
    );

    // Recalculate tax and discount proportionally
    const oldSubtotal = Number(existingOrder.subtotal);
    const taxPercentage = oldSubtotal > 0 ? Number(existingOrder.tax) / oldSubtotal : 0;
    const discountPercentage = oldSubtotal > 0 ? Number(existingOrder.discount) / oldSubtotal : 0;

    const newTax = newSubtotal * taxPercentage;
    const newDiscount = newSubtotal * discountPercentage;
    const newTotal = newSubtotal + newTax - newDiscount;

    // Update order with recalculated totals
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: new Prisma.Decimal(newSubtotal),
        tax: new Prisma.Decimal(newTax),
        discount: new Prisma.Decimal(newDiscount),
        total: new Prisma.Decimal(newTotal),
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
   * Optimised: single raw SQL query with LEFT JOIN LATERAL for orders + item counts
   */
  async getTableStatus(params?: {
    status?: 'available' | 'occupied' | 'all';
    date_from?: Date;
    date_to?: Date;
  }) {
    // ── 1. Fetch restaurant tables (lightweight, no items) ──────────
    const expandedTables = await (prisma as any).restaurantTable.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    // Expand tables based on quantity
    const allTables: { id: string; displayName: string; baseName: string; tableNumber: number; table_type: string; parentId: string }[] = [];
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

    // Collect all virtual table IDs for the IN clause
    const tableIds = allTables.map(t => t.id);

    if (tableIds.length === 0) {
      return {
        tables: [],
        summary: { total: 0, occupied: 0, available: 0, reserved: 0 },
      };
    }

    // ── 2. Single query: latest pending DINE_IN order per table + item count ──
    //    Uses DISTINCT ON to pick the most recent order per table_id,
    //    and a correlated sub-query for item_count (avoids full items payload).
    let dateFilter = '';
    const queryParams: any[] = [tableIds];

    if (params?.date_from && params?.date_to) {
      dateFilter = `AND o."createdAt" >= $2 AND o."createdAt" <= $3`;
      queryParams.push(params.date_from, params.date_to);
    } else if (params?.date_from) {
      dateFilter = `AND o."createdAt" >= $2`;
      queryParams.push(params.date_from);
    } else if (params?.date_to) {
      dateFilter = `AND o."createdAt" <= $2`;
      queryParams.push(params.date_to);
    }

    const orderRows: any[] = await (prisma as any).$queryRawUnsafe(`
      SELECT DISTINCT ON (o."table_id")
        o."id",
        o."order_number",
        o."customer_name",
        o."customer_phone",
        o."customer_type",
        o."order_type",
        o."table_id",
        o."table_name",
        o."table_number",
        o."status",
        o."subtotal",
        o."tax",
        o."discount",
        o."total",
        o."terminal_id",
        o."cashier_name",
        o."notes",
        o."createdAt",
        o."updatedAt",
        COALESCE(ic.cnt, 0)::int AS "item_count"
      FROM "orders" o
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt
        FROM "order_items" oi
        WHERE oi."orderId" = o."id"
      ) ic ON true
      WHERE o."status" = 'PENDING'
        AND o."order_type" = 'DINE_IN'
        AND o."table_id" = ANY($1)
        ${dateFilter}
      ORDER BY o."table_id", o."createdAt" DESC
    `, ...queryParams);

    // ── 3. Build a lookup map: table_id → order row ─────────────────
    const ordersByTable = new Map<string, any>();
    for (const row of orderRows) {
      ordersByTable.set(row.table_id, {
        id: row.id,
        order_number: row.order_number,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        customer_type: row.customer_type || 'local',
        order_type: row.order_type,
        table_id: row.table_id,
        table_name: row.table_name,
        table_number: row.table_number,
        status: row.status,
        subtotal: Number(row.subtotal),
        tax: Number(row.tax),
        discount: Number(row.discount),
        total: Number(row.total),
        terminal_id: row.terminal_id,
        cashier_name: row.cashier_name,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        item_count: row.item_count,
      });
    }

    // ── 4. Combine tables with order status ─────────────────────────
    const tableStatus = allTables.map((table) => {
      const currentOrder = ordersByTable.get(table.id) || null;

      return {
        table_id: table.id,
        table_number: table.tableNumber,
        table_name: table.displayName,
        table_type: table.table_type,
        status: currentOrder ? ('occupied' as const) : ('available' as const),
        current_order: currentOrder,
        customer_name: currentOrder?.customer_name || null,
        order_time: currentOrder?.createdAt || null,
        total_amount: currentOrder?.total || null,
        item_count: currentOrder?.item_count || null,
      };
    });

    // ── 5. Apply status filter ──────────────────────────────────────
    let filteredTables = tableStatus;
    if (params?.status && params.status !== 'all') {
      filteredTables = tableStatus.filter(t => t.status === params.status);
    }

    // ── 6. Summary (computed from full list, not filtered) ──────────
    const occupied = ordersByTable.size;
    const summary = {
      total: allTables.length,
      occupied,
      available: allTables.length - occupied,
      reserved: 0,
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
      table_id: order.table_id || undefined,
      table_name: order.table_name || undefined,
      table_number: order.table_number || undefined,
      steward_name: order.steward_name || undefined,
      status: order.status as OrderStatus,
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
        kot_sent: item.kot_sent || false,
        createdAt: item.createdAt,
      })),
    };
  }
}
