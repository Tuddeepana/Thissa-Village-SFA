import { Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { inventoryService } from '../services/inventory.service';

export const list = async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const productId = typeof req.query.productId === 'string' ? req.query.productId : undefined;
  const invoiceId = typeof req.query.invoiceId === 'string' ? req.query.invoiceId : undefined;

  const result = await inventoryService.list({ page, limit, productId, invoiceId });
  res.json({ success: true, data: result.data, page: result.page, limit: result.limit, total: result.total });
};

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const rec = await inventoryService.getById(id);
  if (!rec) throw new AppError('Inventory record not found', 404);
  res.json({ success: true, data: rec });
};
