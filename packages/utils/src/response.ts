/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  timestamp: string;
}

/**
 * Create success response
 */
export function success<T>(data: T, meta?: Partial<ResponseMeta>): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Create error response
 */
export function error(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Common validation error response
 */
export function validationError(errors: Record<string, string>): ApiResponse {
  return error("VALIDATION_ERROR", "Request validation failed", { errors });
}

/**
 * Common not found error response
 */
export function notFoundError(resource: string, id?: string): ApiResponse {
  return error(
    "NOT_FOUND",
    `${resource}${id ? ` with id "${id}"` : ""} not found`
  );
}

/**
 * Common unauthorized error response
 */
export function unauthorizedError(message = "Unauthorized"): ApiResponse {
  return error("UNAUTHORIZED", message);
}

/**
 * Common forbidden error response
 */
export function forbiddenError(message = "Forbidden"): ApiResponse {
  return error("FORBIDDEN", message);
}

/**
 * Common pagination meta
 */
export function paginationMeta(
  page: number,
  limit: number,
  total: number
): ResponseMeta {
  return {
    page,
    limit,
    total,
    timestamp: new Date().toISOString(),
  };
}

// Backward compatibility aliases
export { success as successResponse };
export { error as errorResponse };
export { paginationMeta as paginatedResponse };
