import { z } from 'zod';
import { Role } from '@prisma/client';

// Response types
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    nic: string;
    role: Role;
    status: string;
  };
  token: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  nic: string;
  role: Role;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
