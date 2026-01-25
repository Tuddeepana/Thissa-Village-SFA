export interface SalesSummaryQuery {
  fromDate?: string;
  toDate?: string;
  today?: boolean;
  year?: string;
  categoryId?: string;
  productId?: string;
  page?: number;
  pageSize?: number;
}

export interface SalesSummaryCardResponse {
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface SalesSummaryTableRow {
  date: string;
  productName: string;
  categoryName: string;
  quantity: number;
  foreignerPrice: number;
  localPrice: number;
  revenue: number;
  profit: number;
}

export interface SalesSummaryResponse {
  cardResponse: SalesSummaryCardResponse;
  tableResponse: {
    data: SalesSummaryTableRow[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalPages: number;
      totalRecords: number;
    };
  };
}

// Product-wise summary types (renamed from Volume-wise)
export interface VolumeWiseSummaryRow {
  dateRange: string; // e.g., "Jan 01, 2026 - Jan 15, 2026"
  productName: string;
  categoryName: string;
  quantity: number;
  foreignerPrice: number;
  localPrice: number;
  revenue: number;
  profit: number;
}

export interface VolumeWiseSummaryResponse {
  tableResponse: {
    data: VolumeWiseSummaryRow[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalPages: number;
      totalRecords: number;
    };
  };
}
