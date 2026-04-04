# Scripts

Startup and management scripts for Thai Binh University Training Platform.

## Available Scripts

### Database Services (Scoop/Native)

For running PostgreSQL and Redis directly on Windows without Docker:

**Setup Everything (Start + Initialize):**
```powershell
.\scripts\setup-databases.ps1          # Start and initialize databases
.\scripts\setup-databases.ps1 -SkipInit # Start only, skip initialization
```

**Start Database Services:**
```powershell
.\scripts\start-databases.ps1
```

**Initialize Database (create schemas, run migrations):**
```powershell
.\scripts\init-database.ps1
```

**Stop Database Services:**
```powershell
.\scripts\stop-databases.ps1
.\scripts\stop-databases.ps1 -Force    # Force kill processes
```

**Check Database Status:**
```powershell
.\scripts\status-databases.ps1
```

**Prerequisites for Database Scripts:**
```powershell
# Install Scoop (if not already installed)
irm get.scoop.sh | iex

# Install PostgreSQL and Redis via Scoop
scoop install postgresql redis
```

### Application Services

**PowerShell (Recommended for Windows):**
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

### Stop Services

**PowerShell:**
```powershell
.\scripts\stop.ps1
```

**Bash:**
```bash
./scripts/stop.sh
```

**Manual:**
Press `Ctrl+C` in the terminal running the start script, or close the service windows.

### Check Status

**PowerShell:**
```powershell
.\scripts\status.ps1
```

**Bash:**
```bash
./scripts/status.sh
```

## What the Scripts Do

1. Check if Bun is installed
2. Install dependencies if needed
3. Build shared packages if needed
4. Start all 7 services:
   - Gateway (port 8000)
   - User Service (port 3004)
   - Course Service (port 3005)
   - Enrollment Service (port 3006)
   - Admin BFF (port 3001)
   - Teacher BFF (port 3002)
   - Student BFF (port 3003)

## Service URLs

| Service | URL | Via Gateway |
|---------|-----|-------------|
| API Gateway | http://localhost:8000 | - |
| Admin BFF | http://localhost:3001 | /api/admin/* |
| Teacher BFF | http://localhost:3002 | /api/teacher/* |
| Student BFF | http://localhost:3003 | /api/student/* |
| User Service | http://localhost:3004 | (internal) |
| Course Service | http://localhost:3005 | (internal) |
| Enrollment Service | http://localhost:3006 | (internal) |

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

**Windows (PowerShell):**
```powershell
# Find process using port 8000
Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess
# Stop the process
Stop-Process -Id <PID>
```

**macOS/Linux:**
```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9
```

Or simply run the stop script:
```powershell
.\scripts\stop.ps1    # Windows
./scripts/stop.sh      # macOS/Linux
```

### Services Not Starting

1. Check that Bun is installed: `bun --version`
2. Check that all dependencies are installed: `bun install`
3. Check the individual service logs in their respective windows
4. Ensure required environment variables are set in `.env` files

## Manual Start

If you prefer to start services manually:

```bash
# Terminal 1: Gateway
cd apps/gateway && bun run dev

# Terminal 2: Core Services
cd apps/user-service && bun run dev
cd apps/course-service && bun run dev
cd apps/enrollment-service && bun run dev

# Terminal 3: BFF Services
cd apps/admin-bff && bun run dev
cd apps/teacher-bff && bun run dev
cd apps/student-bff && bun run dev
```
