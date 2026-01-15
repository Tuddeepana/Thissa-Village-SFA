import prisma from '../lib/prisma';
import type { 
  SalesSummaryQuery, 
  SalesSummaryResponse, 
  SalesSummaryTableRow,
  VolumeWiseSummaryResponse,
  VolumeWiseSummaryRow
} from '../types/sales-summary.types';

export const getSalesSummary = async (query: SalesSummaryQuery): Promise<SalesSummaryResponse> => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;
  const skip = (page - 1) * pageSize;

  // Build date filters
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;

  if (query.today) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateFrom = today;
    dateTo = new Date(today);
    dateTo.setHours(23, 59, 59, 999);
  } else if (query.fromDate || query.toDate || query.year) {
    if (query.fromDate) {
      dateFrom = new Date(query.fromDate);
      dateFrom.setHours(0, 0, 0, 0);
    }
    if (query.toDate) {
      dateTo = new Date(query.toDate);
      dateTo.setHours(23, 59, 59, 999);
    }
    if (query.year && !query.fromDate && !query.toDate) {
      dateFrom = new Date(`${query.year}-01-01`);
      dateTo = new Date(`${query.year}-12-31`);
      dateTo.setHours(23, 59, 59, 999);
    }
  }

  // Build where clause for bills
  const billWhere: any = {};
  if (dateFrom || dateTo) {
    billWhere.date = {};
    if (dateFrom) billWhere.date.gte = dateFrom;
    if (dateTo) billWhere.date.lte = dateTo;
  }

  // Fetch all bills in the date range with inventory records
  const bills = await (prisma as any).bill.findMany({
    where: billWhere,
    include: {
      inventoryRecords: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  // Build all rows from bills and inventory records
  const allRows: SalesSummaryTableRow[] = [];

  for (const bill of bills) {
    for (const inv of bill.inventoryRecords || []) {
      const product = inv.product;
      if (!product) continue;

      // Apply product and category filters
      if (query.categoryId && query.categoryId !== 'all' && product.categoryId !== query.categoryId) continue;
      if (query.productId && query.productId !== 'all' && product.id !== query.productId) continue;

      const qty = Math.abs(inv.quantity_moved || 0);
      const litres = Number(product.litres || 0);
      const bottleVolume = product.bottle_volume || 'ML';
      const volume = `${litres} ${bottleVolume}`;

      const sellingPrice = Number(product.selling_price || 0);
      const costPrice = Number(product.cost_price || 0);
      const revenue = sellingPrice * qty;
      const profit = (sellingPrice - costPrice) * qty;

      allRows.push({
        date: bill.date.toISOString().split('T')[0],
        productName: product.name,
        categoryName: product.category?.name || 'N/A',
        quantity: qty,
        volume,
        revenue,
        profit,
      });
    }
  }

  // Calculate card metrics from all rows (not paginated)
  const totalQuantity = allRows.reduce((sum, row) => sum + row.quantity, 0);
  const totalRevenue = allRows.reduce((sum, row) => sum + row.revenue, 0);
  const totalProfit = allRows.reduce((sum, row) => sum + row.profit, 0);

  // Calculate total volume
  let totalVolumeInLitres = 0;
  for (const row of allRows) {
    const parts = row.volume.split(' ');
    const value = parseFloat(parts[0]) || 0;
    const unit = parts[1]?.toUpperCase() || 'ML';
    if (unit === 'L') {
      totalVolumeInLitres += value * row.quantity;
    } else if (unit === 'ML') {
      totalVolumeInLitres += (value / 1000) * row.quantity;
    }
  }
  const totalVolume = `${totalVolumeInLitres.toFixed(2)} L`;

  // Paginate table rows
  const totalRecords = allRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const pageRows = allRows.slice(skip, skip + pageSize);

  return {
    cardResponse: {
      totalQuantity,
      totalVolume,
      totalRevenue,
      totalProfit,
    },
    tableResponse: {
      data: pageRows,
      pagination: {
        currentPage: page,
        pageSize,
        totalPages,
        totalRecords,
      },
    },
  };
};

// Volume-wise sales summary - grouped by product and bottle size
export const getVolumeWiseSummary = async (query: SalesSummaryQuery): Promise<VolumeWiseSummaryResponse> => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;
  const skip = (page - 1) * pageSize;

  // Build date filters
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;

  if (query.today) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateFrom = today;
    dateTo = new Date(today);
    dateTo.setHours(23, 59, 59, 999);
  } else if (query.fromDate || query.toDate || query.year) {
    if (query.fromDate) {
      dateFrom = new Date(query.fromDate);
      dateFrom.setHours(0, 0, 0, 0);
    }
    if (query.toDate) {
      dateTo = new Date(query.toDate);
      dateTo.setHours(23, 59, 59, 999);
    }
    if (query.year && !query.fromDate && !query.toDate) {
      dateFrom = new Date(`${query.year}-01-01`);
      dateTo = new Date(`${query.year}-12-31`);
      dateTo.setHours(23, 59, 59, 999);
    }
  }

  // Build where clause for bills
  const billWhere: any = {};
  if (dateFrom || dateTo) {
    billWhere.date = {};
    if (dateFrom) billWhere.date.gte = dateFrom;
    if (dateTo) billWhere.date.lte = dateTo;
  }

  // Fetch all bills in the date range with inventory records
  const bills = await (prisma as any).bill.findMany({
    where: billWhere,
    include: {
      inventoryRecords: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  // Group by product name + volume
  const grouped = new Map<string, {
    productName: string;
    categoryName: string;
    volume: string;
    quantity: number;
    revenue: number;
    profit: number;
    totalVolumeInLitres: number;
    minDate: Date;
    maxDate: Date;
  }>();

  for (const bill of bills) {
    for (const inv of bill.inventoryRecords || []) {
      const product = inv.product;
      if (!product) continue;

      // Apply product and category filters
      if (query.categoryId && query.categoryId !== 'all' && product.categoryId !== query.categoryId) continue;
      if (query.productId && query.productId !== 'all' && product.id !== query.productId) continue;

      const qty = Math.abs(inv.quantity_moved || 0);
      const litres = Number(product.litres || 0);
      const bottleVolume = product.bottle_volume || 'ML';
      const volume = `${litres} ${bottleVolume}`;

      // Create unique key: productName + volume
      const key = `${product.name}|${volume}`;

      const sellingPrice = Number(product.selling_price || 0);
      const costPrice = Number(product.cost_price || 0);
      const revenue = sellingPrice * qty;
      const profit = (sellingPrice - costPrice) * qty;

      // Calculate volume in litres
      let volumeInLitres = 0;
      if (bottleVolume.toUpperCase() === 'L') {
        volumeInLitres = litres * qty;
      } else if (bottleVolume.toUpperCase() === 'ML') {
        volumeInLitres = (litres / 1000) * qty;
      }

      const existing = grouped.get(key);
      if (existing) {
        existing.quantity += qty;
        existing.revenue += revenue;
        existing.profit += profit;
        existing.totalVolumeInLitres += volumeInLitres;
        if (bill.date < existing.minDate) existing.minDate = bill.date;
        if (bill.date > existing.maxDate) existing.maxDate = bill.date;
      } else {
        grouped.set(key, {
          productName: product.name,
          categoryName: product.category?.name || 'N/A',
          volume,
          quantity: qty,
          revenue,
          profit,
          totalVolumeInLitres: volumeInLitres,
          minDate: bill.date,
          maxDate: bill.date,
        });
      }
    }
  }

  // Convert to array and format
  const allRows: VolumeWiseSummaryRow[] = Array.from(grouped.values()).map(item => {
    const minDateStr = item.minDate.toISOString().split('T')[0];
    const maxDateStr = item.maxDate.toISOString().split('T')[0];
    const dateRange = minDateStr === maxDateStr 
      ? minDateStr 
      : `${minDateStr} - ${maxDateStr}`;

    return {
      dateRange,
      productName: item.productName,
      categoryName: item.categoryName,
      quantity: item.quantity,
      volume: item.volume,
      revenue: item.revenue,
      profit: item.profit,
      totalVolume: `${item.totalVolumeInLitres.toFixed(2)} L`,
    };
  });

  // Sort by product name, then by volume
  allRows.sort((a, b) => {
    const nameCompare = a.productName.localeCompare(b.productName);
    if (nameCompare !== 0) return nameCompare;
    return a.volume.localeCompare(b.volume);
  });

  // Paginate
  const totalRecords = allRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const pageRows = allRows.slice(skip, skip + pageSize);

  return {
    tableResponse: {
      data: pageRows,
      pagination: {
        currentPage: page,
        pageSize,
        totalPages,
        totalRecords,
      },
    },
  };
};
