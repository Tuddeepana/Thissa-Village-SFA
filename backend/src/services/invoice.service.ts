import prisma from '../lib/prisma';
import type { InvoiceCreateInput, InvoiceDTO, InvoiceUpdateInput, PaginatedResult, InvoiceCreateWithItemsInput, InvoiceWithProductsDTO } from '../types/invoice.types';
import type { InventoryDTO } from '../types/inventory.types';
import { inventoryService } from './inventory.service';

class InvoiceService {
  async createInvoice(input: InvoiceCreateInput): Promise<InvoiceDTO> {
    const invoice = await (prisma as any).invoice.create({
      data: {
        in_number: input.in_number,
        invoiceDate: new Date(input.invoiceDate),
      },
    });
    return invoice as InvoiceDTO;
  }

  async createInvoiceWithItems(input: InvoiceCreateWithItemsInput): Promise<{ invoice: InvoiceDTO; inventory: InventoryDTO[] }> {
    const result = await (prisma as any).$transaction(async (tx: any) => {
      // Use subtotal provided by the frontend (assumed to be numeric or numeric-string)
      const providedSubtotal = input.subtotal !== undefined ? Number(input.subtotal) : 0;

      const createdInvoice = await tx.invoice.create({
        data: {
          in_number: input.in_number,
          invoiceDate: new Date(input.invoiceDate),
          subtotal: providedSubtotal.toFixed(2),
        },
      });

      const inventoryRecords: InventoryDTO[] = [];

      for (const item of input.items) {
        const rec = await inventoryService.createMovement(
          {
            productId: item.productId,
            invoiceId: createdInvoice.id,
            quantity_moved: item.quantityMoved,
          },
          tx
        );
        inventoryRecords.push(rec);
      }

      return { invoice: createdInvoice as InvoiceDTO, inventory: inventoryRecords };
    });

    return result;
  }

  async getInvoiceById(id: string): Promise<InvoiceDTO | null> {
    const invoice = await (prisma as any).invoice.findUnique({ where: { id } });
    return invoice as InvoiceDTO | null;
  }

  async listInvoices(query: { page?: number; limit?: number; search?: string }): Promise<PaginatedResult<InvoiceDTO>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const where: any = {};

    if (query.search) {
      where.OR = [{ in_number: { contains: query.search, mode: 'insensitive' } }];
    }

    const [total, items] = await Promise.all([
      (prisma as any).invoice.count({ where }),
      (prisma as any).invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { data: items as InvoiceDTO[], page, limit, total };
  }

  async listInvoicesWithProducts(query: { page?: number; limit?: number; search?: string }): Promise<PaginatedResult<InvoiceWithProductsDTO>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const where: any = {};

    if (query.search) {
      where.OR = [{ in_number: { contains: query.search, mode: 'insensitive' } }];
    }

    const [total, items] = await Promise.all([
      (prisma as any).invoice.count({ where }),
      (prisma as any).invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // include product and the product's category so we can surface category name to the frontend
        include: { inventoryRecords: { include: { product: { include: { category: true } } } } },
      }),
    ]);

    const data = (items as any[]).map((inv) => ({
      id: inv.id,
      in_number: inv.in_number,
      invoiceDate: inv.invoiceDate instanceof Date ? inv.invoiceDate.toISOString() : String(inv.invoiceDate),
      createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : String(inv.createdAt),
      updatedAt: inv.updatedAt instanceof Date ? inv.updatedAt.toISOString() : String(inv.updatedAt),
      subtotal: inv.subtotal !== undefined ? String(inv.subtotal) : '0',
      itemCount: (inv.inventoryRecords || []).length,
      products: (inv.inventoryRecords || []).map((rec: any) => ({
        productId: rec.productId,
        name: rec.product?.name ?? null,
        categoryName: rec.product?.category?.name ?? null,
        litres: rec.product?.litres !== undefined ? String(rec.product.litres) : null,
        bottle_volume: rec.product?.bottle_volume ?? null,
        cost_price: rec.product?.cost_price !== undefined ? String(rec.product.cost_price) : null,
        selling_price: rec.product?.selling_price !== undefined ? String(rec.product.selling_price) : null,
        quantity_moved: rec.quantity_moved,
      })),
    })) as InvoiceWithProductsDTO[];

    return { data, page, limit, total };
  }

  async updateInvoice(id: string, input: InvoiceUpdateInput): Promise<InvoiceDTO> {
    const data: any = {};
    if (input.in_number !== undefined) data.in_number = input.in_number;
    if (input.invoiceDate !== undefined) data.invoiceDate = new Date(input.invoiceDate as any);
    if (input.subtotal !== undefined) data.subtotal = (typeof input.subtotal === 'number' ? input.subtotal : Number(input.subtotal)).toFixed(2);

    const invoice = await (prisma as any).invoice.update({ where: { id }, data });
    return invoice as InvoiceDTO;
  }

  async deleteInvoice(id: string): Promise<InvoiceDTO> {
    const invoice = await (prisma as any).invoice.delete({ where: { id } });
    return invoice as InvoiceDTO;
  }
}

export const invoiceService = new InvoiceService();
