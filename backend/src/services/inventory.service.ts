import prisma from '../lib/prisma';
import type { InventoryCreateInput, InventoryDTO, InventoryListQuery, PaginatedResult } from '../types/inventory.types';

// Inventory operations separated from Invoice
class InventoryService {
  async getLastRecordForProduct(productId: string, tx?: any): Promise<InventoryDTO | null> {
    const client = tx ?? (prisma as any);
    const last = await client.inventory.findFirst({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
    return (last ?? null) as InventoryDTO | null;
  }

  async createMovement(input: InventoryCreateInput, tx?: any): Promise<InventoryDTO> {
    const client = tx ?? (prisma as any);
    const last = await this.getLastRecordForProduct(input.productId, client);
    const prevAvailable = last?.available_quantity ?? 0;
    const newAvailable = prevAvailable + input.quantity_moved; // positive adds stock; negative reduces

    const rec = await client.inventory.create({
      data: {
        // Connect required product relation
        product: { connect: { id: input.productId } },
        // Connect optional invoice or bill relations
        ...(input.invoiceId ? { invoice: { connect: { id: input.invoiceId } } } : {}),
        ...(input.billId ? { bill: { connect: { id: input.billId } } } : {}),
        quantity_moved: input.quantity_moved,
        available_quantity: newAvailable,
      },
    });
    return rec as InventoryDTO;
  }

  /**
   * Bulk create inventory movements for multiple products in just 2 queries.
   * Replaces the previous N+1 pattern (2 queries per item) with:
   *   1. One DISTINCT ON query to get latest available_quantity per product
   *   2. One createMany to insert all movements at once
   *
   * @param items - Array of { productId, billId, quantity_moved }
   * @param tx - Prisma transaction client
   * @returns Array of created inventory records
   */
  async createBulkMovements(
    items: Array<{ productId: string; billId: string; quantity_moved: number }>,
    tx: any
  ): Promise<InventoryDTO[]> {
    if (items.length === 0) return [];

    const productIds = items.map((i) => i.productId);

    // 1. Single query: get latest available_quantity per product using DISTINCT ON
    const latestRows: Array<{ productId: string; available_quantity: number }> =
      await tx.$queryRawUnsafe(
        `SELECT DISTINCT ON ("productId")
           "productId",
           "available_quantity"
         FROM "inventory"
         WHERE "productId" = ANY($1)
         ORDER BY "productId", "createdAt" DESC`,
        productIds
      );

    // Build lookup map: productId → latest available_quantity
    const latestMap = new Map<string, number>();
    for (const row of latestRows) {
      latestMap.set(row.productId, Number(row.available_quantity));
    }

    // 2. Prepare all movement records in memory
    const movementData = items.map((item) => {
      const prevAvailable = latestMap.get(item.productId) ?? 0;
      const newAvailable = prevAvailable + item.quantity_moved;
      return {
        productId: item.productId,
        billId: item.billId,
        quantity_moved: item.quantity_moved,
        available_quantity: newAvailable,
      };
    });

    // 3. Single bulk insert via createMany
    await tx.inventory.createMany({ data: movementData });

    // 4. Fetch the created records to return them (they share the same billId)
    const created = await tx.inventory.findMany({
      where: { billId: items[0].billId },
      orderBy: { createdAt: 'asc' },
    });

    return created as InventoryDTO[];
  }

  async getById(id: string): Promise<InventoryDTO | null> {
    const rec = await (prisma as any).inventory.findUnique({ where: { id } });
    return (rec ?? null) as InventoryDTO | null;
  }

  async list(query: InventoryListQuery = {}): Promise<PaginatedResult<InventoryDTO>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const where: any = {};
    if (query.productId) where.productId = query.productId;
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.billId) where.billId = query.billId;

    const [total, items] = await Promise.all([
      (prisma as any).inventory.count({ where }),
      (prisma as any).inventory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { data: items as InventoryDTO[], page, limit, total };
  }
}

export const inventoryService = new InventoryService();