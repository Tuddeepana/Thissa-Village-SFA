import prisma from '../lib/prisma';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wensday', 'thursday', 'friday', 'saturday'];
const MONTH_NAMES = ['jan', 'feb', 'march', 'april', 'may', 'june', 'july', 'aug', 'sep', 'oct', 'nov', 'dec'];

class DashboardService {
  /**
   * Return aggregated dashboard metrics
   * Optimised: uses groupBy, raw SQL, and Promise.all to minimise round-trips.
   */
  async getSummary() {
    const now = new Date();

    // ── date boundaries ────────────────────────────────────────────
    // Weekly: last 7 days (including today)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    // Monthly: full current year
    const year = now.getFullYear();
    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    // ── fire ALL independent queries in parallel ───────────────────
    const [
      totalProducts,
      weeklyGrouped,
      monthlyGrouped,
      lowStockRaw,
      categories,
    ] = await Promise.all([
      // 1. Total product count
      (prisma as any).product.count(),

      // 2. Weekly income grouped by date (1 query instead of 7 + 1)
      (prisma as any).bill.groupBy({
        by: ['date'],
        where: { date: { gte: weekStart, lte: weekEnd } },
        _sum: { total: true },
      }),

      // 3. Monthly income grouped by month using raw SQL (1 query instead of 12 + 1)
      //    EXTRACT(MONTH ...) returns 1-12
      (prisma as any).$queryRaw`
        SELECT
          EXTRACT(MONTH FROM "date")::int AS month_num,
          COALESCE(SUM("total"), 0)       AS total
        FROM "bills"
        WHERE "date" >= ${yearStart} AND "date" <= ${yearEnd}
        GROUP BY month_num
        ORDER BY month_num
      `,

      // 4. Low-stock check in ONE query using a lateral / sub-query via raw SQL
      //    For each product, get the latest inventory row's available_quantity
      //    and filter where available_quantity <= low_stock.
      (prisma as any).$queryRaw`
        SELECT
          p."id",
          p."name",
          p."low_stock",
          COALESCE(latest_inv."available_quantity", 0)::int AS "available_quantity"
        FROM "products" p
        LEFT JOIN LATERAL (
          SELECT i."available_quantity"
          FROM "inventory" i
          WHERE i."productId" = p."id"
          ORDER BY i."createdAt" DESC
          LIMIT 1
        ) latest_inv ON true
        WHERE COALESCE(latest_inv."available_quantity", 0) <= COALESCE(p."low_stock", 0)
      `,

      // 5. Category distribution (already efficient, just one query)
      (prisma as any).category.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { products: true } },
        },
      }),
    ]);

    // ── post-process weekly data ───────────────────────────────────
    const weeklySums: Record<string, string> = {
      monday: '0',
      tuesday: '0',
      wensday: '0',
      thursday: '0',
      friday: '0',
      saturday: '0',
      sunday: '0',
    };
    let weeklyTotal = 0;

    for (const row of weeklyGrouped) {
      const d = new Date(row.date);
      const dayName = DAY_NAMES[d.getDay()];
      const sum = row._sum?.total ? Number(row._sum.total) : 0;
      weeklySums[dayName] = sum.toFixed(2);
      weeklyTotal += sum;
    }

    // ── post-process monthly data ──────────────────────────────────
    const monthlySums: Record<string, string> = {};
    let monthlyTotal = 0;

    // Initialise all months to 0
    for (let m = 0; m < 12; m++) {
      monthlySums[MONTH_NAMES[m]] = '0';
    }

    for (const row of monthlyGrouped) {
      const monthIndex = Number(row.month_num) - 1; // 1-based → 0-based
      const sum = Number(row.total);
      const key = MONTH_NAMES[monthIndex] || `m${monthIndex + 1}`;
      monthlySums[key] = sum.toFixed(2);
      monthlyTotal += sum;
    }

    // ── post-process low stock ─────────────────────────────────────
    const lowStockItems = (lowStockRaw as any[]).map((r: any) => ({
      id: r.id,
      name: r.name,
      available_quantity: Number(r.available_quantity),
      low_stock: r.low_stock,
    }));

    // ── post-process category distribution ─────────────────────────
    const categoryDistribution = categories.map((c: any) => {
      const count = c._count?.products ?? 0;
      const percentage = totalProducts > 0
        ? Number(((count / totalProducts) * 100).toFixed(2))
        : 0;
      return { categoryId: c.id, categoryName: c.name, productCount: count, percentage };
    });

    return {
      weeklyIncome: weeklyTotal.toFixed(2),
      monthlyIncome: monthlyTotal.toFixed(2),
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
