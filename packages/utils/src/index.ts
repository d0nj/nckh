// ============================================
// Utils Package - Explicit Exports
// Thai Binh University Training Platform
// ============================================

// HTTP utilities
export {
  type ApiResponse,
  type ApiError,
  type ResponseMeta,
  success,
  success as successResponse,
  error,
  error as errorResponse,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
  paginationMeta,
  paginationMeta as paginatedResponse,
} from './response';

// HTTP client utilities
export {
  type HttpClientConfig,
  type HttpRequestOptions,
  createHttpClient,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
} from './http';

// Service base utilities
export {
  type Database,
  type ServiceConfig,
  type ServiceContext,
  type HonoService,
  createBaseService,
  addHealthCheck,
  addErrorHandlers,
} from './service';

// Circuit breaker utilities
export {
  type CircuitBreakerOptions,
  type ServiceClientConfig,
  type ServiceRequest,
  type ServiceClient,
  createServiceClient,
  createServiceClients,
  defaultServiceUrls,
  defaultServiceConfigs,
} from './circuit-breaker';

// Authentication utilities
export {
  type ServiceAuthConfig,
  createServiceAuth,
  getUserId,
  getUserRole,
  getOrganizationId,
  requireRole,
} from './auth';
