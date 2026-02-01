import { Request, Response, NextFunction } from 'express';
import * as tableService from '../services/table.service';
import { AppError } from '../errors/AppError';

export const createRestaurantTable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const table = await tableService.createRestaurantTable(req.body);
    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: table,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return next(new AppError('Table with this name already exists', 400));
    }
    next(error);
  }
};

export const getRestaurantTableById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const table = await tableService.getRestaurantTableById(id);

    if (!table) {
      return next(new AppError('Table not found', 404));
    }

    res.json({
      success: true,
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

export const listRestaurantTables = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await tableService.listRestaurantTables();
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getExpandedTableList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expandedList = await tableService.getExpandedTableList();
    res.json({
      success: true,
      tables: expandedList,
      total: expandedList.length,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRestaurantTable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const table = await tableService.updateRestaurantTable(id, req.body);

    res.json({
      success: true,
      message: 'Table updated successfully',
      data: table,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return next(new AppError('Table with this name already exists', 400));
    }
    if (error.code === 'P2025') {
      return next(new AppError('Table not found', 404));
    }
    next(error);
  }
};

export const deleteRestaurantTable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await tableService.deleteRestaurantTable(id);

    res.json({
      success: true,
      message: 'Table deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return next(new AppError('Table not found', 404));
    }
    next(error);
  }
};

