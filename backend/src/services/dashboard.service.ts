import prisma from '../lib/prisma';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wensday', 'thursday', 'friday', 'saturday'];
const MONTH_NAMES = ['jan','feb','march','april','may','june','july','aug','sep','oct','nov','dec'];

class DashboardService {
  /**
   * Return aggregated dashboard metrics
   */
  async getSummary() {
    const now = new Date();

    // Weekly window: last 7 days (including today)
    const days: { date: Date; start: Date; end: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = new Date(d);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      days.push({ date: d, start, end });
    }

    // Monthly window: months of current year
    const year = now.getFullYear();
    const months: { monthIndex: number; start: Date; end: Date }[] = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1, 0, 0, 0, 0);
      const end = new Date(year, m + 1, 0, 23, 59, 59, 999); // last day of month
      months.push({ monthIndex: m, start, end });
    }

    // Basic aggregates
    const totalProducts = await (prisma as any).product.count();

    // Compute weekly sums per day
    const weeklySums: Record<string, string> = {
      monday: '0',
      tuesday: '0',
      wensday: '0',
      thursday: '0',
      friday: '0',
      saturday: '0',
      sunday: '0',
    };

    for (const d of days) {
      const agg = await (prisma as any).bill.aggregate({ where: { date: { gte: d.start, lte: d.end } }, _sum: { total: true } });
      const sum = agg?._sum?.total ? Number(agg._sum.total) : 0;
      const dayName = DAY_NAMES[d.date.getDay()];
      // normalize spelling for wednesday -> 'wensday' per user's request (they typed 'wensday')
      const key = dayName === 'wednesday' ? 'wensday' : dayName;
      weeklySums[key] = String(sum.toFixed(2));
    }

    // Compute monthly sums per month (current year)
    const monthlySums: Record<string, string> = {} as any;
    for (const m of months) {
      const agg = await (prisma as any).bill.aggregate({ where: { date: { gte: m.start, lte: m.end } }, _sum: { total: true } });
      const sum = agg?._sum?.total ? Number(agg._sum.total) : 0;
      const key = MONTH_NAMES[m.monthIndex] || `m${m.monthIndex + 1}`;
      monthlySums[key] = String(sum.toFixed(2));
    }

    // Low stock items (reuse existing logic)
    const products = await (prisma as any).product.findMany({ select: { id: true, low_stock: true, name: true } });
    const lowStockItems: Array<{ id: string; name?: string; available_quantity: number; low_stock: number }> = [];

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

    // Product category distribution (by product count)
    const categories = await (prisma as any).category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { products: true },
        },
      },
    });

    const categoryDistribution = categories.map((c: any) => {
      const count = c._count?.products ?? 0;
      const percentage = totalProducts > 0 ? Number(((count / totalProducts) * 100).toFixed(2)) : 0;
      return { categoryId: c.id, categoryName: c.name, productCount: count, percentage };
    });

    // Weekly and monthly totals (overall)
    const weeklyTotalAgg = await (prisma as any).bill.aggregate({ where: { date: { gte: days[0].start, lte: days[6].end } }, _sum: { total: true } });
    const monthlyTotalAgg = await (prisma as any).bill.aggregate({ where: { date: { gte: months[0].start, lte: months[11].end } }, _sum: { total: true } });

    const weeklyIncome = weeklyTotalAgg?._sum?.total ? String(Number(weeklyTotalAgg._sum.total).toFixed(2)) : '0';
    const monthlyIncome = monthlyTotalAgg?._sum?.total ? String(Number(monthlyTotalAgg._sum.total).toFixed(2)) : '0';

    return {
      weeklyIncome,
      monthlyIncome,
      weeklyIncomeResponse: weeklySums,
      monthlyIncomeResponse: monthlySums,
      TotalProduct: totalProducts,
      lowStockItemsCount: lowStockItems.length,
      lowStockItems,
      categoryDistribution,
    };
  }

  async getProductCategoryDistribution() {
    const totalProducts = await (prisma as any).product.count();
    const categories = await (prisma as any).category.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { products: true } },
      },
    });

    return categories.map((c: any) => ({
      categoryId: c.id,
      categoryName: c.name,
      productCount: c._count?.products ?? 0,
      percentage: totalProducts > 0 ? Number(((c._count?.products ?? 0) / totalProducts * 100).toFixed(2)) : 0,
    }));
  }
}

export const dashboardService = new DashboardService();
