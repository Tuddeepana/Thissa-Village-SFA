import prisma from '../lib/prisma';
// @ts-ignore
import { RoomTypeEnum } from '@prisma/client';

interface CreateRoomPayload {
  name: string;
  room_type: RoomTypeEnum;
  quantity: number;
  price_full_day: number;
  price_short_time: number;
}

interface UpdateRoomPayload {
  name?: string;
  room_type?: RoomTypeEnum;
  quantity?: number;
  price_full_day?: number;
  price_short_time?: number;
}

interface ExpandedRoomItem {
  id: string;
  displayName: string;
  room_type: RoomTypeEnum;
  baseRoomId: string;
}

export const createRoom = async (payload: CreateRoomPayload) => {
  return await prisma.room.create({
    data: payload,
  });
};

export const getRoomById = async (id: string) => {
  return await prisma.room.findUnique({
    where: { id, deletedAt: null },
  });
};

export const listRooms = async () => {
  const rooms = await prisma.room.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return {
    rooms,
    total: rooms.length,
  };
};

export const getExpandedRoomList = async (): Promise<ExpandedRoomItem[]> => {
  const rooms = await prisma.room.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  const expanded: ExpandedRoomItem[] = [];

  rooms.forEach((room) => {
    for (let i = 1; i <= room.quantity; i++) {
      expanded.push({
        id: `${room.id}-${i}`,
        displayName: `${room.name} ${i}`,
        room_type: room.room_type,
        baseRoomId: room.id,
      });
    }
  });

  return expanded;
};

export const updateRoom = async (id: string, payload: UpdateRoomPayload) => {
  return await prisma.room.update({
    where: { id },
    data: payload,
  });
};

export const deleteRoom = async (id: string) => {
  return await prisma.room.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

