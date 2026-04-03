import CircuitBreaker from 'opossum';

export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
}

export interface ServiceClientConfig {
  name: string;
  baseUrl: string;
  options?: CircuitBreakerOptions;
}

export interface ServiceRequest {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

export interface ServiceClient {
  get(path: string): Promise<unknown>;
  post(path: string, body: unknown): Promise<unknown>;
  put(path: string, body: unknown): Promise<unknown>;
  del(path: string): Promise<unknown>;
  patch(path: string, body: unknown): Promise<unknown>;
}

const defaultCircuitOptions: CircuitBreaker.Options = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5,
};

/**
 * Creates a circuit breaker for a service
 */
function createCircuitBreaker(
  serviceName: string,
  baseUrl: string,
  options: CircuitBreakerOptions = {}
): CircuitBreaker {
  const breaker = new CircuitBreaker(
    async ({ path, method = 'GET', body, headers = {} }: ServiceRequest) => {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`${serviceName} error: ${res.status}`);
      return res.json();
    },
    {
      ...defaultCircuitOptions,
      ...options,
      name: serviceName,
    }
  );

  // Fallback handler
  breaker.fallback(() => ({
    error: `${serviceName} unavailable`,
    fallback: true,
  }));

  // Event listeners for monitoring
  breaker.on('open', () => {
    console.warn(`[CircuitBreaker] ${serviceName} is OPEN`);
  });

  breaker.on('halfOpen', () => {
    console.info(`[CircuitBreaker] ${serviceName} is HALF_OPEN`);
  });

  breaker.on('close', () => {
    console.info(`[CircuitBreaker] ${serviceName} is CLOSED`);
  });

  return breaker;
}

/**
 * Creates a typed service client with circuit breaker
 */
export function createServiceClient(config: ServiceClientConfig): ServiceClient {
  const breaker = createCircuitBreaker(
    config.name,
    config.baseUrl,
    config.options
  );

  return {
    get: (path: string) => breaker.fire({ path, method: 'GET' }),
    post: (path: string, body: unknown) =>
      breaker.fire({ path, method: 'POST', body }),
    put: (path: string, body: unknown) =>
      breaker.fire({ path, method: 'PUT', body }),
    del: (path: string) => breaker.fire({ path, method: 'DELETE' }),
    patch: (path: string, body: unknown) =>
      breaker.fire({ path, method: 'PATCH', body }),
  };
}

/**
 * Creates multiple service clients from a configuration object
 */
export function createServiceClients<T extends Record<string, ServiceClientConfig>>(
  configs: T
): { [K in keyof T]: ServiceClient } {
  const clients = {} as { [K in keyof T]: ServiceClient };

  for (const [key, config] of Object.entries(configs)) {
    clients[key as keyof T] = createServiceClient(config);
  }

  return clients;
}

/**
 * Default service URLs for Thai Binh University platform
 */
export const defaultServiceUrls = {
  user: process.env.USER_SERVICE_URL || 'http://user-service:3004',
  course: process.env.COURSE_SERVICE_URL || 'http://course-service:3005',
  enrollment: process.env.ENROLLMENT_SERVICE_URL || 'http://enrollment-service:3006',
  finance: process.env.FINANCE_SERVICE_URL || 'http://finance-service:3008',
  certification: process.env.CERTIFICATION_SERVICE_URL || 'http://certification-service:3007',
};

/**
 * Default circuit breaker configurations for each service type
 */
export const defaultServiceConfigs = {
  user: {
    name: 'user-service',
    baseUrl: defaultServiceUrls.user,
    options: { timeout: 3000, volumeThreshold: 10 },
  },
  course: {
    name: 'course-service',
    baseUrl: defaultServiceUrls.course,
    options: { timeout: 5000, volumeThreshold: 10 },
  },
  enrollment: {
    name: 'enrollment-service',
    baseUrl: defaultServiceUrls.enrollment,
    options: { timeout: 5000, volumeThreshold: 10 },
  },
  finance: {
    name: 'finance-service',
    baseUrl: defaultServiceUrls.finance,
    options: { timeout: 10000, volumeThreshold: 5 },
  },
  certification: {
    name: 'certification-service',
    baseUrl: defaultServiceUrls.certification,
    options: { timeout: 8000, volumeThreshold: 5 },
  },
};
