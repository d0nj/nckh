# Thai Binh University - Short-term Training Platform

A microservices-based training platform built for Thai Binh University using Bun, Turborepo, PostgreSQL, and Redis.

## Architecture

```
┌─────────────────┐
│  Bun Gateway    │  ← API Gateway (Port 8000)
│   (Hono)        │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    │         │            │            │
┌───▼───┐ ┌──▼────┐  ┌────▼────┐ ┌────▼────┐
│ Admin │ │Teacher│  │ Student │ │  Auth   │  ← BFF Layer
│  BFF  │ │  BFF  │  │   BFF   │ │ Service │
│ (3001)│ │(3002) │  │  (3003) │ │         │
└───┬───┘ └──┬────┘  └────┬────┘ └────┬────┘
    │        │            │           │
    └────────┴─────┬──────┴───────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    ┌────▼────┐ ┌──────────┐ ┌▼──────────┐  ← Core Microservices
    │  User   │ │ Course   │ │Enrollment │
    │ Service │ │ Service  │ │ Service   │
    │ (3004)  │ │ (3005)   │ │  (3006)   │
    └────┬────┘ └────┬─────┘ └─────┬─────┘
         │           │             │
         └───────────┴─────────────┘
                         │
                  ┌──────▼──────┐
                   │  PostgreSQL │  ← Database (Port 5432)
                   └─────────────┘
                          │
                   ┌──────▼──────┐
                   │    Redis    │  ← Cache & Message Queue (Port 6379)
                   └─────────────┘
```

## Tech Stack

- **Runtime**: Bun 1.2.2+
- **Monorepo**: Turborepo 2.4.4
- **API Gateway**: Custom Bun Gateway (Hono)
- **Backend Framework**: Hono 4.12.10
- **Database**: PostgreSQL 16 + Drizzle ORM 0.45.2
- **Cache/Queue**: Redis 7 + BullMQ
- **Authentication**: better-auth 1.5.6
- **Circuit Breaker**: opossum 9.0.0
- **Validation**: Zod 3.24.2

## Project Structure

```
thai-binh-training/
├── apps/
│   ├── gateway/              # Bun API Gateway (Hono)
│   ├── admin-bff/            # Admin Backend for Frontend
│   ├── teacher-bff/          # Teacher BFF
│   ├── student-bff/          # Student BFF
│   ├── user-service/         # User management microservice
│   ├── course-service/       # Course management microservice
│   └── enrollment-service/   # Enrollment & progress microservice
├── packages/
│   ├── database/             # Drizzle schemas & migrations
│   ├── auth/                 # better-auth configuration
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Shared utilities
│   └── config/               # Environment configuration
├── scripts/                  # Startup & management scripts
│   ├── setup.ps1             # Setup script (Windows)
│   ├── setup.sh              # Setup script (macOS/Linux)
│   ├── start.ps1             # Start script (Windows)
│   ├── start.sh              # Start script (macOS/Linux)
│   ├── start.bat             # Start script (Windows CMD)
│   ├── stop.ps1              # Stop script (Windows)
│   ├── stop.sh               # Stop script (macOS/Linux)
│   ├── status.ps1            # Status check (Windows)
│   └── status.sh             # Status check (macOS/Linux)
└── package.json              # Root workspace configuration
```

## Quick Start

### Prerequisites

- Bun 1.2.2 or higher

### Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Clone and install dependencies
bun install

# Run setup script to generate .env files with secure secrets
# PowerShell (Windows):
.\scripts\setup.ps1

# Bash (macOS/Linux):
./scripts/setup.sh

# Or manually copy and edit:
cp .env.example .env
# Edit .env and update BETTER_AUTH_SECRET (used for both auth and JWT)
```

### Development

#### Option 1: One-Command Start (Recommended)

**PowerShell (Windows - Recommended):**
```powershell
.\scripts\start.ps1          # Development mode
.\scripts\start.ps1 -Mode prod  # Production mode
```

**Bash (macOS/Linux):**
```bash
./scripts/start.sh           # Development mode
./scripts/start.sh prod      # Production mode
```

**Command Prompt (Windows):**
```cmd
scripts\start.bat            # Development mode
scripts\start.bat prod       # Production mode
```

**Stop all services:**
```powershell
.\scripts\stop.ps1    # Windows PowerShell
./scripts/stop.sh      # macOS/Linux
```

#### Option 2: Manual Start

```bash
# Terminal 1: Start Gateway
cd apps/gateway && bun run dev

