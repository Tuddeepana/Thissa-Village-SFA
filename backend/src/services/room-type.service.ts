import prisma from '../lib/prisma';
import {
  RoomTypeCreateInput,
  RoomTypeDTO,
  RoomTypeUpdateInput,
} from '../types/room-type.types';

export const createRoomType = async (payload: RoomTypeCreateInput): Promise<RoomTypeDTO> => {
  const created = await prisma.roomTypeConfig.create({
    data: {
      type: payload.type,
      price_full_day: payload.price_full_day,
      price_short_time: payload.price_short_time,
      description: payload.description ?? null,
    },
  });
  return created as unknown as RoomTypeDTO;
};

export const getRoomTypeById = async (id: string): Promise<RoomTypeDTO | null> => {
  return prisma.roomTypeConfig.findUnique({
    where: { id, deletedAt: null },
  }) as unknown as Promise<RoomTypeDTO | null>;
};

export const getRoomTypeByType = async (type: string): Promise<RoomTypeDTO | null> => {
  return prisma.roomTypeConfig.findUnique({
    where: { type, deletedAt: null },
  }) as unknown as Promise<RoomTypeDTO | null>;
};

export const getDefaultRoomType = async (): Promise<RoomTypeDTO | null> => {
  // Try to find NORMAL first, fallback to first created
  const normal = await prisma.roomTypeConfig.findUnique({
    where: { type: 'NORMAL', deletedAt: null },
  });
  if (normal) return normal as unknown as RoomTypeDTO;

  const first = await prisma.roomTypeConfig.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  return first as unknown as RoomTypeDTO | null;
};

export const listRoomTypes = async (): Promise<{ roomTypes: RoomTypeDTO[]; total: number }> => {
  const roomTypes = await prisma.roomTypeConfig.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return {
    roomTypes: roomTypes as unknown as RoomTypeDTO[],
    total: roomTypes.length,
  };
};

export const updateRoomType = async (id: string, payload: RoomTypeUpdateInput): Promise<RoomTypeDTO> => {
  const updated = await prisma.roomTypeConfig.update({
    where: { id },
    data: {
      type: payload.type,
      price_full_day: payload.price_full_day,
      price_short_time: payload.price_short_time,
      description: payload.description ?? undefined,
    },
  });
  return updated as unknown as RoomTypeDTO;
};

export const softDeleteRoomType = async (id: string): Promise<RoomTypeDTO> => {
  const deleted = await prisma.roomTypeConfig.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return deleted as unknown as RoomTypeDTO;
};
