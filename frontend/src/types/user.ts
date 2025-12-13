export type UserRole = 'ADMIN' | 'CASHIER';
export type UserStatus = 'Active' | 'Inactive';

export interface User {
  id: string;
  email: string;
  name: string;
  nic: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  count: number;
  timestamp: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  nic: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  email?: string;
  name?: string;
  nic?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

