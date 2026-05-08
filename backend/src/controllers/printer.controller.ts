import { Request, Response } from 'express';
import { printerService } from '../services/printer.service';
import { createPrinterSchema, updatePrinterSchema } from '../validations/printer.validation';
import { AppError } from '../errors/AppError';

export const getAllPrinters = async (req: Request, res: Response) => {
  const printers = await printerService.getAll();
  res.json({ success: true, data: printers });
};

export const getPrinterById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const printer = await printerService.getById(id);
  if (!printer) throw new AppError('Printer not found', 404);
  res.json({ success: true, data: printer });
};

export const createPrinter = async (req: Request, res: Response) => {
  const parsed = createPrinterSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Validation failed', 400);
  }
  const printer = await printerService.create(parsed.data);
  res.status(201).json({ success: true, data: printer, message: 'Printer created successfully' });
};

export const updatePrinter = async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = updatePrinterSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Validation failed', 400);
  }
  const printer = await printerService.update(id, parsed.data);
  res.json({ success: true, data: printer, message: 'Printer updated successfully' });
};

export const deletePrinter = async (req: Request, res: Response) => {
  const { id } = req.params;
  const printer = await printerService.delete(id);
  res.json({ success: true, data: printer, message: 'Printer deleted successfully' });
};

export const testPrinter = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await printerService.testConnection(id);
  const statusCode = result.success ? 200 : 422;
  res.status(statusCode).json({
    success: result.success,
    message: result.message,
    data: result.printer,
  });
};
