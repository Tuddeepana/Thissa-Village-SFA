import { Request, Response } from 'express';
import { systemConfigService } from '../services/system-config.service';
import { AppError } from '../errors/AppError';

/**
 * GET /api/config/:key
 */
export const getConfig = async (req: Request, res: Response) => {
  const { key } = req.params;
  const config = await systemConfigService.get(key);
  if (!config) {
    // Return empty value instead of 404 — makes frontend simpler
    return res.json({ success: true, data: { key, value: '', updatedAt: null } });
  }
  res.json({ success: true, data: config });
};

/**
 * GET /api/config
 * Query: ?keys=KEY1,KEY2,KEY3
 */
export const getMultipleConfigs = async (req: Request, res: Response) => {
  const keysParam = req.query.keys as string;
  if (!keysParam) {
    throw new AppError('Query parameter "keys" is required', 400);
  }
  const keys = keysParam.split(',').map((k) => k.trim()).filter(Boolean);
  const configs = await systemConfigService.getMultiple(keys);
  res.json({ success: true, data: configs });
};

/**
 * PUT /api/config/:key
 * Body: { value: string }
 */
export const setConfig = async (req: Request, res: Response) => {
  const { key } = req.params;
  const { value } = req.body;

  if (typeof value !== 'string') {
    throw new AppError('Body must contain a "value" string', 400);
  }

  const config = await systemConfigService.set(key, value);
  res.json({ success: true, data: config, message: `Config "${key}" updated` });
};
