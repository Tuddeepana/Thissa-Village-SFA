export interface RestaurantTableDTO {
  id: string;
  name: string;
  table_type: 'VIP' | 'NORMAL';
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type RestaurantTableCreateInput = {
  name: string;
  table_type: 'VIP' | 'NORMAL';
  quantity: number;
};

export type RestaurantTableUpdateInput = Partial<{
  name: string;
  table_type: 'VIP' | 'NORMAL';
  quantity: number;
}>;

export type RestaurantTableListResult = {
  tables: RestaurantTableDTO[];
  total: number;
};

// For expanded table list view (showing Table 1, Table 2, etc.)
export type ExpandedTableItem = {
  id: string;
  displayName: string; // e.g., "Table 1", "VIP Table 2"
  baseName: string;    // e.g., "Table"
  tableNumber: number; // e.g., 1, 2, 3
  table_type: 'VIP' | 'NORMAL';
  table_status: 'FREE' | 'OCCUPIED';
  parentId: string;    // ID of the RestaurantTable record
};

