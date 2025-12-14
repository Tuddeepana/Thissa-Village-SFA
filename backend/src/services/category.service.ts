import prisma from "../lib/prisma";
import {
  CategoryCreateInput,
  CategoryDTO,
  CategoryUpdateInput,
  PaginatedResult,
  PaginationQuery,
} from "../types/category.types";

export const createCategory = async (payload: CategoryCreateInput): Promise<CategoryDTO> => {
  const created = await (prisma as any).category.create({
    data: {
      name: payload.name,
      description: payload.description ?? null,
    },
  });
  return created;
};

export const getCategoryById = async (id: string): Promise<CategoryDTO | null> => {
  return (prisma as any).category.findUnique({ where: { id } });
};

export const listCategories = async (query: PaginationQuery): Promise<PaginatedResult<CategoryDTO>> => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 10;
  const skip = (page - 1) * limit;

  const where: any = {
    AND: [
      query.search
        ? { name: { contains: query.search, mode: "insensitive" } }
        : {},
      query.includeDeleted ? {} : { deletedAt: null },
    ],
  };

  const [data, total] = await Promise.all([
    (prisma as any).category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    (prisma as any).category.count({ where }),
  ]);

  return { data, page, limit, total };
};

export const updateCategory = async (id: string, payload: CategoryUpdateInput): Promise<CategoryDTO> => {
  const updated = await (prisma as any).category.update({
    where: { id },
    data: {
      name: payload.name,
      description: payload.description ?? undefined,
      deletedAt: payload.deletedAt ?? undefined,
    },
  });
  return updated;
};

export const softDeleteCategory = async (id: string): Promise<CategoryDTO> => {
  const deleted = await (prisma as any).category.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return deleted;
};

export const restoreCategory = async (id: string): Promise<CategoryDTO> => {
  const restored = await (prisma as any).category.update({
    where: { id },
    data: { deletedAt: null },
  });
  return restored;
};

export const hardDeleteCategory = async (id: string): Promise<CategoryDTO> => {
  const deleted = await (prisma as any).category.delete({ where: { id } });
  return deleted;
};
