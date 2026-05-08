import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { CreateKotLogInput, KotLogDTO } from '../types/kot.types';
import { OrderType } from '../types/order.types';

export class KotService {
  /**
   * Create a new KOT log entry and optionally update order items as kot_sent
   */
  async createKotLog(input: CreateKotLogInput): Promise<KotLogDTO> {
    const kotLog = await prisma.$transaction(async (tx) => {
      // Create the KotLog and its items
      const newKotLog = await tx.kotLog.create({
        data: {
          orderId: input.orderId,
          steward: input.steward,
          table_name: input.table_name,
          order_type: input.order_type,
          total_amount: new Prisma.Decimal(input.total_amount),
          remark: input.remark,
          items: {
            create: input.items.map(item => ({
              orderItemId: item.orderItemId,
              product_name: item.product_name,
              quantity: item.quantity,
              unit: item.unit,
            }))
          }
        },
        include: {
          items: true
        }
      });

      // If we have an orderId and orderItemIds, mark them as sent in the order
      if (input.orderId) {
        const itemIds = input.items.map(i => i.orderItemId).filter(Boolean) as string[];
        if (itemIds.length > 0) {
          await tx.orderItem.updateMany({
            where: {
              orderId: input.orderId,
              id: { in: itemIds }
            },
            data: {
              kot_sent: true
            }
          });
        }
      }

      return newKotLog;
    });

    return this.mapToDTO(kotLog);
  }

  /**
   * Get KOT logs with optional filters
   */
  async getKotLogs(filters: { steward?: string; status?: 'PENDING' | 'COMPLETED' }): Promise<KotLogDTO[]> {
    const where: Prisma.KotLogWhereInput = {};
    if (filters.steward) {
      where.steward = filters.steward;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const kotLogs = await prisma.kotLog.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    return kotLogs.map(log => this.mapToDTO(log));
  }

  /**
   * Update KOT log status
   */
  async updateKotStatus(id: string, status: 'PENDING' | 'COMPLETED'): Promise<KotLogDTO> {
    const kotLog = await prisma.kotLog.update({
      where: { id },
      data: { status },
      include: { items: true }
    });

    return this.mapToDTO(kotLog);
  }

  private mapToDTO(log: any): KotLogDTO {
    return {
      id: log.id,
      orderId: log.orderId,
      steward: log.steward,
      table_name: log.table_name,
      order_type: log.order_type as OrderType,
      total_amount: Number(log.total_amount),
      status: log.status,
      remark: log.remark,
      createdAt: log.createdAt,
      items: log.items.map((item: any) => ({
        id: item.id,
        kotLogId: item.kotLogId,
        orderItemId: item.orderItemId,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
      }))
    };
  }
}

export const kotService = new KotService();
