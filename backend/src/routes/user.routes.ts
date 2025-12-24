import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  loginUserSchema,
  registerUserSchema,
  updateUserSchema,
  userIdParamSchema,
  userQuerySchema,
} from '../validations/user.validation';

const router = Router();

// Public routes
/**
 * @route   POST /api/users/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate({ body: loginUserSchema }), userController.login);

// Protected routes - Require authentication
/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private (Authenticated users)
 */
router.get('/me', authenticate, userController.getProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private (Authenticated users)
 */
router.put('/me', authenticate, validate({ body: updateUserSchema }), userController.updateProfile);

// Admin only routes
/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Private (Admin only)
 */
router.post('/register', authenticate, adminOnly, validate({ body: registerUserSchema }), userController.register);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', authenticate, adminOnly, validate({ query: userQuerySchema }), userController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', authenticate, adminOnly, validate({ params: userIdParamSchema }), userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, adminOnly, validate({ params: userIdParamSchema, body: updateUserSchema }), userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, adminOnly, validate({ params: userIdParamSchema }), userController.deleteUser);

/**
 * @route   DELETE /api/users/:id/permanent
 * @desc    Permanently delete user
 * @access  Private (Admin only)
 */
router.delete('/:id/permanent', authenticate, adminOnly, validate({ params: userIdParamSchema }), userController.permanentlyDeleteUser);

export default router;
