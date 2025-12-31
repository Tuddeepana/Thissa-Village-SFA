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