import { Request, Response } from 'express';
import { serviceChargeService } from '../services/service-charge.service';
import type { UpdateServiceChargeInput } from '../types/service-charge.types';

export const getServiceCharge = async (req: Request, res: Response) => {
  try {
    const serviceCharge = await serviceChargeService.getServiceCharge();

    if (!serviceCharge) {
      return res.status(404).json({
        success: false,
        message: 'Service charge configuration not found',
      });
    }

    res.json({
      success: true,
      data: serviceCharge,
    });
  } catch (error: any) {
    console.error('Error fetching service charge:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch service charge',
    });
  }
};

export const updateServiceCharge = async (req: Request, res: Response) => {
  try {
    const input: UpdateServiceChargeInput = {
      percentage: req.body.percentage !== undefined ? Number(req.body.percentage) : undefined,
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : undefined,
    };

    // Validate percentage
    if (input.percentage !== undefined) {
      if (input.percentage < 0 || input.percentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percentage must be between 0 and 100',
        });
      }
    }

    const updated = await serviceChargeService.updateServiceCharge(input);

    res.json({
      success: true,
      data: updated,
      message: 'Service charge updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating service charge:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update service charge',
    });
  }
};

