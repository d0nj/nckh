import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin as adminPlugin, jwt, organization } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';

/**
 * Minimal database interface required by better-auth
 * This avoids the circular dependency on @thai-binh/database
 */
export interface Database {
  query: Record<string, any>;
  insert: (table: any) => any;
  update: (table: any) => any;
  delete: (table: any) => any;
  select: (...fields: any[]) => any;
}

export interface AuthConfig {
  db: Database;
  secret: string;
  baseURL: string;
  /**
   * Custom permission statements for your application
   * Should be defined in your BFF, not here
   */
  statements?: Record<string, string[]>;
  /**
   * Custom roles for your application
   * Should be defined in your BFF, not here
   */
  roles?: Record<string, any>;
  /**
   * Custom callback to determine if user can create organization
   * Should be defined in your BFF, not here
   */
  canCreateOrganization?: (user: any) => boolean | Promise<boolean>;
}

/**
 * Default statements - minimal set
 * Override these in your BFF with your specific permissions
 */
const defaultStatements = {
  user: ['create', 'read', 'update', 'delete'],
  session: ['create', 'read', 'delete'],
} as const;

/**
 * Create auth instance with customizable permissions
 * Business logic should be defined in your BFF layer
 */
export function createAuth(config: AuthConfig) {
  // Use provided statements or defaults
  const statements = config.statements || defaultStatements;
  const ac = createAccessControl(statements);

  // Use provided roles or empty (define in BFF)
  const roles = config.roles || {};

  return betterAuth({
    database: drizzleAdapter(config.db, {
      provider: 'pg',
    }),
    secret: config.secret,
    baseURL: config.baseURL,
    plugins: [
      organization({
        ac,
        roles: roles as any,
        allowUserToCreateOrganization: async (user) => {
          // Delegate to custom callback if provided, otherwise allow admins
          if (config.canCreateOrganization) {
            return config.canCreateOrganization(user);
          }
          return user.role === 'admin' || user.role === 'super-admin';
        },
      }),
      adminPlugin({
        defaultRole: 'user',
        adminRoles: ['admin', 'super-admin'],
        impersonationSessionDuration: 60 * 60,
      }),
      jwt({
        jwt: {
          definePayload: ({ user }) => ({
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
          }),
          issuer: config.baseURL,
          audience: config.baseURL,
          expirationTime: '1h',
        },
        jwks: {
          keyPairConfig: { alg: 'EdDSA', crv: 'Ed25519' },
          rotationInterval: 60 * 60 * 24 * 30,
          gracePeriod: 60 * 60 * 24 * 7,
        },
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 300,
        strategy: 'compact',
      },
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: true,
          defaultValue: 'user',
          input: false,
        },
        phone: { type: 'string', required: false },
        department: { type: 'string', required: false },
        studentId: { type: 'string', required: false },
        employeeId: { type: 'string', required: false },
        avatar: { type: 'string', required: false },
      },
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            console.log(`[Auth] New user created: ${user.email}`);
          },
        },
      },
    },
  });
}

// Re-export types for convenience
export type Auth = ReturnType<typeof createAuth>;
export type Session = Awaited<ReturnType<Auth['api']['getSession']>>;

// Re-export better-auth utilities for BFF use
export { createAccessControl, betterAuth, drizzleAdapter };
export { adminPlugin, jwt, organization };
