export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKE_AWAY = 'TAKE_AWAY',
}

export interface OrderItemDTO {
  id: string;
  productId: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  createdAt: Date;
}

export interface OrderDTO {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  order_type: OrderType;
  table_id?: string | null;
  table_name?: string | null;
  table_number?: number | null;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  terminal_id: string;
  cashier_name: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemDTO[];
}

export interface CreateOrderItemInput {
  productId: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  order_type: OrderType;
  table_id?: string | null;
  table_name?: string | null;
  table_number?: number | null;
  tax?: number;
  discount?: number;
  terminal_id: string;
  cashier_name: string;
  notes?: string;
  items: CreateOrderItemInput[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export interface AddItemsToOrderInput {
  items: CreateOrderItemInput[];
}

export interface OrderStatsDTO {
  pending: number;
  preparing: number;
  ready: number;
  completed: number;
  cancelled: number;
  total: number;
}
