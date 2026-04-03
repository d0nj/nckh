import { createAccessControl } from '@thai-binh/auth';

/**
 * Student BFF - Authentication Configuration
 * Thai Binh University Training Platform
 */

// Define RBAC permissions for student operations
export const studentStatements = {
  // Course operations
  course: ['browse', 'read', 'enroll', 'view_content'],
  
  // Progress tracking
  progress: ['read', 'update', 'track_time'],
  
  // Assignment operations
  assignment: ['read', 'submit', 'view_feedback'],
  
  // Grade viewing
  grade: ['read', 'view_transcript'],
  
  // Enrollment management
  enrollment: ['create', 'read', 'drop', 'transfer'],
  
  // Certificate operations
  certificate: ['view', 'download', 'share'],
  
  // Payment operations
  payment: ['view_invoice', 'make_payment', 'view_history'],
  
  // Profile management
  profile: ['read', 'update'],
} as const;

// Create access control
export const studentAC = createAccessControl(studentStatements);

// Define student roles
export const activeStudentRole = studentAC.newRole({
  course: ['browse', 'read', 'enroll', 'view_content'],
  progress: ['read', 'update', 'track_time'],
  assignment: ['read', 'submit', 'view_feedback'],
  grade: ['read', 'view_transcript'],
  enrollment: ['create', 'read', 'drop'],
  certificate: ['view', 'download', 'share'],
  payment: ['view_invoice', 'make_payment', 'view_history'],
  profile: ['read', 'update'],
});

export const alumniRole = studentAC.newRole({
  course: ['browse', 'read'],
  grade: ['read', 'view_transcript'],
  certificate: ['view', 'download', 'share'],
  profile: ['read', 'update'],
});

export const suspendedStudentRole = studentAC.newRole({
  course: ['browse'],
  profile: ['read'],
});

/**
 * Student BFF specific auth configuration
 */
export const studentBffAuthConfig = {
  statements: studentStatements,
  roles: {
    active: activeStudentRole,
    alumni: alumniRole,
    suspended: suspendedStudentRole,
  },
};
