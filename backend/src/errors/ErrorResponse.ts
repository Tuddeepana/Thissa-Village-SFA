/**
 * Standard API Error Response Interface
 */
export interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  errors?: any[];
  stack?: string;
  timestamp: string;
  path?: string;
}

/**
 * Standard API Success Response Interface
 */
export interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
  count?: number;
  timestamp: string;
}

/**
 * Pagination Response Interface
 */
export interface PaginatedResponse<T = any> {
  success: true;
  message?: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

/**
 * Creates a standardized success response
 */
export const createSuccessResponse = <T = any>(
  data?: T,
  message?: string,
  count?: number
): SuccessResponse<T> => {
  return {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
    ...(count !== undefined && { count }),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Creates a standardized error response
 */
export const createErrorResponse = (
  message: string,
  statusCode: number,
  errors?: any[],
  stack?: string,
  path?: string
): ErrorResponse => {
  return {
    success: false,
    message,
    statusCode,
    ...(errors && { errors }),
    ...(stack && process.env.NODE_ENV === 'development' && { stack }),
    ...(path && { path }),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Creates a standardized paginated response
 */
export const createPaginatedResponse = <T = any>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): PaginatedResponse<T> => {
  return {
    success: true,
    ...(message && { message }),
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  };
};
