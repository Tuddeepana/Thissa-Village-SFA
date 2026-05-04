import prisma from '../lib/prisma';
import type { ServiceChargeDTO, UpdateServiceChargeInput } from '../types/service-charge.types';

class ServiceChargeService {
  /**
   * Get the current service charge configuration
   */
  async getServiceCharge(): Promise<ServiceChargeDTO | null> {
    // Ensure there's always a default config row so the UI can load reliably.
    const serviceCharge = await (prisma as any).serviceCharge.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        percentage: '10.00',
        isActive: true,
        isKitchenPrintEnabled: false,
        kitchenPrinterIp: null,
      },
    });

    return {
      id: serviceCharge.id,
      percentage: Number(serviceCharge.percentage),
      isActive: serviceCharge.isActive,
      isKitchenPrintEnabled: serviceCharge.isKitchenPrintEnabled,
      kitchenPrinterIp: serviceCharge.kitchenPrinterIp,
      createdAt: serviceCharge.createdAt,
      updatedAt: serviceCharge.updatedAt,
    };
  }

  /**
   * Update service charge configuration
   */
  async updateServiceCharge(input: UpdateServiceChargeInput): Promise<ServiceChargeDTO> {
    const data: any = {};

    if (input.percentage !== undefined) {
      data.percentage = input.percentage.toFixed(2);
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    if (input.isKitchenPrintEnabled !== undefined) {
      data.isKitchenPrintEnabled = input.isKitchenPrintEnabled;
    }

    if (input.kitchenPrinterIp !== undefined) {
      data.kitchenPrinterIp = input.kitchenPrinterIp;
    }

    const updated = await (prisma as any).serviceCharge.upsert({
      where: { id: 'default' },
      update: data,
      create: {
        id: 'default',
        percentage: input.percentage?.toFixed(2) ?? '10.00',
        isActive: input.isActive ?? true,
        isKitchenPrintEnabled: input.isKitchenPrintEnabled ?? false,
        kitchenPrinterIp: input.kitchenPrinterIp ?? null,
      },
    });

    return {
      id: updated.id,
      percentage: Number(updated.percentage),
      isActive: updated.isActive,
      isKitchenPrintEnabled: updated.isKitchenPrintEnabled,
      kitchenPrinterIp: updated.kitchenPrinterIp,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}

export const serviceChargeService = new ServiceChargeService();

