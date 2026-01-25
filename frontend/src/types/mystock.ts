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
  minStock: number;
  foreignerPrice: number | undefined;
  localPrice: number | undefined;
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
