import prisma from '../lib/prisma';
import type { InvoiceCreateInput, InvoiceDTO, InvoiceUpdateInput, PaginatedResult, InvoiceCreateWithItemsInput } from '../types/invoice.types';
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
      const createdInvoice = await tx.invoice.create({
        data: {
          in_number: input.in_number,
          invoiceDate: new Date(input.invoiceDate),
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

  async updateInvoice(id: string, input: InvoiceUpdateInput): Promise<InvoiceDTO> {
    const data: any = {};
    if (input.in_number !== undefined) data.in_number = input.in_number;
    if (input.invoiceDate !== undefined) data.invoiceDate = new Date(input.invoiceDate as any);

    const invoice = await (prisma as any).invoice.update({ where: { id }, data });
    return invoice as InvoiceDTO;
  }

  async deleteInvoice(id: string): Promise<InvoiceDTO> {
    const invoice = await (prisma as any).invoice.delete({ where: { id } });
    return invoice as InvoiceDTO;
  }
}

export const invoiceService = new InvoiceService();
