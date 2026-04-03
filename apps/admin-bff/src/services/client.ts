import {
  createServiceClients,
  defaultServiceConfigs,
  type ServiceClient,
} from '@thai-binh/utils/circuit-breaker';

/**
 * Creates service clients for Admin BFF
 * Uses the shared circuit breaker factory to eliminate code duplication
 */
export function createServiceClients() {
  return createServiceClients({
    user: defaultServiceConfigs.user,
    course: defaultServiceConfigs.course,
    enrollment: defaultServiceConfigs.enrollment,
  });
}

export type ServiceClients = ReturnType<typeof createServiceClients>;
