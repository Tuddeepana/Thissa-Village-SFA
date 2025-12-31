import prisma from '../lib/prisma';
import type { BillCreateInput, BillDTO, BillCreateWithItemsInput, BillListQuery, PaginatedResult, CardSummary } from '../types/bill.types';
import type { InventoryDTO } from '../types/inventory.types';
import { inventoryService } from './inventory.service';

class BillService {
  async createBill(input: BillCreateInput): Promise<BillDTO> {
    const bill = await (prisma as any).bill.create({
      data: {
        bill_number: input.bill_number,
        date: new Date(input.date as any),
        payment_method: input.payment_method,
        customer_name: input.customer_name ?? null,
        total: (typeof input.total === 'number' ? input.total : Number(input.total)).toFixed(2),
        cashier_name: input.cashier_name,
        item_count: input.item_count,
        credit_note: input.credit_note ?? null,
        cash_given: (typeof input.cash_given === 'number' ? input.cash_given : Number(input.cash_given)).toFixed(2),
        balance_given: (typeof input.balance_given === 'number' ? input.balance_given : Number(input.balance_given)).toFixed(2),
        tax: input.tax !== undefined && input.tax !== null ? (typeof input.tax === 'number' ? input.tax : Number(input.tax)).toFixed(2) : null,
      },
    });
    return bill as BillDTO;
  }

  async createBillWithItems(input: BillCreateWithItemsInput): Promise<{ bill: BillDTO; inventory: InventoryDTO[] }> {
    const result = await (prisma as any).$transaction(async (tx: any) => {
      const createdBill = await tx.bill.create({
        data: {
          bill_number: input.bill_number,
          date: new Date(input.date as any),
          payment_method: input.payment_method,
          customer_name: input.customer_name ?? null,
          total: (typeof input.total === 'number' ? input.total : Number(input.total)).toFixed(2),
          cashier_name: input.cashier_name,
          item_count: input.item_count,
          credit_note: input.credit_note ?? null,
          cash_given: (typeof input.cash_given === 'number' ? input.cash_given : Number(input.cash_given)).toFixed(2),
          balance_given: (typeof input.balance_given === 'number' ? input.balance_given : Number(input.balance_given)).toFixed(2),
          tax: input.tax !== undefined && input.tax !== null ? (typeof input.tax === 'number' ? input.tax : Number(input.tax)).toFixed(2) : null,
        },
      });

      const inventoryRecords: InventoryDTO[] = [];

      for (const item of input.items) {
        // Ensure negative quantity for outgoing stock
        const qty = item.quantityMoved > 0 ? -Math.abs(item.quantityMoved) : item.quantityMoved;
        const rec = await inventoryService.createMovement(
          {
            productId: item.productId,
            billId: createdBill.id,
            quantity_moved: qty,
          },
          tx
        );
        inventoryRecords.push(rec);
      }

      return { bill: createdBill as BillDTO, inventory: inventoryRecords };
    });

    return result;
  }

  async getById(id: string): Promise<BillDTO | null> {
    const bill = await (prisma as any).bill.findUnique({
      where: { id },
      include: { inventoryRecords: { include: { product: { include: { category: true } } } } },
    });
    if (!bill) return null;

    // Map inventory records to item DTOs
    const items = (bill.inventoryRecords || []).map((rec: any) => ({
      productId: rec.productId,
      name: rec.product?.name ?? null,
      categoryName: rec.product?.category?.name ?? null,
      litres: rec.product?.litres !== undefined ? String(rec.product.litres) : null,
      bottle_volume: rec.product?.bottle_volume ?? null,
      cost_price: rec.product?.cost_price !== undefined ? String(rec.product.cost_price) : null,
      selling_price: rec.product?.selling_price !== undefined ? String(rec.product.selling_price) : null,
      quantity_moved: rec.quantity_moved,
    }));

    // Try compute subtotal from item selling prices when available
    let subtotalFromItems = 0;
    let computedFromItems = false;
    for (const it of items) {
      if (it.selling_price !== null && it.selling_price !== undefined) {
        const price = Number(it.selling_price);
        if (!Number.isNaN(price)) {
          subtotalFromItems += price * Math.abs(it.quantity_moved ?? 0);
          computedFromItems = true;
        }
      }
    }

    const taxVal = bill.tax !== undefined && bill.tax !== null ? String(bill.tax) : '0';
    const totalVal = bill.total !== undefined && bill.total !== null ? String(bill.total) : '0';
    const subtotalVal = computedFromItems ? subtotalFromItems.toFixed(2) : (() => {
      const t = Number(totalVal) || 0;
      const tx = Number(taxVal) || 0;
      return (t - tx).toFixed(2);
    })();

    // Build the response shape the frontend expects
    const response = {
      id: bill.id,
      dateTime: bill.date instanceof Date ? bill.date.toISOString() : String(bill.date),
      PaymentMethod: bill.payment_method,
      customer: bill.customer_name ?? null,
      creditNote: bill.credit_note ?? null,
      Items: items,
      Subtotal: subtotalVal,
      Tax: taxVal,
      Total: totalVal,
    };

    // Return normalized BillDTO for backward compatibility, but attach _detailed if needed — here we return the normal DTO
    return {
      id: bill.id,
      bill_number: bill.bill_number,
      date: bill.date instanceof Date ? bill.date.toISOString() : String(bill.date),
      payment_method: bill.payment_method,
      customer_name: bill.customer_name ?? null,
      total: totalVal,
      cashier_name: bill.cashier_name,
      item_count: bill.item_count,
      credit_note: bill.credit_note ?? null,
      cash_given: bill.cash_given !== undefined && bill.cash_given !== null ? String(bill.cash_given) : '0',
      balance_given: bill.balance_given !== undefined && bill.balance_given !== null ? String(bill.balance_given) : '0',
      tax: bill.tax !== undefined && bill.tax !== null ? String(bill.tax) : null,
      createdAt: bill.createdAt instanceof Date ? bill.createdAt.toISOString() : String(bill.createdAt),
      updatedAt: bill.updatedAt instanceof Date ? bill.updatedAt.toISOString() : String(bill.updatedAt),
      // NOTE: attach a non-typed helper field to carry the detailed view for handlers that expect it
      // @ts-ignore
      _detailed: response,
    } as any;
  }

