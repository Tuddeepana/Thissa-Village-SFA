import prisma from '../lib/prisma';
import {
  ProductCreateInput,
  ProductDTO,
  ProductUpdateInput,
  PaginationQuery,
  PaginatedResult,
} from '../types/product.types';

export const createProduct = async (payload: ProductCreateInput): Promise<ProductDTO> => {
  const created = await (prisma as any).product.create({
    data: {
      name: payload.name,
      description: payload.description ?? null,
      litres: payload.litres,
      bottle_volume: payload.bottle_volume ?? undefined,
      cost_price: payload.cost_price,
      selling_price: payload.selling_price,
      low_stock: payload.low_stock,
      categoryId: payload.categoryId,
    },
  });
  return created;
};

export const getProductById = async (id: string): Promise<ProductDTO | null> => {
  const p = await (prisma as any).product.findUnique({ where: { id }, include: { category: { select: { name: true } } } });
  if (!p) return null;
  return { ...p, categoryName: p.category?.name ?? undefined, category: undefined } as ProductDTO;
};

export const listProducts = async (query: PaginationQuery): Promise<PaginatedResult<ProductDTO>> => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 10;
  const skip = (page - 1) * limit;

  const where: any = {
    AND: [
      query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {},
      query.categoryId ? { categoryId: query.categoryId } : {},
    ],
  };

  const [data, total] = await Promise.all([
    (prisma as any).product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true } } },
    }),
    (prisma as any).product.count({ where }),
  ]);

  // Map to include categoryName in DTO
  const mapped = (data || []).map((p: any) => ({
    ...p,
    categoryName: p.category?.name ?? undefined,
    // remove nested category to avoid sending relation object
    category: undefined,
  }));

  return { data: mapped, page, limit, total };
};

export const updateProduct = async (id: string, payload: ProductUpdateInput): Promise<ProductDTO> => {
  const updated = await (prisma as any).product.update({
    where: { id },
    data: {
      name: payload.name ?? undefined,
      description: payload.description ?? undefined,
      litres: payload.litres ?? undefined,
      bottle_volume: payload.bottle_volume ?? undefined,
      cost_price: payload.cost_price ?? undefined,
      selling_price: payload.selling_price ?? undefined,
      low_stock: payload.low_stock ?? undefined,
      categoryId: payload.categoryId ?? undefined,
    },
  });
  return updated;
};

export const deleteProduct = async (id: string): Promise<ProductDTO> => {
  const deleted = await (prisma as any).product.delete({ where: { id } });
  return deleted;
};
