import prisma from '../lib/prisma';
import type { MyStockQuery, MyStockResponse, MyStockTableRow } from '../types/mystock.types';

// Business rules:
// - latest available quantity per product is obtained by ordering Inventory by createdAt desc and taking the first record for that product
// - status: OutOfStock = availableQuantity <= 0, LowStock = availableQuantity > 0 && availableQuantity <= product.low_stock, InStock = availableQuantity > product.low_stock

/**
 * Optimised mystock query using raw SQL with LATERAL JOIN.
 *
 * Previous approach: fetch ALL products → fetch ALL inventory rows → JS filter/paginate.
 * New approach:      two parallel SQL queries (card metrics + paginated rows) that use
 *                    LATERAL JOIN to grab only the latest inventory row per product.
 *                    The existing idx_inventory_product_latest index supports this.
 */
/**
 * Optimised mystock query using raw SQL with LATERAL JOIN.
 *
 * Previous approach: fetch ALL products → fetch ALL inventory rows → JS filter/paginate.
 * New approach:      two parallel SQL queries (card metrics + paginated rows) that use
 *                    LATERAL JOIN to grab only the latest inventory row per product.
 *                    The existing idx_inventory_product_latest index supports this.
 */
export const getMyStock = async (query: MyStockQuery): Promise<MyStockResponse> => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 10;
  const skip = (page - 1) * pageSize;
  const useNoPagination = !!query.noPagination;

  // ── Build dynamic WHERE fragments & params ────────────────────────
  const filterParams: any[] = [];
  const filterClauses: string[] = [];
  let filterParamIdx = 1; // parameter index for filters only

  if (query.productName) {
    filterClauses.push(`p."name" ILIKE $${filterParamIdx}`);
    filterParams.push(`%${query.productName}%`);
    filterParamIdx++;
  }

  if (query.categoryId) {
    filterClauses.push(`p."categoryId" = $${filterParamIdx}`);
    filterParams.push(query.categoryId);
    filterParamIdx++;
  }

  const productFilter = filterClauses.length > 0
    ? 'AND ' + filterClauses.join(' AND ')
    : '';

  // Status is computed, so it's filtered in an outer WHERE on the CTE
  const statusFilter = query.status
    ? `WHERE s."status" = '${query.status === 'InStock' ? 'InStock' : query.status === 'LowStock' ? 'LowStock' : 'OutOfStock'}'`
    : '';

  // ── CTE: core stock view (shared by both queries) ─────────────────
  const stockCTE = `
    WITH stock AS (
      SELECT
        p."id"              AS "productId",
        p."name"            AS "productName",
        p."product_type"    AS "productType",
        p."unit_type"       AS "unitType",
        p."low_stock"       AS "minStock",
        p."foreigner_price" AS "foreignerPrice",
        p."local_price"     AS "localPrice",
        c."id"              AS "categoryId",
        c."name"            AS "categoryName",
        CASE
          WHEN p."product_type" = 'HANDMADE' THEN 0
          ELSE COALESCE(latest_inv."available_quantity", 0)
        END                 AS "availableQuantity",
        latest_inv."updatedAt" AS "lastUpdatedAt",
        CASE
          WHEN p."product_type" = 'HANDMADE' THEN 'OutOfStock'
          WHEN COALESCE(latest_inv."available_quantity", 0) <= 0 THEN 'OutOfStock'
          WHEN p."low_stock" IS NOT NULL
               AND COALESCE(latest_inv."available_quantity", 0) <= p."low_stock" THEN 'LowStock'
          ELSE 'InStock'
        END                 AS "status"
      FROM "products" p
      LEFT JOIN "categories" c ON c."id" = p."categoryId"
      LEFT JOIN LATERAL (
        SELECT i."available_quantity", i."updatedAt"
        FROM "inventory" i
        WHERE i."productId" = p."id"
        ORDER BY i."createdAt" DESC
        LIMIT 1
      ) latest_inv ON true
      WHERE p."deletedAt" IS NULL ${productFilter}
    )
  `;

  // ── Fire both queries in parallel ──────────────────────────────────
  const [cardRows, tableRows, countRows] = await Promise.all([
    // 1. Card metrics (aggregates over ALL matching products, ignoring status filter & pagination)
    (prisma as any).$queryRawUnsafe(`
      ${stockCTE}
      SELECT
        COUNT(*)::int                                                         AS "totalItems",
        COALESCE(SUM(s."availableQuantity"), 0)::int                          AS "totalQuantity",
        COUNT(*) FILTER (WHERE s."status" = 'LowStock')::int                  AS "lowStockItems",
        COUNT(*) FILTER (WHERE s."status" = 'OutOfStock')::int                AS "outOfStockItems"
      FROM stock s
    `, ...filterParams),

    // 2. Paginated table rows (with optional status filter)
    (prisma as any).$queryRawUnsafe(`
      ${stockCTE}
      SELECT s.*
      FROM stock s
      ${statusFilter}
      ORDER BY s."productName" ASC
      ${useNoPagination ? '' : `LIMIT ${pageSize} OFFSET ${skip}`}
    `, ...filterParams),

    // 3. Total count for pagination (with status filter applied)
    (prisma as any).$queryRawUnsafe(`
      ${stockCTE}
      SELECT COUNT(*)::int AS "total"
      FROM stock s
      ${statusFilter}
    `, ...filterParams),
  ]);

  // ── Post-process results ───────────────────────────────────────────
  const card = cardRows[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 };

  const totalRecords: number = countRows[0]?.total ?? 0;
  const totalPages = useNoPagination ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));

  const data: MyStockTableRow[] = tableRows.map((r: any) => ({
    productId: r.productId,
    productName: r.productName,
    productType: r.productType,
    unitType: r.unitType,
    category: r.categoryId ? { id: r.categoryId, name: r.categoryName } : null,
    availableQuantity: Number(r.availableQuantity),
    minStock: r.minStock ?? 0,
    foreignerPrice: r.foreignerPrice ? Number(r.foreignerPrice) : undefined,
    localPrice: r.localPrice ? Number(r.localPrice) : undefined,
    status: r.status as 'InStock' | 'LowStock' | 'OutOfStock',
    lastUpdatedAt: r.lastUpdatedAt ? new Date(r.lastUpdatedAt).toISOString() : null,
  }));

  return {
    cardResponse: {
      totalItems: Number(card.totalItems),
      totalQuantity: Number(card.totalQuantity),
      lowStockItems: Number(card.lowStockItems),
      outOfStockItems: Number(card.outOfStockItems),
    },
    tableResponse: {
      data,
      pagination: {
        currentPage: useNoPagination ? 1 : page,
        pageSize: useNoPagination ? totalRecords : pageSize,
        totalPages,
        totalRecords,
      },
    },
  };
};
