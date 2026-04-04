import prisma from '../lib/prisma';
import type { MyStockQuery, MyStockResponse, MyStockTableRow } from '../types/mystock.types';

// Business rules:
// - latest available quantity per product is obtained by ordering Inventory by createdAt desc and taking the first record for that product
// - status: OutOfStock = availableQuantity <= 0, LowStock = availableQuantity > 0 && availableQuantity <= product.low_stock, InStock = availableQuantity > product.low_stock

export const getMyStock = async (query: MyStockQuery): Promise<MyStockResponse> => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 10;
  const skip = (page - 1) * pageSize;

  const productName = query.productName || null;
  const barcode = query.barcode || null;
  const categoryId = query.categoryId || null;
  const statusFilter = query.status || null;

  // We use a Common Table Expression (CTE) to:
  // 1. Get the latest inventory record for each product.
  // 2. Filter products based on name, barcode, and category.
  // 3. Calculate status and other fields at the database level.

  const rawData: any[] = await prisma.$queryRaw`
    WITH LatestInventory AS (
      SELECT DISTINCT ON ("productId")
        "productId",
        "available_quantity",
        "updatedAt"
      FROM "inventory"
      ORDER BY "productId", "createdAt" DESC
    ),
    ProductStock AS (
      SELECT
        p.id AS "productId",
        p.name AS "productName",
        p.barcode,
        p.litres,
        p.bottle_volume AS "bottleVolume",
        p.selling_price AS "sellingPrice",
        p.low_stock AS "lowStock",
        c.id AS "categoryId",
        c.name AS "categoryName",
        COALESCE(li.available_quantity, 0) AS "availableQuantity",
        li."updatedAt" AS "lastUpdatedAt",
        CASE
          WHEN COALESCE(li.available_quantity, 0) <= 0 THEN 'OutOfStock'
          WHEN COALESCE(li.available_quantity, 0) <= p.low_stock THEN 'LowStock'
          ELSE 'InStock'
        END AS "status"
      FROM "products" p
      LEFT JOIN "categories" c ON p."categoryId" = c.id
      LEFT JOIN LatestInventory li ON p.id = li."productId"
      WHERE 
        (${productName}::text IS NULL OR p.name ILIKE '%' || ${productName} || '%' OR p.barcode ILIKE ${productName} || '%')
        AND (${barcode}::text IS NULL OR p.barcode ILIKE ${barcode} || '%')
        AND (${categoryId}::text IS NULL OR p."categoryId" = ${categoryId})
    )
    SELECT * FROM ProductStock
    WHERE (${statusFilter}::text IS NULL OR "status" = ${statusFilter})
    ORDER BY "productName" ASC
  `;

  const allRows: MyStockTableRow[] = rawData.map((row) => ({
    productId: row.productId,
    productName: row.productName,
    category: row.categoryId ? { id: row.categoryId, name: row.categoryNamez } : null,
    availableQuantity: row.availableQuantity,
    minStock: row.lowStock,
    sellingPrice: row.sellingPrice ? Number(row.sellingPrice) : undefined,
    bottle_size: row.litres !== null && row.bottleVolume ? `${String(row.litres)} ${row.bottleVolume.toLowerCase()}` : null,
    barcode: row.barcode,
    status: row.status as 'InStock' | 'LowStock' | 'OutOfStock',
    lastUpdatedAt: row.lastUpdatedAt ? new Date(row.lastUpdatedAt).toISOString() : null,
  }));

  // Compute card metrics from the full filtered set
  const totalItems = allRows.length;
  const totalQuantity = allRows.reduce((sum, row) => sum + row.availableQuantity, 0);
  const lowStockItems = allRows.filter((r) => r.status === 'LowStock').length;
  const outOfStockItems = allRows.filter((r) => r.status === 'OutOfStock').length;

  // Pagination
  const useNoPagination = !!query.noPagination;
  const totalRecords = allRows.length;
  const totalPages = useNoPagination ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const pageRows = useNoPagination ? allRows : allRows.slice(skip, skip + pageSize);

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
