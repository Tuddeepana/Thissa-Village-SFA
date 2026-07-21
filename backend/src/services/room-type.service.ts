import prisma from '../lib/prisma';
import { CreateRoomTypePayload, UpdateRoomTypePayload } from '../types/room-type.types';

export const createRoomType = async (payload: CreateRoomTypePayload) => {
  return await prisma.roomType.create({
    data: payload,
  });
};

export const getRoomTypeById = async (id: string) => {
  return await prisma.roomType.findUnique({
    where: { id, deletedAt: null },
  });
};

export const listRoomTypes = async () => {
  const roomTypes = await prisma.roomType.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return {
    roomTypes,
    total: roomTypes.length,
  };
};

export const updateRoomType = async (id: string, payload: UpdateRoomTypePayload) => {
  return await prisma.roomType.update({
    where: { id },
    data: payload,
  });
};

export const deleteRoomType = async (id: string) => {
  return await prisma.roomType.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
