import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  RegisterUserInput,
  LoginUserInput,
  UpdateUserInput,
  UserQueryInput,
} from '../validations/user.validation';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  InternalServerError,
} from '../errors/AppError';
import { AuthResponse, UserResponse } from '../types/user.types';

const prisma = new PrismaClient();

export class UserService {
  /**
   * Generate JWT token for user
   */
  private generateToken(userId: string, email: string, role: Role): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign(
      { id: userId, email, role },
      jwtSecret,
      { expiresIn: '7d' } // Token expires in 7 days
    );
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hashed password
   */
  private async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterUserInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { nic: data.nic }],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new ConflictError('Email already exists');
      }
      if (existingUser.nic === data.nic) {
        throw new ConflictError('NIC already exists');
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        nic: data.nic,
        role: data.role || Role.CASHIER,
      },
    });

    // Generate token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nic: user.nic,
        role: user.role,
        status: user.status,
      },
      token,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginUserInput): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'Active') {
      throw new UnauthorizedError('Account is not active. Please contact administrator.');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(
      data.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nic: user.nic,
        role: user.role,
        status: user.status,
      },
      token,
    };
  }

  /**
   * Get all users with optional filters
   */
  async getUsers(query: UserQueryInput): Promise<UserResponse[]> {
    const where: any = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { nic: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        nic: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        nic: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    data: UpdateUserInput
  ): Promise<UserResponse> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Check for email uniqueness if updating email
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new ConflictError('Email already exists');
      }
    }

    // Check for NIC uniqueness if updating NIC
    if (data.nic && data.nic !== existingUser.nic) {
      const nicExists = await prisma.user.findUnique({
        where: { nic: data.nic },
      });

      if (nicExists) {
        throw new ConflictError('NIC already exists');
      }
    }

    // Prepare update data
    const updateData: any = {
      email: data.email,
      name: data.name,
      nic: data.nic,
      role: data.role,
      status: data.status,
    };

    // Hash password if updating
    if (data.password) {
      updateData.password = await this.hashPassword(data.password);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        nic: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Delete user (soft delete by setting status to Inactive)
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Soft delete by setting status to Inactive
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'Inactive' },
    });
  }

  /**
   * Permanently delete user
   */
  async permanentlyDeleteUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.delete({
      where: { id: userId },
    });
  }
}

export const userService = new UserService();
