export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKE_AWAY = 'TAKE_AWAY',
}

export interface OrderItem {
  id: string;
  productId: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  createdAt: Date;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_type: string;
  order_type: OrderType;
  table_id?: string;
  table_name?: string;
  table_number?: number;
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
  items: OrderItem[];
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
  customer_type: "local" | "foreigner";
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

export interface OrderListParams {
  status?: OrderStatus;
  order_type?: OrderType;
  customer_name?: string;
  table_number?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderStats {
  pending: number;
  completed: number;
  cancelled: number;
  total: number;
}
