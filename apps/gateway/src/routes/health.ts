import type { Context } from 'hono';

interface ServiceConfig {
  url: string;
  rateLimit: number;
}

async function checkServiceHealth(name: string, url: string): Promise<{
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    if (name === 'gateway') {
      return { name, status: 'healthy', responseTime: 0 };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return { name, status: 'healthy', responseTime };
    } else {
      return {
        name,
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function createHealthCheck(services: Record<string, ServiceConfig>) {
  return async (c: Context) => {
    const checks = await Promise.all([
      checkServiceHealth('gateway', 'self'),
      checkServiceHealth('admin', services.admin.url),
      checkServiceHealth('teacher', services.teacher.url),
      checkServiceHealth('student', services.student.url),
    ]);

    const allHealthy = checks.every(check => check.status === 'healthy');

    return c.json({
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: checks.reduce((acc, check) => {
        acc[check.name] = {
          status: check.status,
          responseTime: check.responseTime,
          ...(check.error && { error: check.error }),
        };
        return acc;
      }, {} as Record<string, any>),
    }, allHealthy ? 200 : 503);
  };
}
