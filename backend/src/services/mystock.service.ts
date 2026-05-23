import { Prisma } from '@prisma/client';
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
  const useNoPagination = !!query.noPagination;

  // Use Promise.all to run metrics and data queries in parallel
  // and use Database-level pagination to improve speed.
  const [metricsResult, dataResult] = await Promise.all([
    // Query 1: Metrics (Total counts and sums)
    prisma.$queryRaw<any[]>`
      WITH ProductStock AS (
        SELECT
          COALESCE(li.available_quantity, 0) AS "availableQuantity",
          CASE
            WHEN COALESCE(li.available_quantity, 0) <= 0 THEN 'OutOfStock'
            WHEN COALESCE(li.available_quantity, 0) <= p.low_stock THEN 'LowStock'
            ELSE 'InStock'
          END AS "status"
        FROM "products" p
        LEFT JOIN LATERAL (
          SELECT available_quantity
          FROM "inventory" i
          WHERE i."productId" = p.id
          ORDER BY i."createdAt" DESC
          LIMIT 1
        ) li ON true
        WHERE 
          (${productName}::text IS NULL OR p.name ILIKE '%' || ${productName} || '%' OR p.barcode ILIKE ${productName} || '%')
          AND (${barcode}::text IS NULL OR p.barcode ILIKE ${barcode} || '%')
          AND (${categoryId}::text IS NULL OR p."categoryId" = ${categoryId})
      )
      SELECT 
        COUNT(*)::INT as "totalRecords",
        COALESCE(SUM("availableQuantity"), 0)::FLOAT as "totalQuantity",
        COUNT(*) FILTER (WHERE "status" = 'LowStock')::INT as "lowStockItems",
        COUNT(*) FILTER (WHERE "status" = 'OutOfStock')::INT as "outOfStockItems"
      FROM ProductStock
      WHERE (${statusFilter}::text IS NULL OR "status" = ${statusFilter})
    `,
    // Query 2: Paginated Data
    prisma.$queryRaw<any[]>`
      WITH ProductStock AS (
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
        LEFT JOIN LATERAL (
          SELECT "available_quantity", "updatedAt"
          FROM "inventory" i
          WHERE i."productId" = p.id
          ORDER BY i."createdAt" DESC
          LIMIT 1
        ) li ON true
        WHERE 
          (${productName}::text IS NULL OR p.name ILIKE '%' || ${productName} || '%' OR p.barcode ILIKE ${productName} || '%')
          AND (${barcode}::text IS NULL OR p.barcode ILIKE ${barcode} || '%')
          AND (${categoryId}::text IS NULL OR p."categoryId" = ${categoryId})
      )
      SELECT * FROM ProductStock
      WHERE (${statusFilter}::text IS NULL OR "status" = ${statusFilter})
      ORDER BY "productName" ASC
      ${useNoPagination ? Prisma.sql`` : Prisma.sql`LIMIT ${pageSize} OFFSET ${skip}`}
    `
  ]);

  const metrics = metricsResult[0] || { totalRecords: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 };

  const pageRows: MyStockTableRow[] = dataResult.map((row) => ({
    productId: row.productId,
    productName: row.productName,
    category: row.categoryId ? { id: row.categoryId, name: row.categoryName } : null,
    availableQuantity: row.availableQuantity,
    minStock: row.lowStock,
    sellingPrice: row.sellingPrice ? Number(row.sellingPrice) : undefined,
    bottle_size: row.litres !== null && row.bottleVolume ? `${String(row.litres)} ${row.bottleVolume.toLowerCase()}` : null,
    barcode: row.barcode,
    status: row.status as 'InStock' | 'LowStock' | 'OutOfStock',
    lastUpdatedAt: row.lastUpdatedAt ? new Date(row.lastUpdatedAt).toISOString() : null,
  }));

  const totalRecords = metrics.totalRecords;
  const totalPages = useNoPagination ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));

  return {
    cardResponse: {
      totalItems: totalRecords,
      totalQuantity: metrics.totalQuantity,
      lowStockItems: metrics.lowStockItems,
      outOfStockItems: metrics.outOfStockItems,
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
