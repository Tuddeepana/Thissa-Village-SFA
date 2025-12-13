/**
 * Base Application Error
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 400 Bad Request Error
 * Used for general bad requests
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized Error
 * Used when authentication is required or has failed
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden Error
 * Used when the user doesn't have permission to access a resource
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found Error
 * Used when a requested resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict Error
 * Used when there's a conflict with the current state (e.g., duplicate entries)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 422 Unprocessable Entity Error
 * Used when the request is well-formed but contains semantic errors
 */
export class ValidationError extends AppError {
  public readonly errors: any[];

  constructor(message: string = 'Validation failed', errors: any[] = []) {
    super(message, 422);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 500 Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500, false); // Not operational - indicates a bug
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * 503 Service Unavailable Error
 * Used when a service is temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service Unavailable') {
    super(message, 503);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}
