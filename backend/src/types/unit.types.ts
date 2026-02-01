export interface UnitDTO {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type UnitCreateInput = {
  name: string;
  description?: string | null;
};

export type UnitUpdateInput = Partial<{
  name: string;
  description: string | null;
}>;

export type UnitListResult = {
  units: UnitDTO[];
  total: number;
};

