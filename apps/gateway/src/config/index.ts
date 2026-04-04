export const PORT = process.env.PORT || 8000;
export const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

export const SERVICES = {
  admin: {
    url: process.env.ADMIN_BFF_URL || 'http://localhost:3001',
    rateLimit: parseInt(process.env.ADMIN_RATE_LIMIT || '200'),
  },
  teacher: {
    url: process.env.TEACHER_BFF_URL || 'http://localhost:3002',
    rateLimit: parseInt(process.env.TEACHER_RATE_LIMIT || '300'),
  },
  student: {
    url: process.env.STUDENT_BFF_URL || 'http://localhost:3003',
    rateLimit: parseInt(process.env.STUDENT_RATE_LIMIT || '500'),
  },
};

export const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
