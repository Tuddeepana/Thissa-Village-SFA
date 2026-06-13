import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

export const getSummary = async (req: Request, res: Response) => {
  const data = await dashboardService.getSummary();
  res.json({
    success: true,
    response: {
      weeklyIncome: data.weeklyIncome,
      monthlyIncome: data.monthlyIncome,
      weeklyIncomeResponse: data.weeklyIncomeResponse,
      monthlyIncomeResponse: data.monthlyIncomeResponse,
      weeklyBillCountResponse: data.weeklyBillCountResponse,
      TotalProduct: data.TotalProduct,
      lowStockItems: data.lowStockItems,
      categoryDistribution: data.categoryDistribution,
    },
  });
};

export const getProductCategory = async (req: Request, res: Response) => {
  const data = await dashboardService.getProductCategoryDistribution();
  res.json({ success: true, data });
};
