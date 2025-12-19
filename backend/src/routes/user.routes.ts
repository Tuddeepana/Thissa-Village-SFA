import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/rbac.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Public routes
/**
 * @route   POST /api/users/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', asyncHandler(userController.login.bind(userController)));

// Protected routes - Require authentication
/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private (Authenticated users)
 */
router.get('/me', authenticate, asyncHandler(userController.getProfile.bind(userController)));

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private (Authenticated users)
 */
router.put('/me', authenticate, asyncHandler(userController.updateProfile.bind(userController)));

// Admin only routes
/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Private (Admin only)
 */
// NOTE: Changed to public registration. Remove authenticate/adminOnly to allow
// users to self-register. If you'd rather keep registration restricted to admins,
// revert this change.
router.post('/register', asyncHandler(userController.register.bind(userController)));

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get(
  '/',
  authenticate,
  adminOnly,
  asyncHandler(userController.getUsers.bind(userController))
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get(
  '/:id',
  authenticate,
  adminOnly,
  asyncHandler(userController.getUserById.bind(userController))
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  adminOnly,
  asyncHandler(userController.updateUser.bind(userController))
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  asyncHandler(userController.deleteUser.bind(userController))
);

/**
 * @route   DELETE /api/users/:id/permanent
 * @desc    Permanently delete user
 * @access  Private (Admin only)
 */
router.delete(
  '/:id/permanent',
  authenticate,
  adminOnly,
  asyncHandler(userController.permanentlyDeleteUser.bind(userController))
);

export default router;
