import { createAccessControl } from '@thai-binh/auth';

/**
 * Admin BFF - Authentication Configuration
 * Thai Binh University Training Platform
 */

// Define RBAC permissions for university operations
export const universityStatements = {
  // Course management
  course: ['create', 'read', 'update', 'delete', 'publish', 'archive'],
  
  // Grade management
  grade: ['read', 'write', 'approve', 'export'],
  
  // Department/Faculty management
  department: ['create', 'read', 'update', 'delete', 'manage_staff'],
  
  // Certificate management
  certificate: ['issue', 'revoke', 'correct', 'verify'],
  
  // Finance operations
  finance: ['read', 'write', 'approve_refund', 'view_reports'],
  
  // User management
  user: ['create', 'read', 'update', 'ban', 'impersonate', 'assign_role'],
  
  // System administration
  admin: ['impersonate', 'delegate', 'view_logs', 'system_config'],
  
  // Enrollment management
  enrollment: ['create', 'read', 'update', 'cancel', 'transfer'],
  
  // Analytics and reporting
  analytics: ['view_dashboard', 'export_reports', 'view_statistics'],
} as const;

// Create access control with university permissions
export const universityAC = createAccessControl(universityStatements);

// Define roles for Thai Binh University
export const ownerRole = universityAC.newRole({
  course: ['create', 'read', 'update', 'delete', 'publish', 'archive'],
  grade: ['read', 'write', 'approve', 'export'],
  department: ['create', 'read', 'update', 'delete', 'manage_staff'],
  certificate: ['issue', 'revoke', 'correct', 'verify'],
  finance: ['read', 'write', 'approve_refund', 'view_reports'],
  user: ['create', 'read', 'update', 'ban', 'impersonate', 'assign_role'],
  admin: ['impersonate', 'delegate', 'view_logs', 'system_config'],
  enrollment: ['create', 'read', 'update', 'cancel', 'transfer'],
  analytics: ['view_dashboard', 'export_reports', 'view_statistics'],
});

export const adminRole = universityAC.newRole({
  course: ['create', 'read', 'update', 'delete', 'publish'],
  grade: ['read', 'write', 'export'],
  department: ['read', 'update', 'manage_staff'],
  certificate: ['issue', 'verify'],
  finance: ['read', 'write', 'view_reports'],
  user: ['create', 'read', 'update', 'assign_role'],
  admin: ['impersonate', 'view_logs'],
  enrollment: ['create', 'read', 'update', 'cancel'],
  analytics: ['view_dashboard', 'export_reports'],
});

export const lecturerRole = universityAC.newRole({
  course: ['read', 'update'],
  grade: ['read', 'write'],
  department: ['read'],
  certificate: ['verify'],
  enrollment: ['read'],
  analytics: ['view_statistics'],
});

export const studentRole = universityAC.newRole({
  course: ['read'],
  grade: ['read'],
  enrollment: ['create', 'read'],
});

/**
 * Check if user can create organization (department)
 * Only super admins can create departments
 */
export function canCreateOrganization(user: { role: string }): boolean {
  return user.role === 'super-admin';
}

/**
 * Get role definition by name
 */
export function getRoleByName(roleName: string) {
  const roles: Record<string, any> = {
    owner: ownerRole,
    admin: adminRole,
    lecturer: lecturerRole,
    student: studentRole,
  };
  return roles[roleName];
}

/**
 * Admin BFF specific auth configuration
 */
export const adminBffAuthConfig = {
  statements: universityStatements,
  roles: {
    owner: ownerRole,
    admin: adminRole,
    lecturer: lecturerRole,
    student: studentRole,
  },
  canCreateOrganization,
};
