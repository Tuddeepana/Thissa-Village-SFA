import { Request, Response, NextFunction } from 'express';
import * as roomBookingService from '../services/room-booking.service';
import { AppError } from '../errors/AppError';

export const createRoomBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = {
      ...req.body,
      checkInDate: new Date(req.body.checkInDate),
      checkOutDate: new Date(req.body.checkOutDate),
    };

    const result = await roomBookingService.createRoomBooking(payload);

    res.status(201).json({
      success: true,
      message: result.bill ? 'Room booking and bill created successfully' : 'Room booking created successfully',
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getRoomBookingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const booking = await roomBookingService.getRoomBookingById(id);

    if (!booking) {
      return next(new AppError('Room booking not found', 404));
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const listRoomBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const result = await roomBookingService.listRoomBookings(status as string);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRoomBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const payload: any = { ...req.body };

    // Convert date strings to Date objects if provided
    if (payload.checkInDate) {
      payload.checkInDate = new Date(payload.checkInDate);
    }
    if (payload.checkOutDate) {
      payload.checkOutDate = new Date(payload.checkOutDate);
    }

    const booking = await roomBookingService.updateRoomBooking(id, payload);

    res.json({
      success: true,
      message: 'Room booking updated successfully',
      data: booking,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return next(new AppError('Room booking not found', 404));
    }
    next(error);
  }
};

export const checkOutBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const booking = await roomBookingService.checkOutBooking(id);

    res.json({
      success: true,
      message: 'Room checked out successfully',
      data: booking,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return next(new AppError('Room booking not found', 404));
    }
    next(error);
  }
};

export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const booking = await roomBookingService.cancelBooking(id);

    res.json({
      success: true,
      message: 'Room booking cancelled successfully',
      data: booking,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return next(new AppError('Room booking not found', 404));
    }
    next(error);
  }
};

export const getAvailableRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { checkInDate, checkOutDate } = req.query;

    if (!checkInDate || !checkOutDate) {
      return next(new AppError('Check-in and check-out dates are required', 400));
    }

    const checkIn = new Date(checkInDate as string);
    const checkOut = new Date(checkOutDate as string);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return next(new AppError('Invalid date format', 400));
    }

    if (checkOut <= checkIn) {
      return next(new AppError('Check-out date must be after check-in date', 400));
    }

    const availableRooms = await roomBookingService.getAvailableRooms(checkIn, checkOut);

    res.json({
      success: true,
      rooms: availableRooms,
      total: availableRooms.length,
    });
  } catch (error) {
    next(error);
  }
};

export const settleBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const result = await roomBookingService.settleBookingBalance(id, payload);

    res.json({
      success: true,
      message: 'Balance settled successfully',
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'Booking not found' || error.code === 'P2025') {
      return next(new AppError('Room booking not found', 404));
    }
    if (error.message === 'No remaining balance to settle') {
      return next(new AppError('No remaining balance to settle', 400));
    }
    next(error);
  }
};
