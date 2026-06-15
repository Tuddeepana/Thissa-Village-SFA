import { z } from 'zod';
import { Role, ProfileType } from '@prisma/client';

// Response types
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    nic: string;
    role: Role;
    status: string;
    profileType?: ProfileType | null;
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
  profileType?: ProfileType | null;
  createdAt: Date;
  updatedAt: Date;
}
