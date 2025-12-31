import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

export const getSummary = async (req: Request, res: Response) => {
  const data = await dashboardService.getSummary();
  res.json({
    success: true,
    response: {
      weeklyIncome: data.weeklyIncome,
      monthlyIncome: data.monthlyIncome,
      TotalProduct: data.TotalProduct,
      lowStockItems: data.lowStockItems,
    },
  });
};

