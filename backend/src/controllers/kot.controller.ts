import { Request, Response } from 'express';
import { kotService } from '../services/kot.service';
import { createKotLogSchema } from '../validations/kot.validation';

export const createKotLog = async (req: Request, res: Response) => {
  const validatedData = createKotLogSchema.parse(req.body);
  const kotLog = await kotService.createKotLog(validatedData);
  res.status(201).json({ message: 'KOT sent and logged successfully', kotLog });
};
