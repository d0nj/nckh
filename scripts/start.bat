@echo off
chcp 65001 >nul

REM Thai Binh University Training Platform - Startup Script (Windows)
REM Usage: start.bat [dev|prod]

echo 🚀 Thai Binh University Training Platform
echo ==========================================
echo.

set MODE=%1
if "%MODE%"=="" set MODE=dev

REM Check if bun is installed
bun --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Bun is not installed. Please install Bun first:
    echo    powershell -c "irm bun.sh/install.ps1|iex"
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    bun install
)

REM Build packages if needed
if not exist "packages\database\node_modules" (
    echo 🔨 Building packages...
    bun run build --filter=@thai-binh/database
    bun run build --filter=@thai-binh/types
    bun run build --filter=@thai-binh/utils
    bun run build --filter=@thai-binh/config
    bun run build --filter=@thai-binh/auth
)

echo 🌟 Starting services in %MODE% mode...
echo.

if "%MODE%"=="dev" (
    echo Starting services in development mode...
    echo.
    
    start "Gateway (8000)" cmd /c "cd apps\gateway && bun run dev"
    timeout /t 2 >nul
    
    start "User Service (3004)" cmd /c "cd apps\user-service && bun run dev"
    timeout /t 1 >nul
    
    start "Course Service (3005)" cmd /c "cd apps\course-service && bun run dev"
    timeout /t 1 >nul
    
    start "Enrollment Service (3006)" cmd /c "cd apps\enrollment-service && bun run dev"
    timeout /t 1 >nul
    
    start "Admin BFF (3001)" cmd /c "cd apps\admin-bff && bun run dev"
    timeout /t 1 >nul
    
    start "Teacher BFF (3002)" cmd /c "cd apps\teacher-bff && bun run dev"
    timeout /t 1 >nul
    
    start "Student BFF (3003)" cmd /c "cd apps\student-bff && bun run dev"
    
    echo.
    echo ✅ All services started in separate windows!
    echo.
    echo 📍 API Gateway: http://localhost:8000
    echo    - /api/admin/*   → Admin BFF (port 3001)
    echo    - /api/teacher/* → Teacher BFF (port 3002)
    echo    - /api/student/* → Student BFF (port 3003)
    echo.
    echo 🛑 Close the service windows to stop
) else (
    echo Starting services in production mode...
    
    bun run build
    
    start "Gateway" cmd /c "cd apps\gateway && bun run start"
    start "User Service" cmd /c "cd apps\user-service && bun run start"
    start "Course Service" cmd /c "cd apps\course-service && bun run start"
    start "Enrollment Service" cmd /c "cd apps\enrollment-service && bun run start"
    start "Admin BFF" cmd /c "cd apps\admin-bff && bun run start"
    start "Teacher BFF" cmd /c "cd apps\teacher-bff && bun run start"
    start "Student BFF" cmd /c "cd apps\student-bff && bun run start"
    
    echo.
    echo ✅ Production services started!
)
