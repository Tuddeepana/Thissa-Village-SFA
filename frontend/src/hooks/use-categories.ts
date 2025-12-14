import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService, CreateCategoryPayload } from '@/services/category.service';
import { toast } from 'sonner';

export const categoryKeys = {
  all: ['categories'] as const,
  list: (params?: Record<string, unknown>) => [...categoryKeys.all, 'list', params] as const,
};

export const useCategories = (params: { page?: number; limit?: number; search?: string; includeDeleted?: boolean } = {}) => {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => categoryService.list(params),
    staleTime: 60_000,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => categoryService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Category created successfully');
    },
    onError: () => {
      toast.error('Failed to create category');
    },
  });
};
