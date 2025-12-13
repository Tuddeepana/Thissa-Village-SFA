import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { Role } from '@prisma/client';

/**
 * Role-Based Access Control Middleware
 * Checks if the authenticated user has the required role(s)
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource',
          requiredRoles: allowedRoles,
          userRole: req.user.role,
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
};

/**
 * Admin-only middleware
 */
export const adminOnly = authorize(Role.ADMIN);

/**
 * Admin or Cashier middleware
 */
export const adminOrCashier = authorize(Role.ADMIN, Role.CASHIER);
