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
  totalVolume: string; // e.g., "150.5 L"
  totalRevenue: number;
  totalProfit: number;
}

export interface SalesSummaryTableRow {
  date: string;
  productName: string;
  categoryName: string;
  quantity: number;
  volume: string; // e.g., "1 L" or "500 ML"
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

// Volume-wise summary types
export interface VolumeWiseSummaryRow {
  dateRange: string; // e.g., "Jan 01, 2026 - Jan 15, 2026"
  productName: string;
  categoryName: string;
  quantity: number;
  volume: string; // e.g., "1 L" or "500 ML"
  revenue: number;
  profit: number;
  totalVolume: string; // e.g., "150.5 L" (quantity * unit volume)
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
