import prisma from '../lib/prisma';

interface CreateRoomPayload {
  name: string;
  roomTypeId: string;
  quantity: number;
  price_full_day: number;
  price_short_time: number;
}

interface UpdateRoomPayload {
  name?: string;
  roomTypeId?: string;
  quantity?: number;
  price_full_day?: number;
  price_short_time?: number;
}

interface ExpandedRoomItem {
  id: string;
  displayName: string;
  room_type: string; // Resolves to RoomType.type
  baseRoomId: string;
}

export const createRoom = async (payload: CreateRoomPayload) => {
  return await prisma.room.create({
    data: payload,
    include: { roomType: true },
  });
};

export const getRoomById = async (id: string) => {
  return await prisma.room.findUnique({
    where: { id, deletedAt: null },
    include: { roomType: true },
  });
};

export const listRooms = async () => {
  const rooms = await prisma.room.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { roomType: true },
  });

  return {
    rooms: rooms.map(room => ({
      ...room,
      room_type: room.roomType.type,
    })),
    total: rooms.length,
  };
};

export const getExpandedRoomList = async (): Promise<ExpandedRoomItem[]> => {
  const rooms = await prisma.room.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { roomType: true },
  });

  const expanded: ExpandedRoomItem[] = [];

  rooms.forEach((room) => {
    for (let i = 1; i <= room.quantity; i++) {
      expanded.push({
        id: `${room.id}-${i}`,
        displayName: `${room.name} ${i}`,
        room_type: room.roomType.type,
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
    include: { roomType: true },
  });
};

export const deleteRoom = async (id: string) => {
  return await prisma.room.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
