import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schemas/pg';

export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  minConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
}

// Global pool registry to prevent duplicate pools per service
const poolRegistry = new Map<string, Pool>();

/**
 * Creates a database connection pool with proper configuration
 * Reuses existing pools to prevent connection leaks
 */
export function createDatabase(config: DatabaseConfig) {
  const poolKey = config.url;
  
  // Return existing pool if available
  if (poolRegistry.has(poolKey)) {
    const existingPool = poolRegistry.get(poolKey)!;
    return drizzle(existingPool, { schema });
  }
  
  // Create new pool with optimized settings
  const pool = new Pool({
    connectionString: config.url,
    max: config.maxConnections || parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    min: config.minConnections || parseInt(process.env.DB_MIN_CONNECTIONS || '5'),
    connectionTimeoutMillis: config.connectionTimeout || parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
    idleTimeoutMillis: config.idleTimeout || parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    // Enable keepalive for long-running connections
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });
  
  // Pool event listeners for monitoring
  pool.on('connect', () => {
    console.log('[Database] New connection established');
  });
  
  pool.on('acquire', () => {
    console.log('[Database] Connection acquired from pool');
  });
  
  pool.on('remove', () => {
    console.log('[Database] Connection removed from pool');
  });
  
  pool.on('error', (err) => {
    console.error('[Database] Pool error:', err);
  });
  
  // Register pool
  poolRegistry.set(poolKey, pool);
  
  return drizzle(pool, { schema });
}

/**
 * Get pool statistics for monitoring
 */
export function getPoolStats(): Array<{
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}> {
  return Array.from(poolRegistry.values()).map(pool => ({
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  }));
}

/**
 * Gracefully close all database connections
 * Call this on application shutdown
 */
export async function closeAllConnections(): Promise<void> {
  console.log('[Database] Closing all database connections...');
  
  const closePromises = Array.from(poolRegistry.entries()).map(async ([key, pool]) => {
    try {
      await pool.end();
      console.log(`[Database] Pool closed for ${key}`);
    } catch (err) {
      console.error(`[Database] Error closing pool for ${key}:`, err);
    }
  });
  
  await Promise.all(closePromises);
  poolRegistry.clear();
  console.log('[Database] All connections closed');
}

// Export schema for use in services
export { schema };

export type Database = ReturnType<typeof createDatabase>;
export * from './schemas/pg';
