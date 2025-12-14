import { Request, Response } from "express";
import * as service from "../services/category.service";
import { AppError } from "../errors/AppError";
import { paginationSchema, createCategorySchema, updateCategorySchema } from "../validations/category.validation";

export const create = async (req: Request, res: Response) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Validation failed", 400);
  }
  const category = await service.createCategory(parsed.data);
  res.status(201).json({ success: true, data: category });
};

export const list = async (req: Request, res: Response) => {
  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError("Invalid query params", 400);
  }
  const result = await service.listCategories(parsed.data);
  res.json({ success: true, ...result });
};

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const category = await service.getCategoryById(id);
  if (!category) throw new AppError("Category not found", 404);
  res.json({ success: true, data: category });
};

export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Validation failed", 400);
  }
  const category = await service.updateCategory(id, parsed.data);
  res.json({ success: true, data: category });
};

export const softDelete = async (req: Request, res: Response) => {
  const { id } = req.params;
  const category = await service.softDeleteCategory(id);
  res.json({ success: true, data: category });
};

export const restore = async (req: Request, res: Response) => {
  const { id } = req.params;
  const category = await service.restoreCategory(id);
  res.json({ success: true, data: category });
};

export const hardDelete = async (req: Request, res: Response) => {
  const { id } = req.params;
  const category = await service.hardDeleteCategory(id);
  res.json({ success: true, data: category });
};
