export type Unit = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type CreateUnitPayload = {
  name: string;
  description?: string | null;
};

export type UpdateUnitPayload = Partial<{
  name: string;
  description: string | null;
}>;

export type UnitListResponse = {
  success: boolean;
  units: Unit[];
  total: number;
};

