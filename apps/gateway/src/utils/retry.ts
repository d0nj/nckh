/**
 * Retry utility with exponential backoff and jitter
 */
export interface RetryConfig {
  maxRetries?: number;           // Maximum number of retries (default: 3)
  baseDelay?: number;           // Base delay in ms (default: 1000)
  maxDelay?: number;            // Maximum delay in ms (default: 30000)
  timeout?: number;             // Request timeout in ms (default: 5000)
  retryableErrors?: (error: any) => boolean;  // Custom error filter
}

const defaultRetryableErrors = (error: any): boolean => {
  // Retry on network errors and specific HTTP status codes
  if (!error) return false;
  
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EPIPE'];
  
  if (error.status && retryableStatuses.includes(error.status)) return true;
  if (error.code && retryableCodes.includes(error.code)) return true;
  if (error.name === 'AbortError') return true;
  
  return false;
};

/**
 * Calculate delay with exponential backoff and full jitter
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  // Exponential backoff: 2^attempt * baseDelay
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(2, attempt),
    maxDelay
  );
  
  // Add full jitter (random value between 0 and exponentialDelay)
  return Math.floor(exponentialDelay * Math.random());
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    retryableErrors = defaultRetryableErrors,
  } = config;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if we've exhausted retries or error is not retryable
      if (attempt === maxRetries || !retryableErrors(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = calculateDelay(attempt, baseDelay, maxDelay);
      
      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Fetch with timeout and retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { timeout?: number; retries?: number } = {}
): Promise<Response> {
  const { timeout = 5000, retries = 3, ...fetchOptions } = options;
  
  return withRetry(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });
        
        // Throw on error status codes to trigger retry
        if (!response.ok && response.status >= 500) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          (error as any).status = response.status;
          throw error;
        }
        
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    { maxRetries: retries, timeout }
  );
}