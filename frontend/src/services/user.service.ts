import { apiClient } from '@/lib/api-client';
import {
  User,
  UsersResponse,
  CreateUserPayload,
  UpdateUserPayload,
} from '@/types/user';

export const userService = {
  // Get all users
  getUsers: async (): Promise<UsersResponse> => {
    const response = await apiClient.get<UsersResponse>('/users');
    return response.data;
  },

  // Get a single user by ID
  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get<{ success: boolean; data: User }>(`/users/${id}`);
    return response.data.data;
  },

  // Create a new user
  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const response = await apiClient.post<{ success: boolean; data: User }>('/users', payload);
    return response.data.data;
  },

  // Update an existing user
  updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const response = await apiClient.put<{ success: boolean; data: User }>(`/users/${id}`, payload);
    return response.data.data;
  },

  // Delete a user
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  // Toggle user status
  toggleUserStatus: async (id: string): Promise<User> => {
    const response = await apiClient.patch<{ success: boolean; data: User }>(`/users/${id}/status`);
    return response.data.data;
  },
};

