import { Request, Response } from 'express';
import * as service from '../services/product.service';
import { AppError } from '../errors/AppError';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../validations/product.validation';

export const create = async (req: Request, res: Response) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Validation failed', 400);
  }
  const product = await service.createProduct(parsed.data);
  res.status(201).json({ success: true, data: product });
};

export const list = async (req: Request, res: Response) => {
  const parsed = productQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError('Invalid query params', 400);
  }
  const result = await service.listProducts(parsed.data);
  res.json({ success: true, ...result });
};

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await service.getProductById(id);
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, data: product });
};

export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Validation failed', 400);
  }
  const product = await service.updateProduct(id, parsed.data);
  res.json({ success: true, data: product });
};

export const remove = async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await service.deleteProduct(id);
  res.json({ success: true, data: product });
};
