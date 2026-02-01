import prisma from '../lib/prisma';
import {
  RestaurantTableCreateInput,
  RestaurantTableDTO,
  RestaurantTableUpdateInput,
  RestaurantTableListResult,
  ExpandedTableItem
} from '../types/table.types';

export const createRestaurantTable = async (payload: RestaurantTableCreateInput): Promise<RestaurantTableDTO> => {
  const created = await (prisma as any).restaurantTable.create({
    data: {
      name: payload.name,
      table_type: payload.table_type,
      quantity: payload.quantity,
    },
  });
  return created;
};

export const getRestaurantTableById = async (id: string): Promise<RestaurantTableDTO | null> => {
  const table = await (prisma as any).restaurantTable.findUnique({
    where: { id },
  });
  return table;
};

export const listRestaurantTables = async (): Promise<RestaurantTableListResult> => {
  const tables = await (prisma as any).restaurantTable.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      orders: {
        where: {
          status: {
            in: ['PENDING', 'PREPARING', 'READY'],
          },
        },
        take: 1,
      },
    },
  });

  // Map to include current status based on active orders
  const tablesWithStatus = tables.map((table: any) => ({
    ...table,
    currentStatus: table.table_status || 'FREE',
    hasActiveOrder: table.orders && table.orders.length > 0,
  }));

  return {
    tables: tablesWithStatus,
    total: tablesWithStatus.length,
  };
};

// Get expanded list showing individual tables (e.g., Table 1, Table 2, Table 3)
export const getExpandedTableList = async (): Promise<ExpandedTableItem[]> => {
  const tables = await (prisma as any).restaurantTable.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: {
      orders: {
        where: {
          status: {
            in: ['PENDING', 'PREPARING', 'READY'],
          },
        },
      },
    },
  });

  const expandedList: ExpandedTableItem[] = [];

  for (const table of tables) {
    // Check if table has active orders
    const hasActiveOrder = table.orders && table.orders.length > 0;
    const tableStatus = hasActiveOrder ? 'OCCUPIED' : table.table_status;
    
    // Extract table number from name (e.g., "Table 1" -> 1)
    const match = table.name.match(/\d+/);
    const tableNumber = match ? parseInt(match[0]) : 1;
    
    // Each table is already individual (quantity is for inventory tracking, not duplication)
    expandedList.push({
      id: table.id, // Use actual table ID, not composite
      displayName: table.name,
      baseName: table.name,
      tableNumber: tableNumber,
      table_type: table.table_type,
      table_status: tableStatus,
      parentId: table.id,
    });
  }

  return expandedList;
};

export const updateRestaurantTable = async (
  id: string,
  payload: RestaurantTableUpdateInput
): Promise<RestaurantTableDTO> => {
  const updated = await (prisma as any).restaurantTable.update({
    where: { id },
    data: {
      name: payload.name ?? undefined,
      table_type: payload.table_type ?? undefined,
      quantity: payload.quantity ?? undefined,
      updatedAt: new Date(),
    },
  });
  return updated;
};

export const deleteRestaurantTable = async (id: string): Promise<RestaurantTableDTO> => {
  // Soft delete
  const deleted = await (prisma as any).restaurantTable.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return deleted;
};

