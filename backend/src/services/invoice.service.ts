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
      // Frontend sends discount as a percentage (0-100). store discount as an amount in DB.
      const providedDiscountRate = input.discount !== undefined ? Number(input.discount) : 0;
      const providedDiscount = (providedSubtotal * providedDiscountRate) / 100;
      const providedStatus = input.paid_status ?? 'PENDING';

      const createdInvoice = await tx.invoice.create({
        data: {
          in_number: input.in_number,
          invoiceDate: new Date(input.invoiceDate),
          subtotal: providedSubtotal.toFixed(2),
          discount: providedDiscount.toFixed(2),
          paid_status: providedStatus,
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

  async listInvoicesWithProducts(query: { page?: number; limit?: number; search?: string; category?: string; month?: number; year?: number; dateFrom?: Date | string; dateTo?: Date | string; noPagination?: boolean }): Promise<PaginatedResult<InvoiceWithProductsDTO>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const where: any = {};

    const andClauses: any[] = [];

    if (query.search) {
      andClauses.push({ in_number: { contains: query.search, mode: 'insensitive' } });
    }

    // Date filters: month/year or explicit date range
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (query.month !== undefined && query.year !== undefined) {
      // Month filtering requires year; derive start/end of month
      startDate = new Date(query.year, query.month, 1);
      endDate = new Date(query.year, query.month + 1, 0, 23, 59, 59, 999);
    } else if (query.year !== undefined && query.month === undefined) {
      // Year-only filter
      startDate = new Date(query.year, 0, 1);
      endDate = new Date(query.year, 11, 31, 23, 59, 59, 999);
    }

    if (query.dateFrom) {
      const df = typeof query.dateFrom === 'string' ? new Date(query.dateFrom) : query.dateFrom;
      startDate = df;
    }
    if (query.dateTo) {
      const dt = typeof query.dateTo === 'string' ? new Date(query.dateTo) : query.dateTo;
      endDate = dt;
    }

    if (startDate || endDate) {
      const dateClause: any = {};
      if (startDate) dateClause.gte = startDate;
      if (endDate) dateClause.lte = endDate;
      andClauses.push({ invoiceDate: dateClause });
    }

    // Category filter: invoices that have at least one inventory record whose product's category matches
    if (query.category) {
      andClauses.push({
        inventoryRecords: {
          some: {
            product: {
              category: { name: { equals: query.category, mode: 'insensitive' } },
            },
          },
        },
      });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const useNoPagination = !!query.noPagination;
    const [total, items] = await Promise.all([
      (prisma as any).invoice.count({ where }),
      (prisma as any).invoice.findMany({
        where,
        skip: useNoPagination ? undefined : (page - 1) * limit,
        take: useNoPagination ? undefined : limit,
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
      discount: inv.discount !== undefined ? String(inv.discount) : '0',
      paid_status: inv.paid_status ?? 'PENDING',
      itemCount: (inv.inventoryRecords || []).length,
      products: (inv.inventoryRecords || []).map((rec: any) => ({
        productId: rec.productId,
        name: rec.product?.name ?? null,
        categoryName: rec.product?.category?.name ?? null,
        cost_price: rec.product?.cost_price !== undefined ? String(rec.product.cost_price) : null,
        foreigner_price: rec.product?.foreigner_price !== undefined ? String(rec.product.foreigner_price) : null,
        local_price: rec.product?.local_price !== undefined ? String(rec.product.local_price) : null,
        quantity_moved: rec.quantity_moved,
      })),
    })) as InvoiceWithProductsDTO[];

    return { data, page: useNoPagination ? 1 : page, limit: useNoPagination ? total : limit, total };
  }

  // Combined response for invoices page: card metrics + table data
  async listInvoicesWithProductsCombined(query: { page?: number; limit?: number; search?: string; category?: string; month?: number; year?: number; dateFrom?: Date | string; dateTo?: Date | string; noPagination?: boolean }): Promise<{
    cardResponse: { totalInvoices: number; paidInvoices: number; pendingInvoices: number; totalCost: number };
    tableResponse: { data: InvoiceWithProductsDTO[]; pagination: { currentPage: number; pageSize: number; totalPages: number; totalRecords: number } };
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const where: any = {};

    const andClauses: any[] = [];

    if (query.search) {
      andClauses.push({ in_number: { contains: query.search, mode: 'insensitive' } });
    }

    // Date filters: month/year or explicit date range
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (query.month !== undefined && query.year !== undefined) {
      startDate = new Date(query.year, query.month, 1);
      endDate = new Date(query.year, query.month + 1, 0, 23, 59, 59, 999);
    } else if (query.year !== undefined && query.month === undefined) {
      startDate = new Date(query.year, 0, 1);
      endDate = new Date(query.year, 11, 31, 23, 59, 59, 999);
    }

    if (query.dateFrom) {
      const df = typeof query.dateFrom === 'string' ? new Date(query.dateFrom) : query.dateFrom;
      startDate = df;
    }
    if (query.dateTo) {
      const dt = typeof query.dateTo === 'string' ? new Date(query.dateTo) : query.dateTo;
      endDate = dt;
    }

    if (startDate || endDate) {
      const dateClause: any = {};
      if (startDate) dateClause.gte = startDate;
      if (endDate) dateClause.lte = endDate;
      andClauses.push({ invoiceDate: dateClause });
    }

    // Category filter: invoices that have at least one inventory record whose product's category matches
    if (query.category) {
      andClauses.push({
        inventoryRecords: {
          some: {
            product: {
              category: { name: { equals: query.category, mode: 'insensitive' } },
            },
          },
        },
      });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const useNoPagination = !!query.noPagination;

    // Table: paginated invoices with products
    const [total, items] = await Promise.all([
      (prisma as any).invoice.count({ where }),
      (prisma as any).invoice.findMany({
        where,
        skip: useNoPagination ? undefined : (page - 1) * limit,
        take: useNoPagination ? undefined : limit,
        orderBy: { createdAt: 'desc' },
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
      discount: inv.discount !== undefined ? String(inv.discount) : '0',
      paid_status: inv.paid_status ?? 'PENDING',
      itemCount: (inv.inventoryRecords || []).length,
      products: (inv.inventoryRecords || []).map((rec: any) => ({
        productId: rec.productId,
        name: rec.product?.name ?? null,
        categoryName: rec.product?.category?.name ?? null,
        cost_price: rec.product?.cost_price !== undefined ? String(rec.product.cost_price) : null,
        foreigner_price: rec.product?.foreigner_price !== undefined ? String(rec.product.foreigner_price) : null,
        local_price: rec.product?.local_price !== undefined ? String(rec.product.local_price) : null,
        quantity_moved: rec.quantity_moved,
      })),
    })) as InvoiceWithProductsDTO[];

    const tableResponse = {
      data,
      pagination: {
        currentPage: useNoPagination ? 1 : page,
        pageSize: useNoPagination ? total : limit,
        totalPages: useNoPagination ? 1 : Math.max(1, Math.ceil(total / limit)),
        totalRecords: total,
      },
    };

    // Card metrics: compute from all filtered invoices (not just paginated)
    const allInvoices = await (prisma as any).invoice.findMany({ where, select: { id: true, paid_status: true } });
    const ids = allInvoices.map((i: any) => i.id);
    const totalInvoices = allInvoices.length;
    const paidInvoices = allInvoices.filter((i: any) => i.paid_status === 'PAID').length;
    const pendingInvoices = allInvoices.filter((i: any) => i.paid_status === 'PENDING').length;

    let totalCost = 0;
    if (ids.length) {
      const invMovements = await (prisma as any).inventory.findMany({
        where: { invoiceId: { in: ids } },
        include: { product: { select: { cost_price: true } } },
      });
      for (const mv of invMovements) {
        const cp = mv.product?.cost_price !== undefined && mv.product?.cost_price !== null ? Number(mv.product.cost_price) : 0;
        totalCost += cp * Number(mv.quantity_moved ?? 0);
      }
    }

    const cardResponse = { totalInvoices, paidInvoices, pendingInvoices, totalCost: Number(totalCost.toFixed(2)) };

    return { cardResponse, tableResponse };
  }

  async updateInvoice(id: string, input: InvoiceUpdateInput): Promise<InvoiceDTO> {
    const data: any = {};
    if (input.in_number !== undefined) data.in_number = input.in_number;
    if (input.invoiceDate !== undefined) data.invoiceDate = new Date(input.invoiceDate as any);
    if (input.subtotal !== undefined) data.subtotal = (typeof input.subtotal === 'number' ? input.subtotal : Number(input.subtotal)).toFixed(2);
    // Frontend sends discount as a percentage (0-100). store discount as an amount in DB.
    if (input.discount !== undefined) {
      const discountRate = typeof input.discount === 'number' ? input.discount : Number(input.discount);
      const subtotal = input.subtotal !== undefined ? (typeof input.subtotal === 'number' ? input.subtotal : Number(input.subtotal)) : undefined;

      if (subtotal !== undefined) {
        data.discount = ((subtotal * discountRate) / 100).toFixed(2);
      } else {
        // If subtotal isn't provided in the update request, fetch current subtotal to compute discount amount.
        const existing = await (prisma as any).invoice.findUnique({ where: { id }, select: { subtotal: true } });
        const existingSubtotal = existing?.subtotal !== undefined && existing?.subtotal !== null ? Number(existing.subtotal) : 0;
        data.discount = ((existingSubtotal * discountRate) / 100).toFixed(2);
      }
    }
    if (input.paid_status !== undefined) data.paid_status = input.paid_status;

    const invoice = await (prisma as any).invoice.update({ where: { id }, data });
    return invoice as InvoiceDTO;
  }

  async deleteInvoice(id: string): Promise<InvoiceDTO> {
    // Delete within transaction: first delete inventory records, then invoice
    const result = await (prisma as any).$transaction(async (tx: any) => {
      // Delete all inventory records associated with this invoice
      await tx.inventory.deleteMany({ where: { invoiceId: id } });

      // Delete the invoice
      const invoice = await tx.invoice.delete({ where: { id } });
      return invoice;
    });

    return result as InvoiceDTO;
  }
}

export const invoiceService = new InvoiceService();
