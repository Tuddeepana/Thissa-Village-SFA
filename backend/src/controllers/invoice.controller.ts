import { Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { invoiceService } from '../services/invoice.service';
import { createInvoiceSchema, updateInvoiceSchema, invoiceQuerySchema } from '../validations/invoice.validation';

export const list = async (req: Request, res: Response) => {
  const parsed = invoiceQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError('Invalid query params', 400);

  const result = await invoiceService.listInvoices(parsed.data);
  res.json({ success: true, data: result.data, page: result.page, limit: result.limit, total: result.total });
};

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const invoice = await invoiceService.getInvoiceById(id);
  if (!invoice) throw new AppError('Invoice not found', 404);
  res.json({ success: true, data: invoice });
};

export const create = async (req: Request, res: Response) => {
  const parsed = createInvoiceSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation failed', 400);
  const created = await invoiceService.createInvoice(parsed.data as any);
  res.status(201).json({ success: true, data: created });
};

export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = updateInvoiceSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation failed', 400);
  const updated = await invoiceService.updateInvoice(id, parsed.data as any);
  res.json({ success: true, data: updated });
};

export const remove = async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await invoiceService.deleteInvoice(id);
  res.json({ success: true, data: deleted });
};
