import api from '../client';

export interface CreateOrderPayload {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  order_type: 'DINE_IN' | 'TAKE_AWAY';
  tableId?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  terminal_id?: string;
  cashier_name: string;
  notes?: string;
  items: {
    productId: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
}

export interface UpdateOrderPayload {
  status?: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface AddOrderItemPayload {
  productId: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CompleteOrderPayload {
  payment_method: string;
  cash_given: number;
  balance_given: number;
}

export const orderService = {
  // Create a new order
  async create(payload: CreateOrderPayload) {
    const response = await api.post('/orders', payload);
    return response.data;
  },

  // Get all orders with filters
  async list(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    orderType?: string;
    tableId?: string;
  }) {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  // Get order by ID
  async getById(id: string) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Update order
  async update(id: string, payload: UpdateOrderPayload) {
    const response = await api.patch(`/orders/${id}`, payload);
    return response.data;
  },

  // Add item to order
  async addItem(id: string, payload: AddOrderItemPayload) {
    const response = await api.post(`/orders/${id}/items`, payload);
    return response.data;
  },

  // Complete order with payment
  async complete(id: string, payload: CompleteOrderPayload) {
    const response = await api.post(`/orders/${id}/complete`, payload);
    return response.data;
  },

  // Cancel order
  async cancel(id: string) {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
};
