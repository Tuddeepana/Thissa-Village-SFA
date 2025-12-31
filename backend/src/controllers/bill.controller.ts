import { Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { billService } from '../services/bill.service';
import { billQuerySchema, createBillWithItemsSchema } from '../validations/bill.validation';

export const list = async (req: Request, res: Response) => {
  const parsed = billQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError('Invalid query params', 400);
  const result = await billService.listBills(parsed.data as any);
  // result will contain data, page, limit, total, card
  res.json({
    success: true,
    card: result.card,
    billsResponse: {
      data: result.data,
      pagination: {
        currentPage: result.page,
        pageSize: result.limit,
        totalRecords: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit || 1)),
      },
    },
  });
};

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const bill = await billService.getById(id);
  if (!bill) throw new AppError('Bill not found', 404);

  // If the service attached a detailed view, return that shape expected by frontend
  // (dateTime, PaymentMethod, customer, creditNote, Items, Subtotal, Tax, Total)
  // The service attaches this to `_detailed` when available.
  const detailed = (bill as any)._detailed;
  if (detailed) return res.json({ success: true, data: detailed });

  // Fallback: construct a similar shape from the normalized DTO
  const subtotal = bill.total && bill.tax ? (Number(bill.total) - Number(bill.tax)).toFixed(2) : bill.total ?? '0';
  const fallback = {
    id: bill.id,
    dateTime: bill.date,
    PaymentMethod: bill.payment_method,
    customer: bill.customer_name ?? null,
    creditNote: bill.credit_note ?? null,
    Items: [],
    Subtotal: subtotal,
    Tax: bill.tax ?? '0',
    Total: bill.total ?? '0',
  };

  res.json({ success: true, data: fallback });
};

export const create = async (req: Request, res: Response) => {
  // Create bill with items and inventory movements (negative quantities)
  const parsed = createBillWithItemsSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation failed', 400);
  const created = await billService.createBillWithItems(parsed.data as any);
  res.status(201).json({ success: true, data: created });
};
