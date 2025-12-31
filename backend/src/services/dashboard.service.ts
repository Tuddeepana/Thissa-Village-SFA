import prisma from '../lib/prisma';

class DashboardService {
  /**
   * Return aggregated dashboard metrics
   */
  async getSummary() {
    const now = new Date();

    // Weekly income: last 7 days
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    // Monthly income: last 30 days
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);

    const [weeklyAgg, monthlyAgg, totalProducts, products] = await Promise.all([
      (prisma as any).bill.aggregate({ where: { date: { gte: weekAgo } }, _sum: { total: true } }),
      (prisma as any).bill.aggregate({ where: { date: { gte: monthAgo } }, _sum: { total: true } }),
      (prisma as any).product.count(),
      (prisma as any).product.findMany({ select: { id: true, low_stock: true, name: true } }),
    ]);

    const weeklyIncome = weeklyAgg?._sum?.total ? String(weeklyAgg._sum.total) : '0';
    const monthlyIncome = monthlyAgg?._sum?.total ? String(monthlyAgg._sum.total) : '0';

    // Determine low stock items by checking latest inventory snapshot per product
    const lowStockItems: Array<{ id: string; name?: string; available_quantity: number; low_stock: number }> = [];

    // For each product, load latest inventory record
    for (const p of products) {
      const inv = await (prisma as any).inventory.findFirst({
        where: { productId: p.id },
        orderBy: { createdAt: 'desc' },
        select: { available_quantity: true },
      });

      const available = inv?.available_quantity ?? 0;
      if (available <= (p.low_stock ?? 0)) {
        lowStockItems.push({ id: p.id, name: p.name, available_quantity: available, low_stock: p.low_stock });
      }
    }

    return {
      weeklyIncome,
      monthlyIncome,
      TotalProduct: totalProducts,
      lowStockItemsCount: lowStockItems.length,
      lowStockItems,
    };
  }
}

export const dashboardService = new DashboardService();

