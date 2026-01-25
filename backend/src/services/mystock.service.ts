import prisma from '../lib/prisma';
import type { MyStockQuery, MyStockResponse, MyStockTableRow } from '../types/mystock.types';

// Business rules:
// - latest available quantity per product is obtained by ordering Inventory by createdAt desc and taking the first record for that product
// - status: OutOfStock = availableQuantity <= 0, LowStock = availableQuantity > 0 && availableQuantity <= product.low_stock, InStock = availableQuantity > product.low_stock

export const getMyStock = async (query: MyStockQuery): Promise<MyStockResponse> => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 10;
  const skip = (page - 1) * pageSize;

  // Build product where filter
  const productWhere: any = {
    AND: [
      query.productName ? { name: { contains: query.productName, mode: 'insensitive' } } : {},
      query.categoryId ? { categoryId: query.categoryId } : {},
    ],
  };

  // Fetch all products matching filters (we need full set to compute cards and filtering)
  const products = await (prisma as any).product.findMany({
    where: productWhere,
    include: { category: true },
    orderBy: { name: 'asc' },
  });

  const productIds = products.map((p: any) => p.id);

  // Get latest inventory records for all matching products in one query, ordered so we can pick first per product
  const inventories = productIds.length
    ? await (prisma as any).inventory.findMany({
        where: { productId: { in: productIds } },
        orderBy: [{ productId: 'asc' }, { createdAt: 'desc' }],
      })
    : [];

  const latestMap: Record<string, any> = {};
  for (const inv of inventories) {
    if (!latestMap[inv.productId]) latestMap[inv.productId] = inv;
  }

  // Build rows for all products
  const allRows: MyStockTableRow[] = products.map((p: any) => {
    const inv = latestMap[p.id];
    const available = inv ? inv.available_quantity : 0;
    let status: 'InStock' | 'LowStock' | 'OutOfStock' = 'InStock';
    if (available <= 0) status = 'OutOfStock';
    else if (p.low_stock && available <= p.low_stock) status = 'LowStock';

    return {
      productId: p.id,
      productName: p.name,
      category: p.category ? { id: p.category.id, name: p.category.name } : null,
      availableQuantity: available,
      minStock: p.low_stock ?? 0,
      foreignerPrice: p.foreigner_price ? Number(p.foreigner_price) : undefined,
      localPrice: p.local_price ? Number(p.local_price) : undefined,
      status,
      lastUpdatedAt: inv ? inv.updatedAt?.toISOString?.() ?? inv.updatedAt : null,
    } as MyStockTableRow;
  });

  // Apply status filter if provided
  const filteredRows = query.status ? allRows.filter((r) => r.status === query.status) : allRows;

  // Pagination
  const totalRecords = filteredRows.length;
  const useNoPagination = !!query.noPagination;
  const totalPages = useNoPagination ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const pageRows = useNoPagination ? filteredRows : filteredRows.slice(skip, skip + pageSize);

  // Compute card metrics from allRows (not just paginated)
  let totalItems = allRows.length;
  let totalQuantity = allRows.reduce((s, r) => s + (r.availableQuantity || 0), 0);
  let lowStockItems = allRows.filter((r) => r.status === 'LowStock').length;
  let outOfStockItems = allRows.filter((r) => r.status === 'OutOfStock').length;

  return {
    cardResponse: {
      totalItems,
      totalQuantity,
      lowStockItems,
      outOfStockItems,
    },
    tableResponse: {
      data: pageRows,
      pagination: {
        currentPage: useNoPagination ? 1 : page,
        pageSize: useNoPagination ? totalRecords : pageSize,
        totalPages,
        totalRecords,
      },
    },
  };
};
