import { BottleVolume } from '@prisma/client';

export interface ProductDTO {
  id: string;
  name: string;
  description?: string | null;
  barcode?: string | null;
  litres: string; // Prisma Decimal serialized as string
  cost_price: string; // Decimal
  selling_price: string; // Decimal
  bottle_volume: BottleVolume;
  low_stock: number;
  categoryId: string;
  categoryName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCreateInput = {
  name: string;
  description?: string | null;
  barcode?: string | null;
  litres: number | string;
  cost_price: number | string;
  selling_price: number | string;
  bottle_volume?: BottleVolume;
  low_stock: number;
  categoryId: string;
};

export type ProductUpdateInput = Partial<{
  name: string;
  description: string | null;
  barcode: string | null;
  litres: number | string;
  cost_price: number | string;
  selling_price: number | string;
  bottle_volume?: BottleVolume;
  low_stock: number;
  categoryId: string;
}>;

export type PaginationQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};