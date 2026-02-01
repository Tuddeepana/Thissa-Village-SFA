import prisma from '../lib/prisma';
import { CreateOrderDTO, UpdateOrderDTO, AddOrderItemDTO, OrderQueryParams } from '../types/order.types';
import { ProductType } from '@prisma/client';

export class OrderService {
  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderDTO) {
    // If dine-in, validate and update table status to OCCUPIED
    if (data.order_type === 'DINE_IN' && data.tableId) {
      // Check if table exists
      const table = await prisma.restaurantTable.findUnique({
        where: { id: data.tableId },
      });

      if (!table) {
        throw new Error(`Table with ID ${data.tableId} not found. Please select a valid table.`);
      }

      // Update table to OCCUPIED
      await prisma.restaurantTable.update({
        where: { id: data.tableId },
        data: { table_status: 'OCCUPIED' },
      });
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        order_number: data.order_number,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        order_type: data.order_type,
        status: 'PREPARING', // Orders go directly to PREPARING when sent to kitchen
        tableId: data.tableId,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total: data.total,
        terminal_id: data.terminal_id,
        cashier_name: data.cashier_name,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
          })),
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    // Update inventory for PURCHASE products only (HANDMADE products don't affect inventory)
    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { product_type: true },
      });

      // Only update inventory for PURCHASE products
      if (product?.product_type === 'PURCHASE') {
        // Get latest inventory record
        const latestInventory = await prisma.inventory.findFirst({
          where: { productId: item.productId },
          orderBy: { createdAt: 'desc' },
        });

        const currentAvailable = latestInventory?.available_quantity ?? 0;
        const newAvailable = currentAvailable - item.quantity;

        // Create inventory movement record (negative for sale)
        await prisma.inventory.create({
          data: {
            productId: item.productId,
            quantity_moved: -item.quantity, // Negative for sale
            available_quantity: Math.max(0, newAvailable),
          },
        });
      }
      // HANDMADE products: no inventory update needed
    }

    return order;
  }

  /**
   * Get all orders with filtering and pagination
   */
  async getOrders(params: OrderQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      status,
      search,
      orderType,
      tableId,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (orderType && orderType !== 'all') {
      where.order_type = orderType.toUpperCase();
    }

    if (tableId) {
      where.tableId = tableId;
    }

    if (search) {
      where.OR = [
        { order_number: { contains: search, mode: 'insensitive' } },
        { customer_name: { contains: search, mode: 'insensitive' } },
        { customer_phone: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          table: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single order by ID
   */
  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        table: true,
        bill: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  /**
   * Update order status
   */
  async updateOrder(id: string, data: UpdateOrderDTO) {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
      },
      include: {
        items: true,
        table: true,
      },
    });

    return order;
  }

  /**
   * Add item to existing order
   */
  async addItemToOrder(orderId: string, item: AddOrderItemDTO) {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { product_type: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Create order item
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId,
        productId: item.productId,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      },
    });

    // Update order totals
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { subtotal: true, tax: true, discount: true },
    });

    if (order) {
      const newSubtotal = Number(order.subtotal) + item.total;
      const newTax = Number(order.tax); // Keep same tax amount
      const newDiscount = Number(order.discount); // Keep same discount
      const newTotal = newSubtotal + newTax - newDiscount;

      await prisma.order.update({
        where: { id: orderId },
        data: {
          subtotal: newSubtotal,
          total: newTotal,
        },
      });
    }

    // Update inventory for PURCHASE products only
    if (product.product_type === 'PURCHASE') {
      const latestInventory = await prisma.inventory.findFirst({
        where: { productId: item.productId },
        orderBy: { createdAt: 'desc' },
      });

      const currentAvailable = latestInventory?.available_quantity ?? 0;
      const newAvailable = currentAvailable - item.quantity;

      await prisma.inventory.create({
        data: {
          productId: item.productId,
          quantity_moved: -item.quantity,
          available_quantity: Math.max(0, newAvailable),
        },
      });
    }

    return orderItem;
  }

  /**
   * Complete order with payment (creates bill and updates table status)
   */
  async completeOrderWithPayment(
    orderId: string,
    paymentData: {
      payment_method: string;
      cash_given: number;
      balance_given: number;
    }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, table: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Create bill
    const billNumber = `B-${Date.now()}`;
    
    // Extract table number from table name
    let tableNumber: number | null = null;
    if (order.table?.name) {
      const match = order.table.name.match(/\d+/);
      tableNumber = match ? parseInt(match[0]) : null;
    }
    
    const bill = await prisma.bill.create({
      data: {
        bill_number: billNumber,
        date: new Date(),
        payment_method: paymentData.payment_method,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        total: order.total,
        subtotal: order.subtotal,
        cashier_name: order.cashier_name,
        terminal_id: order.terminal_id,
        item_count: order.items.length,
        cash_given: paymentData.cash_given,
        balance_given: paymentData.balance_given,
        tax: order.tax,
        discount: order.discount,
        order_type: order.order_type,
        table_number: tableNumber,
        orderId: order.id,
      },
    });

    // Update order status to COMPLETED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    // If dine-in, free up the table
    if (order.order_type === 'DINE_IN' && order.tableId) {
      await prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: { table_status: 'FREE' },
      });
    }

    return { bill, order };
  }

  /**
   * Delete/Cancel an order
   */
  async cancelOrder(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Restore inventory for PURCHASE products
    for (const item of order.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { product_type: true },
      });

      if (product?.product_type === 'PURCHASE') {
        const latestInventory = await prisma.inventory.findFirst({
          where: { productId: item.productId },
          orderBy: { createdAt: 'desc' },
        });

        const currentAvailable = latestInventory?.available_quantity ?? 0;
        const restoredAvailable = currentAvailable + item.quantity;

        await prisma.inventory.create({
          data: {
            productId: item.productId,
            quantity_moved: item.quantity, // Positive for restoration
            available_quantity: restoredAvailable,
          },
        });
      }
    }

    // Update order status
    const cancelledOrder = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: true, table: true },
    });

    // Free up table if dine-in
    if (order.order_type === 'DINE_IN' && order.tableId) {
      await prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: { table_status: 'FREE' },
      });
    }

    return cancelledOrder;
  }
}

export default new OrderService();
