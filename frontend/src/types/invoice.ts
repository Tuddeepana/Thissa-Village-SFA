export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'other';
  status: 'paid' | 'pending' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  total: number;
  litersPerUnit?: number; // liters per one bottle/unit
  bottleVolume?: string;  // e.g., "750 ml" or "1 l"
}

export interface InvoiceFilters {
  invoiceNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
  month?: number;
  year?: number;
  category?: string;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  profit: number;
  invoiceCount: number;
}

export interface AnnualRevenueData {
  year: number;
  totalRevenue: number;
  totalProfit: number;
  monthlyData: MonthlyRevenueData[];
}

export interface LowStockItem {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  minStock: number;
  reorderQuantity: number;
}
