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
      // Calculate start of current day for sequence generation
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Count existing KOTs for today to generate sequence number
      const todayCount = await tx.kotLog.count({
        where: { createdAt: { gte: startOfDay } }
      });

      const sequence = todayCount + 1;
      const padSeq = String(sequence).padStart(3, '0');
      const day = String(startOfDay.getDate()).padStart(2, '0');
      const month = String(startOfDay.getMonth() + 1).padStart(2, '0');
      const kot_number = `K${day}${month}S${padSeq}`;

      // Create the KotLog and its items
      const newKotLog = await tx.kotLog.create({
        data: {
          kot_number,
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
    const filterParams: any[] = [];
    const filterClauses: string[] = [];
    let paramIdx = 1;

    if (filters.steward) {
      filterClauses.push(`k."steward" = $${paramIdx}`);
      filterParams.push(filters.steward);
      paramIdx++;
    }
    
    if (filters.status) {
      // Prisma enums are strings in PostgreSQL
      filterClauses.push(`k."status" = $${paramIdx}::"KotStatus"`);
      filterParams.push(filters.status);
      paramIdx++;
    }

    const whereClause = filterClauses.length > 0 ? 'WHERE ' + filterClauses.join(' AND ') : '';

    const rawLogs = await (prisma as any).$queryRawUnsafe(`
      SELECT 
        k.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', i."id",
              'kotLogId', i."kotLogId",
              'orderItemId', i."orderItemId",
              'product_name', i."product_name",
              'quantity', i."quantity",
              'unit', i."unit"
            )
          ) FILTER (WHERE i.id IS NOT NULL), 
          '[]'
        ) as items
      FROM "kot_logs" k
      LEFT JOIN "kot_log_items" i ON i."kotLogId" = k.id
      ${whereClause}
      GROUP BY k.id
      ORDER BY k."createdAt" DESC
    `, ...filterParams);

    return rawLogs.map((log: any) => this.mapToDTO(log));
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
      kot_number: log.kot_number,
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
