import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { userService } from '../services/user.service';
import {
  registerUserSchema,
  loginUserSchema,
  updateUserSchema,
  userQuerySchema,
  userIdParamSchema,
} from '../validations/user.validation';
import { createSuccessResponse } from '../errors/ErrorResponse';

export class UserController {
  /**
   * Register a new user
   * POST /api/users/register
   * Access: Admin only
   */
  async register(req: AuthRequest, res: Response): Promise<void> {
    // Validate request body
    const validatedData = registerUserSchema.parse(req.body);

    // Register user
    const result = await userService.register(validatedData);

    const response = createSuccessResponse(result, 'User registered successfully');
    res.status(201).json(response);
  }

  /**
   * Login user
   * POST /api/users/login
   * Access: Public
   */
  async login(req: AuthRequest, res: Response): Promise<void> {
    // Validate request body
    const validatedData = loginUserSchema.parse(req.body);

    // Login user
    const result = await userService.login(validatedData);

    const response = createSuccessResponse(result, 'Login successful');
    res.status(200).json(response);
  }

  /**
   * Get current user profile
   * GET /api/users/me
   * Access: Authenticated users
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await userService.getUserById(req.user.id);

    const response = createSuccessResponse(user);
    res.status(200).json(response);
  }

  /**
   * Get all users
   * GET /api/users
   * Access: Admin only
   */
  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    // Validate query parameters
    const query = userQuerySchema.parse(req.query);

    const users = await userService.getUsers(query);

    const response = createSuccessResponse(users, undefined, users.length);
    res.status(200).json(response);
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   * Access: Admin only
   */
  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = userIdParamSchema.parse(req.params);

    const user = await userService.getUserById(id);

    const response = createSuccessResponse(user);
    res.status(200).json(response);
  }

  /**
   * Update user
   * PUT /api/users/:id
   * Access: Admin only
   */
  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    const { id } = userIdParamSchema.parse(req.params);

    // Validate request body
    const validatedData = updateUserSchema.parse(req.body);

    const user = await userService.updateUser(id, validatedData);

    const response = createSuccessResponse(user, 'User updated successfully');
    res.status(200).json(response);
  }

  /**
   * Update own profile
   * PUT /api/users/me
   * Access: Authenticated users
   */
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    // Users can only update their own name, email, password, and nic
    // They cannot update their role or status
    const allowedUpdates = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      nic: req.body.nic,
    };

    // Validate request body
    const validatedData = updateUserSchema.parse(allowedUpdates);

    const user = await userService.updateUser(req.user.id, validatedData);

    const response = createSuccessResponse(user, 'Profile updated successfully');
    res.status(200).json(response);
  }

  /**
   * Delete user (soft delete)
   * DELETE /api/users/:id
   * Access: Admin only
   */
  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    const { id } = userIdParamSchema.parse(req.params);

    await userService.deleteUser(id);

    const response = createSuccessResponse(null, 'User deleted successfully');
    res.status(200).json(response);
  }

  /**
   * Permanently delete user
   * DELETE /api/users/:id/permanent
   * Access: Admin only
   */
  async permanentlyDeleteUser(req: AuthRequest, res: Response): Promise<void> {
    const { id } = userIdParamSchema.parse(req.params);

    await userService.permanentlyDeleteUser(id);

    const response = createSuccessResponse(null, 'User permanently deleted successfully');
    res.status(200).json(response);
  }
}

export const userController = new UserController();
