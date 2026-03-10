export type MyStockCardResponse = {
  totalItems: number;
  totalQuantity: number;
  lowStockItems: number;
  outOfStockItems: number;
};

export type MyStockTableRow = {
  productId: string;
  productName: string;
  category: { id: string; name: string } | null;
  availableQuantity: number;
  minStock: number; // low_stock from product
  sellingPrice?: number; // selling price from product (nullable)
  bottle_size?: string | null; // constructed as litres + ' ' + bottle_volume
  barcode?: string | null; // barcode from product
  status: 'InStock' | 'LowStock' | 'OutOfStock';
  lastUpdatedAt: string | null;
};

export type MyStockTableResponse = {
  data: MyStockTableRow[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
};

export type MyStockResponse = {
  cardResponse: MyStockCardResponse;
  tableResponse: MyStockTableResponse;
};

export type MyStockQuery = {
  page?: number;
  pageSize?: number;
  productName?: string;
  barcode?: string;
  categoryId?: string;
  status?: 'InStock' | 'LowStock' | 'OutOfStock' | string;
  // When true, return all filtered rows in tableResponse.data (no slicing/pagination)
  noPagination?: boolean;
};
