import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError as CustomValidationError } from '../errors/AppError';
import { createErrorResponse } from '../errors/ErrorResponse';

/**
 * Global Error Handler Middleware
 * Catches all errors and sends standardized error responses
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    const response = createErrorResponse(
      'Validation failed',
      422,
      errors,
      err.stack,
      req.path
    );

    res.status(422).json(response);
    return;
  }

  // Handle custom ValidationError
  if (err instanceof CustomValidationError) {
    const response = createErrorResponse(
      err.message,
      err.statusCode,
      err.errors,
      err.stack,
      req.path
    );

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    const response = createErrorResponse(
      err.message,
      err.statusCode,
      undefined,
      err.stack,
      req.path
    );

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field';
      const response = createErrorResponse(
        `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        409,
        undefined,
        err.stack,
        req.path
      );

      res.status(409).json(response);
      return;
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      const response = createErrorResponse(
        'Record not found',
        404,
        undefined,
        err.stack,
        req.path
      );

      res.status(404).json(response);
      return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const response = createErrorResponse(
      'Invalid token',
      401,
      undefined,
      err.stack,
      req.path
    );

    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const response = createErrorResponse(
      'Token has expired',
      401,
      undefined,
      err.stack,
      req.path
    );

    res.status(401).json(response);
    return;
  }

  // Handle unexpected errors
  const response = createErrorResponse(
    process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error',
    500,
    undefined,
    err.stack,
    req.path
  );

  res.status(500).json(response);
};

/**
 * Not Found Error Handler
 * Catches all 404 errors for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const response = createErrorResponse(
    `Cannot ${req.method} ${req.path}`,
    404,
    undefined,
    undefined,
    req.path
  );

  res.status(404).json(response);
};

/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
