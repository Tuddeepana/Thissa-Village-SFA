import { Request, Response } from 'express';
import * as roomTypeService from '../services/room-type.service';

export const createRoomType = async (req: Request, res: Response) => {
  try {
    const roomType = await roomTypeService.createRoomType(req.body);
    res.status(201).json({ success: true, roomType });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Room type already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create room type', error: error.message });
  }
};

export const listRoomTypes = async (req: Request, res: Response) => {
  try {
    const result = await roomTypeService.listRoomTypes();
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch room types', error: error.message });
  }
};

export const getRoomType = async (req: Request, res: Response) => {
  try {
    const roomType = await roomTypeService.getRoomTypeById(req.params.id);
    if (!roomType) {
      res.status(404).json({ success: false, message: 'Room type not found' });
      return;
    }
    res.status(200).json({ success: true, roomType });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch room type', error: error.message });
  }
};

export const updateRoomType = async (req: Request, res: Response) => {
  try {
    const roomType = await roomTypeService.updateRoomType(req.params.id, req.body);
    res.status(200).json({ success: true, roomType });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Room type already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update room type', error: error.message });
  }
};

export const deleteRoomType = async (req: Request, res: Response) => {
  try {
    await roomTypeService.deleteRoomType(req.params.id);
    res.status(200).json({ success: true, message: 'Room type deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete room type', error: error.message });
  }
};
