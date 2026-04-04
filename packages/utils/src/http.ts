import type { Context } from 'hono';
import type { ApiResponse, PaginatedResponse } from '@thai-binh/types';

// HTTP Client types
export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

// HTTP Client class
class HttpClient {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = { timeout: 30000, ...config };
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    options?: HttpRequestOptions
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options?.timeout || this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

// Factory function
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}

// Convenience functions
export function httpGet<T>(url: string, options?: HttpRequestOptions): Promise<T> {
  const client = createHttpClient({ baseURL: '', ...options });
  return client.get(url);
}

export function httpPost<T>(url: string, data: unknown, options?: HttpRequestOptions): Promise<T> {
  const client = createHttpClient({ baseURL: '', ...options });
  return client.post(url, data);
}

export function httpPut<T>(url: string, data: unknown, options?: HttpRequestOptions): Promise<T> {
  const client = createHttpClient({ baseURL: '', ...options });
  return client.put(url, data);
}

export function httpDelete<T>(url: string, options?: HttpRequestOptions): Promise<T> {
  const client = createHttpClient({ baseURL: '', ...options });
  return client.delete(url);
}

// Response helpers
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
