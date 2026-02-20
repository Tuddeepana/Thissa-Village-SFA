import { Request, Response, NextFunction } from 'express';
import * as roomService from '../services/room.service';
import { AppError } from '../errors/AppError';

export const createRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await roomService.createRoom(req.body);
    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return next(new AppError('Room with this name already exists', 400));
    }
    next(error);
  }
};

export const getRoomById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const room = await roomService.getRoomById(id);

    if (!room) {
      return next(new AppError('Room not found', 404));
    }

    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const listRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await roomService.listRooms();
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getExpandedRoomList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expandedList = await roomService.getExpandedRoomList();
    res.json({
      success: true,
      rooms: expandedList,
      total: expandedList.length,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const room = await roomService.updateRoom(id, req.body);

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: room,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return next(new AppError('Room with this name already exists', 400));
    }
    if (error.code === 'P2025') {
      return next(new AppError('Room not found', 404));
    }
    next(error);
  }
};

export const deleteRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await roomService.deleteRoom(id);

    res.json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return next(new AppError('Room not found', 404));
    }
    next(error);
  }
};

