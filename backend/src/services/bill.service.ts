import prisma from '../lib/prisma';
import type { BillCreateInput, BillDTO, BillCreateWithItemsInput, BillListQuery, PaginatedResult, CardSummary } from '../types/bill.types';
import type { InventoryDTO } from '../types/inventory.types';
import { inventoryService } from './inventory.service';

const formatBillNumber = (seq: number | bigint) => {
  const n = typeof seq === 'bigint' ? Number(seq) : seq;
  // 12 digits gives lots of room: B-000000000001
  return `B-${String(n).padStart(12, '0')}`;
};

class BillService {
  async createBill(input: BillCreateInput): Promise<BillDTO> {
    // bill_number is required by Prisma/DB (NOT NULL), but frontend no longer sends it.
    // Generate a unique placeholder; if you have bill_seq formatting logic elsewhere,
    // it can update this value after creation.
    const billNumber = input.bill_number && String(input.bill_number).trim().length > 0
      ? String(input.bill_number)
      : `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const bill = await (prisma as any).$transaction(async (tx: any) => {
      const createdBill = await tx.bill.create({
        data: {
          bill_number: billNumber,
          date: new Date(input.date as any),
          payment_method: input.payment_method,
          customer_name: input.customer_name ?? null,
          customer_type: (input as any).customer_type ?? 'local',
          service_charge_percentage: (input as any).service_charge_percentage !== undefined && (input as any).service_charge_percentage !== null
            ? (typeof (input as any).service_charge_percentage === 'number' ? (input as any).service_charge_percentage : Number((input as any).service_charge_percentage))
            : null,
          service_charge_amount: (input as any).service_charge_amount !== undefined && (input as any).service_charge_amount !== null
            ? (typeof (input as any).service_charge_amount === 'number' ? (input as any).service_charge_amount : Number((input as any).service_charge_amount))
            : null,
          total: (typeof input.total === 'number' ? input.total : Number(input.total)).toFixed(2),
          cashier_name: input.cashier_name,
          item_count: input.item_count,
          credit_note: input.credit_note ?? null,
          cash_given: (typeof input.cash_given === 'number' ? input.cash_given : Number(input.cash_given)).toFixed(2),
          balance_given: (typeof input.balance_given === 'number' ? input.balance_given : Number(input.balance_given)).toFixed(2),
          tax: input.tax !== undefined && input.tax !== null ? (typeof input.tax === 'number' ? input.tax : Number(input.tax)).toFixed(2) : null,
        },
      });

      const finalBillNumber = formatBillNumber(createdBill.bill_seq);
      const updatedBill = await tx.bill.update({
        where: { id: createdBill.id },
        data: { bill_number: finalBillNumber },
      });

      return updatedBill;
    });

    return bill as BillDTO;
  }

  async createBillWithItems(input: BillCreateWithItemsInput): Promise<{ bill: BillDTO; inventory: InventoryDTO[] }> {
    const result = await (prisma as any).$transaction(async (tx: any) => {
      const billNumber = input.bill_number && String(input.bill_number).trim().length > 0
        ? String(input.bill_number)
        : `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const createdBill = await tx.bill.create({
        data: {
          bill_number: billNumber,
          date: new Date(input.date as any),
          payment_method: input.payment_method,
          customer_name: input.customer_name ?? null,
          customer_type: (input as any).customer_type ?? 'local',
          service_charge_percentage: (input as any).service_charge_percentage !== undefined && (input as any).service_charge_percentage !== null
            ? (typeof (input as any).service_charge_percentage === 'number' ? (input as any).service_charge_percentage : Number((input as any).service_charge_percentage))
            : null,
          service_charge_amount: (input as any).service_charge_amount !== undefined && (input as any).service_charge_amount !== null
            ? (typeof (input as any).service_charge_amount === 'number' ? (input as any).service_charge_amount : Number((input as any).service_charge_amount))
            : null,
          total: (typeof input.total === 'number' ? input.total : Number(input.total)).toFixed(2),
          cashier_name: input.cashier_name,
          item_count: input.item_count,
          credit_note: input.credit_note ?? null,
          cash_given: (typeof input.cash_given === 'number' ? input.cash_given : Number(input.cash_given)).toFixed(2),
          balance_given: (typeof input.balance_given === 'number' ? input.balance_given : Number(input.balance_given)).toFixed(2),
          tax: input.tax !== undefined && input.tax !== null ? (typeof input.tax === 'number' ? input.tax : Number(input.tax)).toFixed(2) : null,
        },
      });

      // Replace placeholder/timestamp number with final sequential formatted number
      const finalBillNumber = formatBillNumber(createdBill.bill_seq);
      const billForInventory = await tx.bill.update({
        where: { id: createdBill.id },
        data: { bill_number: finalBillNumber },
      });

      const inventoryRecords: InventoryDTO[] = [];

      for (const item of input.items) {
        // Ensure negative quantity for outgoing stock
        const qty = item.quantityMoved > 0 ? -Math.abs(item.quantityMoved) : item.quantityMoved;
        const rec = await inventoryService.createMovement(
          {
            productId: item.productId,
            billId: billForInventory.id,
            quantity_moved: qty,
          },
          tx
        );
        inventoryRecords.push(rec);
      }

      return { bill: billForInventory as BillDTO, inventory: inventoryRecords };
    });

    return result;
  }

  async getById(id: string): Promise<BillDTO | null> {
    const bill = await (prisma as any).bill.findUnique({
      where: { id },
      include: { inventoryRecords: { include: { product: { include: { category: true } } } } },
    });
    if (!bill) return null;

    const customerType: 'local' | 'foreigner' = (bill.customer_type === 'foreigner' ? 'foreigner' : 'local');

    // Map inventory records to item DTOs
    const items = (bill.inventoryRecords || []).map((rec: any) => ({
      productId: rec.productId,
      name: rec.product?.name ?? null,
      categoryName: rec.product?.category?.name ?? null,
      unit_type: rec.product?.unit_type ?? null,
      cost_price: rec.product?.cost_price !== undefined ? String(rec.product.cost_price) : null,
      foreigner_price: rec.product?.foreigner_price !== undefined ? String(rec.product.foreigner_price) : null,
      local_price: rec.product?.local_price !== undefined ? String(rec.product.local_price) : null,
      quantity_moved: rec.quantity_moved,
    }));

    // Compute subtotal from the correct price list based on the persisted customer type
    let subtotalFromItems = 0;
    let computedFromItems = false;
    for (const it of items) {
      const priceStr = customerType === 'local' ? it.local_price : it.foreigner_price;
      if (priceStr !== null && priceStr !== undefined) {
        const price = Number(priceStr);
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
      cash_given: bill.cash_given !== undefined && bill.cash_given !== null ? String(bill.cash_given) : '0',
      balance_given: bill.balance_given !== undefined && bill.balance_given !== null ? String(bill.balance_given) : '0',
      service_charge_percentage: bill.service_charge_percentage !== undefined && bill.service_charge_percentage !== null ? String(bill.service_charge_percentage) : null,
      service_charge_amount: bill.service_charge_amount !== undefined && bill.service_charge_amount !== null ? String(bill.service_charge_amount) : null,
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

  async updatePayment(id: string, input: {
    payment_method?: 'CASH' | 'CARD' | 'CREDIT' | 'OTHER' | string;
    cash_given?: number | string | null;
    balance_given?: number | string | null;
    credit_note?: string | null;
    customer_name?: string | null;
    tax?: number | string | null;
    total?: number | string | null;
  }): Promise<BillDTO | null> {
    const updated = await (prisma as any).bill.update({
      where: { id },
      data: {
        payment_method: input.payment_method ?? undefined,
        cash_given: input.cash_given !== undefined ? (input.cash_given === null ? null : (typeof input.cash_given === 'number' ? input.cash_given : Number(input.cash_given))) : undefined,
        balance_given: input.balance_given !== undefined ? (input.balance_given === null ? null : (typeof input.balance_given === 'number' ? input.balance_given : Number(input.balance_given))) : undefined,
        credit_note: input.credit_note !== undefined ? input.credit_note : undefined,
        customer_name: input.customer_name !== undefined ? input.customer_name : undefined,
        tax: input.tax !== undefined ? (input.tax === null ? null : (typeof input.tax === 'number' ? input.tax : Number(input.tax))) : undefined,
        total: input.total !== undefined ? (input.total === null ? null : (typeof input.total === 'number' ? input.total : Number(input.total))) : undefined,
      },
    }).catch(() => null);
    if (!updated) return null;
    return {
      id: updated.id,
      bill_number: updated.bill_number,
      date: updated.date instanceof Date ? updated.date.toISOString() : String(updated.date),
      payment_method: updated.payment_method,
      customer_name: updated.customer_name ?? null,
      total: updated.total !== undefined && updated.total !== null ? String(updated.total) : '0',
      cashier_name: updated.cashier_name,
      item_count: updated.item_count,
      credit_note: updated.credit_note ?? null,
      cash_given: updated.cash_given !== undefined && updated.cash_given !== null ? String(updated.cash_given) : '0',
      balance_given: updated.balance_given !== undefined && updated.balance_given !== null ? String(updated.balance_given) : '0',
      tax: updated.tax !== undefined && updated.tax !== null ? String(updated.tax) : null,
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
      updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt),
    } as BillDTO;
  }
}

export const billService = new BillService();
