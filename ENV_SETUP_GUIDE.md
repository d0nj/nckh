# Environment Files Setup Guide

## Overview

All `.env.example` files have been created for the Thai Binh University Training Platform. These files contain placeholder values that you need to fill in with your actual configuration.

## Files Created

### Root Level
- ✅ `/.env.example` - Global environment configuration

### API Gateway
- ✅ `/apps/gateway/.env.example` - Gateway service configuration

### BFF Services (Backend for Frontend)
- ✅ `/apps/admin-bff/.env.example` - Admin BFF configuration
- ✅ `/apps/teacher-bff/.env.example` - Teacher BFF configuration
- ✅ `/apps/student-bff/.env.example` - Student BFF configuration

### Core Services
- ✅ `/apps/user-service/.env.example` - User service configuration
- ✅ `/apps/course-service/.env.example` - Course service configuration
- ✅ `/apps/enrollment-service/.env.example` - Enrollment service configuration
- ✅ `/apps/certification-service/.env.example` - Certification service configuration
- ✅ `/apps/finance-service/.env.example` - Finance service configuration
- ✅ `/apps/notification-service/.env.example` - Notification service configuration

### Packages
- ✅ `/packages/database/.env.example` - Database migration configuration

## Setup Instructions

### 1. Copy Example Files

For each service, copy the `.env.example` to `.env`:

```bash
# Root
 cp .env.example .env

# Gateway
 cp apps/gateway/.env.example apps/gateway/.env

# BFF Services
 cp apps/admin-bff/.env.example apps/admin-bff/.env
 cp apps/teacher-bff/.env.example apps/teacher-bff/.env
 cp apps/student-bff/.env.example apps/student-bff/.env

# Core Services
 cp apps/user-service/.env.example apps/user-service/.env
 cp apps/course-service/.env.example apps/course-service/.env
 cp apps/enrollment-service/.env.example apps/enrollment-service/.env
 cp apps/certification-service/.env.example apps/certification-service/.env
 cp apps/finance-service/.env.example apps/finance-service/.env
 cp apps/notification-service/.env.example apps/notification-service/.env

# Database Package
 cp packages/database/.env.example packages/database/.env
```

### 2. Generate Secrets

Generate secure secrets for authentication:

```bash
# Generate Better-Auth secret
 openssl rand -base64 32

# Generate JWT secret
 openssl rand -base64 32
```

### 3. Update Configuration

Edit each `.env` file and update:

1. **Authentication Secrets**: Replace placeholder secrets with generated ones
2. **Database Credentials**: Update with your PostgreSQL credentials
3. **Service URLs**: Adjust if running services on different ports/hosts
4. **VNPay Credentials**: Add your VNPay sandbox credentials (for finance service)

### 4. Git Safety

The `.gitignore` file is already configured to:
- ✅ Ignore all `.env` files
- ✅ Ignore `.env.local` and `.env.*.local` files
- ✅ Allow `.env.example` files to be committed
- ✅ Ignore service-level `.env` files

This ensures your sensitive credentials are never committed to git.

## Common Configuration Variables

### Database (PostgreSQL)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DB_USER=username
DB_PASSWORD=password
DB_NAME=database_name
DB_PORT=5432
```

### Redis
```env
REDIS_URL=redis://localhost:6379
REDIS_PORT=6379
```

### Authentication
```env
BETTER_AUTH_SECRET=your-secret-key-min-32-characters-long
BETTER_AUTH_URL=http://localhost:8000
JWT_SECRET=your-jwt-secret-here
```

### Service Ports
```env
# Gateway
PORT=8000

# BFF Services
ADMIN_BFF_PORT=3001
TEACHER_BFF_PORT=3002
STUDENT_BFF_PORT=3003

# Core Services
USER_SERVICE_PORT=3004
COURSE_SERVICE_PORT=3005
ENROLLMENT_SERVICE_PORT=3006
CERTIFICATION_SERVICE_PORT=3007
FINANCE_SERVICE_PORT=3008
NOTIFICATION_SERVICE_PORT=3009
```

## Environment File Hierarchy

```
thai-binh-training/
├── .env.example                    # Root example (copy to .env)
├── .env                            # Root config (ignored by git)
├── .gitignore                      # Ignores all .env files
│
├── apps/
│   ├── gateway/
│   │   ├── .env.example           # Gateway example
│   │   └── .env                   # Gateway config (ignored)
│   │
│   ├── admin-bff/
│   │   ├── .env.example
│   │   └── .env
│   │
│   ├── teacher-bff/
│   │   ├── .env.example
│   │   └── .env
│   │
│   ├── student-bff/
│   │   ├── .env.example
│   │   └── .env
│   │
│   ├── user-service/
│   │   ├── .env.example
│   │   └── .env
│   │
│   ├── course-service/
│   │   ├── .env.example
│   │   └── .env
│   │
│   ├── enrollment-service/
│   │   ├── .env.example
│   │   └── .env
│   │
│   ├── certification-service/
│   │   ├── .env.example
│   │   └── .env
│   │
│   ├── finance-service/
│   │   ├── .env.example
│   │   └── .env
│   │
│   └── notification-service/
│       ├── .env.example
│       └── .env
│
└── packages/
    └── database/
        ├── .env.example
        └── .env
```

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive data
2. **Use different secrets for each environment** - Dev, staging, production
3. **Rotate secrets regularly** - Especially in production
4. **Use strong passwords** - For database and external services
5. **Restrict file permissions** - `chmod 600 .env` on Unix systems

## Docker Development

If using Docker Compose, you can use a single `.env` file at the root:

```env
# In root .env
DATABASE_URL=postgresql://thai_binh:thai_binh_dev@postgres:5432/thai_binh_training
REDIS_URL=redis://redis:6379
```

Services will inherit these values through Docker's environment system.

## Troubleshooting

### Changes not reflecting?
- Restart the service after modifying `.env`
- Ensure you're editing the `.env` file, not `.env.example`

### Missing variables?
- Check that `.env` file exists in the service directory
- Verify variable names match exactly

### Git showing .env as modified?
- Run: `git rm --cached .env` to remove from tracking
- Ensure `.env` is in `.gitignore`

---

## Summary

✅ **13 .env.example files created**
✅ **.gitignore updated to protect sensitive data**
✅ **Ready for git commit**

Your environment configuration is now safe to push to git!