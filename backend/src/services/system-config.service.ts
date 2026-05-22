import prisma from '../lib/prisma';
import type { SystemConfigDTO } from '../types/system-config.types';

class SystemConfigService {
  /**
   * Get a single config value by key
   */
  async get(key: string): Promise<SystemConfigDTO | null> {
    const record = await (prisma as any).systemConfig.findUnique({
      where: { key },
    });
    return record || null;
  }

  /**
   * Get multiple config values by keys
   */
  async getMultiple(keys: string[]): Promise<SystemConfigDTO[]> {
    const records = await (prisma as any).systemConfig.findMany({
      where: { key: { in: keys } },
    });
    return records;
  }

  /**
   * Set (upsert) a config value
   */
  async set(key: string, value: string): Promise<SystemConfigDTO> {
    const record = await (prisma as any).systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return record;
  }

  /**
   * Delete a config key
   */
  async delete(key: string): Promise<void> {
    await (prisma as any).systemConfig.deleteMany({
      where: { key },
    });
  }
}

export const systemConfigService = new SystemConfigService();
