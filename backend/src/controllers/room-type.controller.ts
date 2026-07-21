import { Request, Response } from 'express';
import * as service from '../services/room-type.service';
import { AppError } from '../errors/AppError';
import { createRoomTypeSchema, updateRoomTypeSchema } from '../validations/room-type.validation';

export const create = async (req: Request, res: Response) => {
  const parsed = createRoomTypeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Validation failed', 400);
  }
  const roomType = await service.createRoomType(parsed.data);
  res.status(201).json({ success: true, data: roomType });
};

export const list = async (req: Request, res: Response) => {
  const result = await service.listRoomTypes();
  res.json({ success: true, ...result });
};

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const roomType = await service.getRoomTypeById(id);
  if (!roomType) throw new AppError('Room type not found', 404);
  res.json({ success: true, data: roomType });
};

export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = updateRoomTypeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Validation failed', 400);
  }
  const roomType = await service.updateRoomType(id, parsed.data);
  res.json({ success: true, data: roomType });
};

export const softDelete = async (req: Request, res: Response) => {
  const { id } = req.params;
  await service.softDeleteRoomType(id);
  res.status(204).send();
};
