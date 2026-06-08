import api from '../client';
import { ENDPOINTS } from '../endpoints';
import type {
  Order,
  CreateOrderInput,
  UpdateOrderStatusInput,
  AddItemsToOrderInput,
  OrderListParams,
  OrderListResponse,
  OrderStats,
} from '@/types/order.types';

export const orderService = {
  /**
   * Create a new order
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const response = await api.post<{ order: Order }>(ENDPOINTS.orders.base, input);
    return response.data.order;
  },

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order> {
    const response = await api.get<{ order: Order }>(ENDPOINTS.orders.byId(id));
    return response.data.order;
  },

  /**
   * List orders with filters
   */
  async listOrders(params?: OrderListParams): Promise<OrderListResponse> {
    const response = await api.get<OrderListResponse>(ENDPOINTS.orders.base, { params });
    return response.data;
  },

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, input: UpdateOrderStatusInput): Promise<Order> {
    const response = await api.patch<{ order: Order }>(
      ENDPOINTS.orders.status(id),
      input
    );
    return response.data.order;
  },

  /**
   * Add items to existing order
   */
  async addItemsToOrder(id: string, input: AddItemsToOrderInput): Promise<Order> {
    const response = await api.post<{ order: Order }>(
      ENDPOINTS.orders.addItems(id),
      input
    );
    return response.data.order;
  },

  /**
   * Delete item from order
   */
  async deleteItemFromOrder(orderId: string, itemId: string): Promise<Order> {
    const response = await api.delete<{ order: Order }>(
      `${ENDPOINTS.orders.byId(orderId)}/items/${itemId}`
    );
    return response.data.order;
  },

  /**
   * Cancel order
   */
  async cancelOrder(id: string): Promise<Order> {
    const response = await api.delete<{ order: Order }>(ENDPOINTS.orders.byId(id));
    return response.data.order;
  },

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<OrderStats> {
    const response = await api.get<{ stats: OrderStats }>(ENDPOINTS.orders.stats);
    return response.data.stats;
  },

  /**
   * Get table status with current orders
   */
  async getTableStatus(params?: {
    status?: 'available' | 'occupied' | 'all';
  }) {
    const response = await api.get(ENDPOINTS.orders.tableStatus, { params });
    return response.data;
  },
};
