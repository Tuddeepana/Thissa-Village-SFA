export type RestaurantTable = {
  id: string;
  name: string;
  table_type: 'VIP' | 'NORMAL';
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type CreateTablePayload = {
  name: string;
  table_type: 'VIP' | 'NORMAL';
  quantity: number;
};

export type UpdateTablePayload = Partial<{
  name: string;
  table_type: 'VIP' | 'NORMAL';
  quantity: number;
}>;

export type TableListResponse = {
  success: boolean;
  tables: RestaurantTable[];
  total: number;
};

export type ExpandedTableItem = {
  id: string;
  displayName: string;
  baseName: string;
  tableNumber: number;
  table_type: 'VIP' | 'NORMAL';
  parentId: string;
};

export type ExpandedTableListResponse = {
  success: boolean;
  tables: ExpandedTableItem[];
  total: number;
};

