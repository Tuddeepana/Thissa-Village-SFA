import { Request, Response } from 'express';
import { getSalesSummary } from '../services/sales-summary.service';
import type { SalesSummaryQuery } from '../types/sales-summary.types';

export const getSalesSummaryController = async (req: Request, res: Response) => {
  const q: SalesSummaryQuery = {
    fromDate: typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined,
    toDate: typeof req.query.toDate === 'string' ? req.query.toDate : undefined,
    today: req.query.today === 'true',
    year: typeof req.query.year === 'string' ? req.query.year : undefined,
    categoryId: typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
    productId: typeof req.query.productId === 'string' ? req.query.productId : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  };

  const data = await getSalesSummary(q);
  res.json({ success: true, ...data });
};
