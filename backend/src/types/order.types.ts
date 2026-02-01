export interface CreateOrderDTO {
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
  items: CreateOrderItemDTO[];
}

export interface CreateOrderItemDTO {
  productId: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface UpdateOrderDTO {
  status?: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface AddOrderItemDTO {
  productId: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  orderType?: string;
  tableId?: string;
}
