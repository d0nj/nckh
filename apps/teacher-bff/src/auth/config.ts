import { createAccessControl } from '@thai-binh/auth';

/**
 * Teacher BFF - Authentication Configuration
 * Thai Binh University Training Platform
 */

// Define RBAC permissions for teacher operations
export const teacherStatements = {
  // Course management (teacher's own courses)
  course: ['read', 'update', 'manage_content'],
  
  // Grade management
  grade: ['read', 'write', 'submit'],
  
  // Assignment management
  assignment: ['create', 'read', 'update', 'delete', 'grade'],
  
  // Student management (in their courses)
  student: ['read', 'view_progress', 'contact'],
  
  // Enrollment management
  enrollment: ['read', 'approve', 'reject'],
  
  // Certificate viewing
  certificate: ['view', 'verify'],
  
  // Analytics
  analytics: ['view_course_stats', 'view_student_performance'],
} as const;

// Create access control
export const teacherAC = createAccessControl(teacherStatements);

// Define teacher roles
export const primaryTeacherRole = teacherAC.newRole({
  course: ['read', 'update', 'manage_content'],
  grade: ['read', 'write', 'submit'],
  assignment: ['create', 'read', 'update', 'delete', 'grade'],
  student: ['read', 'view_progress', 'contact'],
  enrollment: ['read', 'approve', 'reject'],
  certificate: ['view', 'verify'],
  analytics: ['view_course_stats', 'view_student_performance'],
});

export const assistantTeacherRole = teacherAC.newRole({
  course: ['read', 'manage_content'],
  grade: ['read', 'write'],
  assignment: ['create', 'read', 'grade'],
  student: ['read', 'view_progress'],
  enrollment: ['read'],
  analytics: ['view_course_stats'],
});

export const guestTeacherRole = teacherAC.newRole({
  course: ['read'],
  assignment: ['read', 'grade'],
  student: ['read'],
});

/**
 * Teacher BFF specific auth configuration
 */
export const teacherBffAuthConfig = {
  statements: teacherStatements,
  roles: {
    primary: primaryTeacherRole,
    assistant: assistantTeacherRole,
    guest: guestTeacherRole,
  },
};
