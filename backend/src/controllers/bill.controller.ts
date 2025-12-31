import { Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { billService } from '../services/bill.service';
import { createBillSchema, billQuerySchema, createBillWithItemsSchema } from '../validations/bill.validation';

export const list = async (req: Request, res: Response) => {
  const parsed = billQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError('Invalid query params', 400);
  const result = await billService.listBills(parsed.data);
  res.json({ success: true, data: result.data, page: result.page, limit: result.limit, total: result.total });
};

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const bill = await billService.getById(id);
  if (!bill) throw new AppError('Bill not found', 404);
  res.json({ success: true, data: bill });
};

export const create = async (req: Request, res: Response) => {
  // Create bill with items and inventory movements (negative quantities)
  const parsed = createBillWithItemsSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation failed', 400);
  const created = await billService.createBillWithItems(parsed.data as any);
  res.status(201).json({ success: true, data: created });
};
