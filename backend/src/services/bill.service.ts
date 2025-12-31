import prisma from '../lib/prisma';
import type { BillCreateInput, BillDTO, BillCreateWithItemsInput, BillListQuery, PaginatedResult } from '../types/bill.types';
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
    const bill = await (prisma as any).bill.findUnique({ where: { id } });
    return bill as BillDTO | null;
  }

  async listBills(query: BillListQuery = {}): Promise<PaginatedResult<BillDTO>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const where: any = {};
    if (query.search) {
      where.OR = [{ bill_number: { contains: query.search, mode: 'insensitive' } }];
    }

    const [total, items] = await Promise.all([
      (prisma as any).bill.count({ where }),
      (prisma as any).bill.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { data: items as BillDTO[], page, limit, total };
  }
}

export const billService = new BillService();
