import { Request, Response } from 'express';
import { kotService } from '../services/kot.service';
import { createKotLogSchema, updateKotStatusSchema } from '../validations/kot.validation';

export const createKotLog = async (req: Request, res: Response) => {
  const validatedData = createKotLogSchema.parse(req.body);
  const kotLog = await kotService.createKotLog(validatedData);
  res.status(201).json({ message: 'KOT sent and logged successfully', kotLog });
};

export const getKotLogs = async (req: Request, res: Response) => {
  const { steward, status } = req.query;
  const kotLogs = await kotService.getKotLogs({
    steward: steward as string | undefined,
    status: status as 'PENDING' | 'COMPLETED' | undefined,
  });
  res.status(200).json({ kotLogs });
};

export const updateKotStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateKotStatusSchema.parse(req.body);
  const kotLog = await kotService.updateKotStatus(id, validatedData.status);
  res.status(200).json({ message: 'KOT status updated', kotLog });
};