  async listBills(query: BillListQuery = {}): Promise<PaginatedResult<BillDTO> & { card: CardSummary }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? Math.min(query.pageSize, 100) : 10;
    const where: any = {};

    // billNo exact or partial match
    if (query.billNo) {
      where.bill_number = { contains: query.billNo, mode: 'insensitive' };
    }

    // search fallback (search bill number and customer name)
    if (query.search) {
      where.OR = where.OR || [];
      where.OR.push({ bill_number: { contains: query.search, mode: 'insensitive' } });
      where.OR.push({ customer_name: { contains: query.search, mode: 'insensitive' } });
    }

    // payment method
    if (query.paymentMethod) {
      where.payment_method = query.paymentMethod;
    }

    // date filters
    if (query.today) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    } else {
      if (query.dateFrom) {
        const from = new Date(query.dateFrom);
        if (!isNaN(from.getTime())) {
          from.setHours(0, 0, 0, 0);
          where.date = { ...where.date, gte: from };
        }
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        if (!isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          where.date = { ...where.date, lte: to };
        }
      }
    }

    // Fetch total count and paginated items
    const [total, items] = await Promise.all([
      (prisma as any).bill.count({ where }),
      (prisma as any).bill.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Compute card summary aggregates (total revenue and by payment methods)
    const totalAgg = await (prisma as any).bill.aggregate({ where, _sum: { total: true } });
    const cashAgg = await (prisma as any).bill.aggregate({ where: { ...where, payment_method: 'CASH' }, _sum: { total: true } });
    const cardAgg = await (prisma as any).bill.aggregate({ where: { ...where, payment_method: 'CARD' }, _sum: { total: true } });
    const creditAgg = await (prisma as any).bill.aggregate({ where: { ...where, payment_method: 'CREDIT' }, _sum: { total: true } });

    const totalRevenue = totalAgg?._sum?.total ? String(totalAgg._sum.total) : '0';
    const cash = cashAgg?._sum?.total ? String(cashAgg._sum.total) : '0';
    const card = cardAgg?._sum?.total ? String(cardAgg._sum.total) : '0';
    const credit = creditAgg?._sum?.total ? String(creditAgg._sum.total) : '0';

    const cardSummary: CardSummary = {
      totalBills: total,
      totalRevenue,
      cash,
      card,
      credit,
    };

    // Normalize items to DTO shape
    const data = (items as any[]).map((b) => ({
      id: b.id,
      bill_number: b.bill_number,
      date: b.date instanceof Date ? b.date.toISOString() : String(b.date),
      payment_method: b.payment_method,
      customer_name: b.customer_name ?? null,
      total: b.total !== undefined && b.total !== null ? String(b.total) : '0',
      cashier_name: b.cashier_name,
      item_count: b.item_count,
      credit_note: b.credit_note ?? null,
      cash_given: b.cash_given !== undefined && b.cash_given !== null ? String(b.cash_given) : '0',
      balance_given: b.balance_given !== undefined && b.balance_given !== null ? String(b.balance_given) : '0',
      tax: b.tax !== undefined && b.tax !== null ? String(b.tax) : null,
      createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
      updatedAt: b.updatedAt instanceof Date ? b.updatedAt.toISOString() : String(b.updatedAt),
    })) as BillDTO[];

    return { data, page, pageSize, total, card: cardSummary } as any;
  }
}

export const billService = new BillService();
