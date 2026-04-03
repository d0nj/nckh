import type { Context } from 'hono';
import type { ApiResponse, PaginatedResponse } from '@thai-binh/types';

export function successResponse<T>(c: Context, data: T, status = 200) {
  return c.json<ApiResponse<T>>({ success: true, data }, status);
}

export function errorResponse(
  c: Context,
  code: string,
  message: string,
  status = 500,
  details?: Record<string, unknown>
) {
  return c.json<ApiResponse<never>>(
    { success: false, error: { code, message, details } },
    status
  );
}

export function paginatedResponse<T>(
  c: Context,
  items: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return c.json<PaginatedResponse<T>>({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
