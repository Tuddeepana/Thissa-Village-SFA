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

    const year = now.getFullYear();

    // Parallelize all data fetching
    const [
      totalProducts,
      weeklyAggs,
      monthlyAggs,
      lowStockItems,
      categories
    ] = await Promise.all([
      (prisma as any).product.count(),
      // Weekly aggregation directly in DB
      (prisma as any).$queryRaw`
        SELECT 
          date_trunc('day', "date") as day,
          SUM("total")::FLOAT as sum
        FROM "bills"
        WHERE "date" >= ${days[0].start} AND "date" <= ${days[6].end}
        GROUP BY 1
      `.catch(() => []),
      // Monthly aggregation directly in DB
      (prisma as any).$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM "date")::INT as month_idx,
          SUM("total")::FLOAT as sum
        FROM "bills"
        WHERE "date" >= ${new Date(year, 0, 1, 0, 0, 0, 0)} AND "date" <= ${new Date(year, 11, 31, 23, 59, 59, 999)}
        GROUP BY 1
      `.catch(() => []),
      // Low stock query optimized
      (prisma as any).$queryRaw`
        SELECT p.id, p.name, p."low_stock", COALESCE(i."available_quantity", 0)::INT as available_quantity
        FROM "products" p
        LEFT JOIN LATERAL (
          SELECT "available_quantity"
          FROM "inventory" inv
          WHERE inv."productId" = p.id
          ORDER BY inv."createdAt" DESC
          LIMIT 1
        ) i ON true
        WHERE COALESCE(i."available_quantity", 0) <= p."low_stock"
      `.catch(async () => {
        // Fallback for low stock
        const products = await (prisma as any).product.findMany({ select: { id: true, low_stock: true, name: true } });
        const items = [];
        for (const p of products) {
          const inv = await (prisma as any).inventory.findFirst({ where: { productId: p.id }, orderBy: { createdAt: 'desc' }, select: { available_quantity: true } });
          const available = inv?.available_quantity ?? 0;
          if (available <= (p.low_stock ?? 0)) items.push({ id: p.id, name: p.name, available_quantity: available, low_stock: p.low_stock });
        }
        return items;
      }),
      (prisma as any).category.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { products: true } },
        },
      }),
    ]);

    // Process weekly sums
    const weeklySums: Record<string, string> = {
      monday: '0', tuesday: '0', wensday: '0', thursday: '0', friday: '0', saturday: '0', sunday: '0',
    };
    let weeklyIncomeValue = 0;

    (weeklyAggs as any[]).forEach(row => {
      const d = new Date(row.day);
      const dayName = DAY_NAMES[d.getDay()];
      const key = dayName === 'wednesday' ? 'wensday' : dayName;
      const val = row.sum || 0;
      weeklySums[key] = val.toFixed(2);
      weeklyIncomeValue += val;
    });

    // Process monthly sums
    const monthlySums: Record<string, string> = {};
    MONTH_NAMES.forEach(m => (monthlySums[m] = '0'));
    let monthlyIncomeValue = 0;

    (monthlyAggs as any[]).forEach(row => {
      const idx = row.month_idx - 1; // EXTRACT MONTH is 1-indexed
      const key = MONTH_NAMES[idx] || `m${row.month_idx}`;
      const val = row.sum || 0;
      monthlySums[key] = val.toFixed(2);
      monthlyIncomeValue += val;
    });

    const categoryDistribution = categories.map((c: any) => {
      const count = c._count?.products ?? 0;
      const percentage = totalProducts > 0 ? Number(((count / totalProducts) * 100).toFixed(2)) : 0;
      return { categoryId: c.id, categoryName: c.name, productCount: count, percentage };
    });

    const weeklyIncome = String(weeklyIncomeValue.toFixed(2));
    const monthlyIncome = String(monthlyIncomeValue.toFixed(2));

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
