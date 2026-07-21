import prisma from '../lib/prisma';
import { getDefaultRoomType } from './room-type.service';

interface CreateRoomPayload {
  name: string;
  room_types?: string[];
  quantity: number;
}

interface UpdateRoomPayload {
  name?: string;
  room_types?: string[];
  quantity?: number;
}

interface ExpandedRoomItem {
  id: string;
  displayName: string;
  room_types: string[];
  baseRoomId: string;
}

// Fetch all room type configs indexed by type string
async function getRoomTypeConfigMap() {
  const configs = await prisma.roomTypeConfig.findMany({
    where: { deletedAt: null },
  });
  const map: Record<string, { price_full_day: number; price_short_time: number }> = {};
  configs.forEach((c) => {
    map[c.type] = {
      price_full_day: Number(c.price_full_day),
      price_short_time: Number(c.price_short_time),
    };
  });
  return map;
}

export const createRoom = async (payload: CreateRoomPayload) => {
  // If room_types is not provided or empty, use default from RoomTypeConfig
  if (!payload.room_types || payload.room_types.length === 0) {
    const defaultType = await getDefaultRoomType();
    payload.room_types = [defaultType?.type ?? 'NORMAL'];
  }

  return await prisma.room.create({
    data: payload as any,
  });
};

export const getRoomById = async (id: string) => {
  const room = await prisma.room.findUnique({
    where: { id, deletedAt: null },
  });

  if (!room) return null;

  return room;
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
        room_types: room.room_types,
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
