import prisma from '../lib/prisma';
import { UnitCreateInput, UnitDTO, UnitUpdateInput, UnitListResult } from '../types/unit.types';

export const createUnit = async (payload: UnitCreateInput): Promise<UnitDTO> => {
  const created = await (prisma as any).unit.create({
    data: {
      name: payload.name,
      description: payload.description ?? null,
    },
  });
  return created;
};

export const getUnitById = async (id: string): Promise<UnitDTO | null> => {
  const unit = await (prisma as any).unit.findUnique({
    where: { id },
  });
  return unit;
};

export const listUnits = async (): Promise<UnitListResult> => {
  const units = await (prisma as any).unit.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return {
    units,
    total: units.length,
  };
};

export const updateUnit = async (id: string, payload: UnitUpdateInput): Promise<UnitDTO> => {
  const updated = await (prisma as any).unit.update({
    where: { id },
    data: {
      name: payload.name ?? undefined,
      description: payload.description ?? undefined,
      updatedAt: new Date(),
    },
  });
  return updated;
};

export const deleteUnit = async (id: string): Promise<UnitDTO> => {
  // Soft delete
  const deleted = await (prisma as any).unit.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return deleted;
};

