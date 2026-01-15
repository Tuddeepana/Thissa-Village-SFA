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
  totalVolume: string;
  totalRevenue: number;
  totalProfit: number;
}

export interface SalesSummaryTableRow {
  date: string;
  productName: string;
  categoryName: string;
  quantity: number;
  volume: string;
  revenue: number;
  profit: number;
}

export interface SalesSummaryResponse {
  success: boolean;
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
  dateRange: string;
  productName: string;
  categoryName: string;
  quantity: number;
  volume: string;
  revenue: number;
  profit: number;
  totalVolume: string;
}

export interface VolumeWiseSummaryResponse {
  success: boolean;
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
