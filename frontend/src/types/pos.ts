export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number; // Cost price for profit calculation
  stock: number;
  minStock: number; // Minimum stock level for warnings
  // Optional bottle volume label (e.g., "750 ml" or "1 L")
  bottleVolume?: string;
  barcode?: string;
  image?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Bill {
  id: string;
  billNumber?: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  taxRate: number; // Tax rate as percentage (e.g., 15 for 15%)
  discount: number;
  discountRate: number; // Discount rate as percentage
  total: number;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: 'cash' | 'card' | 'credit' | 'other';
  amountPaid: number;
  change: number;
  creditDescription?: string; // Description when payment method is credit
  createdAt: Date;
}

export interface StockWarning {
  product: Product;
  currentStock: number;
  minStock: number;
  requestedQuantity: number;
}
