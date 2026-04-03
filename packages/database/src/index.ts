// ============================================
// Thai Binh University - Database Package
// Unified PostgreSQL Schema Exports
// ============================================

// Main schema exports
export * from './schemas';

// Explicit pg schema exports for convenience
export * as authSchema from './schemas/pg/auth';
export * as academicSchema from './schemas/pg/academic';
export * as studentSchema from './schemas/pg/student';
export * as certificationSchema from './schemas/pg/certification';
export * as financeSchema from './schemas/pg/finance';

// Database client and utilities
export { createDatabase, type Database } from './client';
export { createDatabase as createPgDatabase, type Database as PgDatabase } from './pg';

// Re-export pg module for services using the new schemas
export * from './pg';
