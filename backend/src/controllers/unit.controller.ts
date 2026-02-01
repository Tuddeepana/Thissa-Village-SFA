import { Request, Response, NextFunction } from 'express';
import * as unitService from '../services/unit.service';
import { AppError } from '../errors/AppError';

export const createUnit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unit = await unitService.createUnit(req.body);
    res.status(201).json({
      success: true,
      message: 'Unit created successfully',
      data: unit,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return next(new AppError('Unit with this name already exists', 400));
    }
    next(error);
  }
};

export const getUnitById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const unit = await unitService.getUnitById(id);

    if (!unit) {
      return next(new AppError('Unit not found', 404));
    }

    res.json({
      success: true,
      data: unit,
    });
  } catch (error) {
    next(error);
  }
};

export const listUnits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await unitService.listUnits();
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUnit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const unit = await unitService.updateUnit(id, req.body);

    res.json({
      success: true,
      message: 'Unit updated successfully',
      data: unit,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return next(new AppError('Unit with this name already exists', 400));
    }
    if (error.code === 'P2025') {
      return next(new AppError('Unit not found', 404));
    }
    next(error);
  }
};

export const deleteUnit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await unitService.deleteUnit(id);

    res.json({
      success: true,
      message: 'Unit deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return next(new AppError('Unit not found', 404));
    }
    next(error);
  }
};

