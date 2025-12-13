import { z } from 'zod';
import { Role } from '@prisma/client';

/**
 * User Registration Validation Schema
 */
export const registerUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters'),
  
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  
  nic: z
    .string()
    .min(1, 'NIC is required')
    .min(9, 'NIC must be at least 9 characters')
    .max(12, 'NIC must not exceed 12 characters')
    .trim(),
  
  role: z
    .nativeEnum(Role)
    .optional()
    .default(Role.CASHIER),
});

/**
 * User Login Validation Schema
 */
export const loginUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(1, 'Password is required'),
});

/**
 * User Update Validation Schema
 */
export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim()
    .optional(),
  
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters')
    .optional(),
  
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),
  
  nic: z
    .string()
    .min(9, 'NIC must be at least 9 characters')
    .max(12, 'NIC must not exceed 12 characters')
    .trim()
    .optional(),
  
  role: z
    .nativeEnum(Role)
    .optional(),
  
  status: z
    .string()
    .optional(),
});

/**
 * User Query/Filter Validation Schema
 */
export const userQuerySchema = z.object({
  role: z
    .nativeEnum(Role)
    .optional(),
  
  status: z
    .string()
    .optional(),
  
  search: z
    .string()
    .optional(),
  
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive number')
    .transform(Number)
    .optional(),
  
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive number')
    .transform(Number)
    .optional(),
});

/**
 * User ID Parameter Validation Schema
 */
export const userIdParamSchema = z.object({
  id: z
    .string()
    .min(1, 'User ID is required')
    .uuid('Invalid user ID format'),
});

// Type exports
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