# Terminal 2: Start Core Services
bun run dev --filter=@thai-binh/user-service
bun run dev --filter=@thai-binh/course-service
bun run dev --filter=@thai-binh/enrollment-service

# Terminal 3: Start BFF Services
bun run dev --filter=@thai-binh/admin-bff
bun run dev --filter=@thai-binh/teacher-bff
bun run dev --filter=@thai-binh/student-bff
```

### Access Points

| Service         | URL                     | Description                  |
| --------------- | ----------------------- | ---------------------------- |
| **API Gateway**     | http://localhost:8000   | Main entry point             |
| **Admin BFF**       | http://localhost:3001   | Admin API (via gateway)      |
| **Teacher BFF**     | http://localhost:3002   | Teacher API (via gateway)    |
| **Student BFF**     | http://localhost:3003   | Student API (via gateway)    |
| **User Service**    | http://localhost:3004   | User management (internal)   |
| **Course Service**  | http://localhost:3005   | Course management (internal) |
| **Enrollment Svc**  | http://localhost:3006   | Enrollment (internal)        |

### API Endpoints

All API requests go through the Bun Gateway at `http://localhost:8000`

#### Authentication

```bash
# Sign in
POST http://localhost:8000/api/auth/sign-in/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

#### Admin Routes (`/api/admin/*`)

- `GET /dashboard/stats` - Platform statistics
- `GET /users` - List all users
- `GET /analytics/enrollment-trends` - Enrollment analytics

#### Teacher Routes (`/api/teacher/*`)

- `GET /courses/my-courses` - Get teacher's courses
- `POST /courses` - Create new course
- `GET /assignments/course/:id` - Get course assignments

#### Student Routes (`/api/student/*`)

- `GET /courses/available` - Browse available courses
- `GET /courses/enrolled` - Get enrolled courses
- `GET /dashboard` - Student dashboard

### Production

```bash
# Build all services
bun run build

# Start in production mode
./scripts/start.sh prod       # macOS/Linux
scripts\start.bat prod        # Windows CMD
.\scripts\start.ps1 -Mode prod  # PowerShell
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | libsql database URL | `file:./data/local.db` |
| `DATABASE_AUTH_TOKEN` | Turso auth token | - |
| `BETTER_AUTH_SECRET` | Auth encryption secret | - |
| `BETTER_AUTH_URL` | Auth service URL | `http://localhost:8000` |
| `JWT_SECRET` | JWT signing secret | - |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

## Database Migrations

```bash
# Generate migrations
bun run db:generate

# Push migrations
bun run db:push

# Run migrations
bun run db:migrate
```

## Testing

```bash
# Run all tests
bun run test

# Run specific service tests
cd apps/user-service && bun run test
```

## Architecture Details

### Bun API Gateway

The custom gateway provides:
- **JWT Authentication**: Validates Bearer tokens
- **Rate Limiting**: Per-role limits (admin: 200/min, teacher: 300/min, student: 500/min)
- **Path Routing**: `/api/admin/*`, `/api/teacher/*`, `/api/student/*`
- **CORS**: Configured for frontend origins
- **Headers**: Adds `X-Request-ID` and `X-Gateway-Version`

### Backend for Frontend (BFF) Pattern

Each BFF service:
- Aggregates data from core microservices
- Implements circuit breaker pattern (opossum)
- Handles role-specific logic
- Communicates via HTTP with core services

### Core Microservices

- **user-service**: User management, profiles
- **course-service**: Courses, modules, lessons
- **enrollment-service**: Enrollments, progress tracking

### Authentication

Using better-auth with:
- Email/password authentication
- JWT tokens with role-based claims
- Session management
- Admin plugin for role management

## License

MIT License - Thai Binh University
