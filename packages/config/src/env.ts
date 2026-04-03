import { z } from 'zod';

// Base schema - all services need these
const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

// Extended schema for services that need auth (BFFs, Gateway)
// Uses BETTER_AUTH_SECRET for both better-auth and JWT validation
const authEnvSchema = baseEnvSchema.extend({
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a valid URL'),
});

// Service URLs schema (for BFFs)
const bffEnvSchema = authEnvSchema.extend({
  USER_SERVICE_URL: z.string().url().default('http://localhost:3004'),
  COURSE_SERVICE_URL: z.string().url().default('http://localhost:3005'),
  ENROLLMENT_SERVICE_URL: z.string().url().default('http://localhost:3006'),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;
export type AuthEnv = z.infer<typeof authEnvSchema>;
export type BffEnv = z.infer<typeof bffEnvSchema>;

// Base environment (for core services: user-service, course-service, enrollment-service)
export function validateEnv(): BaseEnv {
  try {
    return baseEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
      throw new Error(`Environment validation failed:\n${issues}`);
    }
    throw error;
  }
}

// Auth environment (for gateway)
export function validateAuthEnv(): AuthEnv {
  try {
    return authEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
      throw new Error(`Environment validation failed:\n${issues}`);
    }
    throw error;
  }
}

// BFF environment (for admin-bff, teacher-bff, student-bff)
export function validateBffEnv(): BffEnv {
  try {
    return bffEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
      throw new Error(`Environment validation failed:\n${issues}`);
    }
    throw error;
  }
}
