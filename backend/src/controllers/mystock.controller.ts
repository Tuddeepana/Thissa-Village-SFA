import { Request, Response } from 'express';
import { getMyStock } from '../services/mystock.service';
import type { MyStockQuery } from '../types/mystock.types';

export const getMyStockController = async (req: Request, res: Response) => {
  const q: MyStockQuery = {
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    productName: typeof req.query.productName === 'string' ? req.query.productName
      : typeof req.query.search === 'string' ? req.query.search : undefined,
    categoryId: typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    noPagination: typeof req.query.noPagination === 'string' ? req.query.noPagination === 'true' : undefined,
  };

  const data = await getMyStock(q);
  res.json({ success: true, ...data });
};

