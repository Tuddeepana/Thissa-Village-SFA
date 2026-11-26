import prisma from '../lib/prisma';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wensday', 'thursday', 'friday', 'saturday'];
const MONTH_NAMES = ['jan','feb','march','april','may','june','july','aug','sep','oct','nov','dec'];

interface WeeklyRow {
  dow: number;
  total: string | number;
}

interface MonthlyRow {
  month_num: number;
  total: string | number;
}

interface LowStockRow {
  id: string;
  name: string;
  available_quantity: number;
  low_stock: number;
}

interface CategoryCountRow {
  categoryId: string;
  categoryName: string;
  productCount: number;
}

class DashboardService {
  /**
   * Return aggregated dashboard metrics using parallel SQL queries
   */
  async getSummary() {
    const now = new Date();
    const tzOffsetMinutes = -now.getTimezoneOffset();

    // Weekly window: last 7 days (including today) in local server time
    const weeklyStart = new Date(now);
    weeklyStart.setDate(now.getDate() - 6);
    weeklyStart.setHours(0, 0, 0, 0);

    const weeklyEnd = new Date(now);
    weeklyEnd.setHours(23, 59, 59, 999);

    // Monthly window: full current year in local server time
    const year = now.getFullYear();
    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    // Execute all dashboard queries in parallel (1 single DB round-trip window)
    const [
      totalProducts,
      weeklyRows,
      monthlyRows,
      lowStockItems,
      categoryRows,
    ] = await Promise.all([
      prisma.product.count(),

      prisma.$queryRaw<WeeklyRow[]>`
        SELECT
          EXTRACT(DOW FROM ("date" + (${tzOffsetMinutes}::int * INTERVAL '1 minute')))::int AS dow,
          COALESCE(SUM("total"), 0) AS total
        FROM "bills"
        WHERE "date" >= ${weeklyStart} AND "date" <= ${weeklyEnd}
        GROUP BY dow
      `,

      prisma.$queryRaw<MonthlyRow[]>`
        SELECT
          EXTRACT(MONTH FROM ("date" + (${tzOffsetMinutes}::int * INTERVAL '1 minute')))::int AS month_num,
          COALESCE(SUM("total"), 0) AS total
        FROM "bills"
        WHERE "date" >= ${yearStart} AND "date" <= ${yearEnd}
        GROUP BY month_num
      `,

      prisma.$queryRaw<LowStockRow[]>`
        WITH LatestInventory AS (
          SELECT DISTINCT ON ("productId")
            "productId",
            "available_quantity"
          FROM "inventory"
          ORDER BY "productId", "createdAt" DESC
        )
        SELECT
          p.id,
          p.name,
          COALESCE(li.available_quantity, 0)::int AS available_quantity,
          p.low_stock::int AS low_stock
        FROM "products" p
        LEFT JOIN LatestInventory li ON p.id = li."productId"
        WHERE COALESCE(li.available_quantity, 0) <= COALESCE(p.low_stock, 0)
        ORDER BY p.name ASC
      `,

      prisma.$queryRaw<CategoryCountRow[]>`
        SELECT
          c.id AS "categoryId",
          c.name AS "categoryName",
          COUNT(p.id)::int AS "productCount"
        FROM "categories" c
        LEFT JOIN "products" p ON p."categoryId" = c.id
        GROUP BY c.id, c.name
      `,
    ]);

    // Map weekly sums per day and compute weekly total
    const weeklySums: Record<string, string> = {
      monday: '0',
      tuesday: '0',
      wensday: '0',
      thursday: '0',
      friday: '0',
      saturday: '0',
      sunday: '0',
    };

    let weeklyTotalNum = 0;
    for (const row of weeklyRows) {
      const sum = Number(row.total) || 0;
      weeklyTotalNum += sum;
      const dayName = DAY_NAMES[row.dow];
      if (dayName) {
        const key = dayName === 'wednesday' ? 'wensday' : dayName;
        weeklySums[key] = sum.toFixed(2);
      }
    }

    // Initialize and map monthly sums per month and compute monthly total
    const monthlySums: Record<string, string> = {};
    for (let m = 0; m < 12; m++) {
      monthlySums[MONTH_NAMES[m]] = '0.00';
    }

    let monthlyTotalNum = 0;
    for (const row of monthlyRows) {
      const sum = Number(row.total) || 0;
      monthlyTotalNum += sum;
      const monthIndex = Number(row.month_num) - 1;
      const key = MONTH_NAMES[monthIndex] || `m${monthIndex + 1}`;
      monthlySums[key] = sum.toFixed(2);
    }

    // Format category distribution
    const categoryDistribution = categoryRows.map((c) => {
      const count = Number(c.productCount) || 0;
      const percentage = totalProducts > 0 ? Number(((count / totalProducts) * 100).toFixed(2)) : 0;
      return {
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        productCount: count,
        percentage,
      };
    });

    const weeklyIncome = weeklyTotalNum > 0 ? weeklyTotalNum.toFixed(2) : '0';
    const monthlyIncome = monthlyTotalNum > 0 ? monthlyTotalNum.toFixed(2) : '0';

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
    const [totalProducts, categoryRows] = await Promise.all([
      prisma.product.count(),
      prisma.$queryRaw<CategoryCountRow[]>`
        SELECT
          c.id AS "categoryId",
          c.name AS "categoryName",
          COUNT(p.id)::int AS "productCount"
        FROM "categories" c
        LEFT JOIN "products" p ON p."categoryId" = c.id
        GROUP BY c.id, c.name
      `,
    ]);

    return categoryRows.map((c) => {
      const count = Number(c.productCount) || 0;
      return {
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        productCount: count,
        percentage: totalProducts > 0 ? Number(((count / totalProducts) * 100).toFixed(2)) : 0,
      };
    });
  }
}

export const dashboardService = new DashboardService();
