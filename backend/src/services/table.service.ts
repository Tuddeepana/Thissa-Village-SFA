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
  });

  return {
    tables,
    total: tables.length,
  };
};

// Get expanded list showing individual tables (e.g., Table 1, Table 2, Table 3)
export const getExpandedTableList = async (): Promise<ExpandedTableItem[]> => {
  const tables = await (prisma as any).restaurantTable.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  const expandedList: ExpandedTableItem[] = [];

  for (const table of tables) {
    for (let i = 1; i <= table.quantity; i++) {
      expandedList.push({
        id: `${table.id}-${i}`,
        displayName: `${table.name} ${i}`,
        baseName: table.name,
        tableNumber: i,
        table_type: table.table_type,
        parentId: table.id,
      });
    }
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

