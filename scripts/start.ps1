<#
.SYNOPSIS
    Thai Binh University Training Platform - Startup Script (PowerShell)

.DESCRIPTION
    Starts all microservices for the Thai Binh University Training Platform.
    Supports both development and production modes.

.PARAMETER Mode
    The mode to start services in: 'dev' (default) or 'prod'

.EXAMPLE
    .\scripts\start.ps1
    Starts all services in development mode

.EXAMPLE
    .\scripts\start.ps1 -Mode prod
    Starts all services in production mode

.NOTES
    Requires Bun to be installed: https://bun.sh
#>

param(
    [Parameter(Position=0)]
    [ValidateSet('dev', 'prod')]
    [string]$Mode = 'dev'
)

# Get script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "Thai Binh University Training Platform" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if bun is installed
try {
    $null = Get-Command bun -ErrorAction Stop
} catch {
    Write-Host "Bun is not installed. Please install Bun first:" -ForegroundColor Red
    Write-Host "   powershell -c `"irm bun.sh/install.ps1|iex`""
    exit 1
}

$bunVersion = (bun --version) 2>$null
Write-Host "Bun version: $bunVersion" -ForegroundColor Green

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    bun install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Build packages if needed
if (-not (Test-Path "packages\database\node_modules")) {
    Write-Host "Building packages..." -ForegroundColor Yellow
    bun run build --filter=@thai-binh/database
    bun run build --filter=@thai-binh/types
    bun run build --filter=@thai-binh/utils
    bun run build --filter=@thai-binh/config
    bun run build --filter=@thai-binh/auth
}

Write-Host "Starting services in $Mode mode..." -ForegroundColor Cyan
Write-Host ""

# Store process IDs for cleanup
$processes = @()

# Cleanup function
function Stop-Services {
    Write-Host ""
    Write-Host "Shutting down services..." -ForegroundColor Yellow
    foreach ($proc in $processes) {
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        } catch {}
    }
    exit 0
}

# Register cleanup on Ctrl+C
trap { Stop-Services }

# Function to start a service
function Start-ServiceProcess {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "Starting $Name..." -ForegroundColor Gray
    $proc = Start-Process -FilePath "bun" -ArgumentList $Command -WorkingDirectory $Path -WindowStyle Normal -PassThru
    $script:processes += $proc
    Start-Sleep -Milliseconds 500
}

if ($Mode -eq 'dev') {
    # Start all services in dev mode
    Start-ServiceProcess -Name "Gateway (port 8000)" -Path (Join-Path $ProjectRoot "apps\gateway") -Command "run dev"
    Start-Sleep -Seconds 2
    
    Start-ServiceProcess -Name "User Service (port 3004)" -Path (Join-Path $ProjectRoot "apps\user-service") -Command "run dev"
    Start-ServiceProcess -Name "Course Service (port 3005)" -Path (Join-Path $ProjectRoot "apps\course-service") -Command "run dev"
    Start-ServiceProcess -Name "Enrollment Service (port 3006)" -Path (Join-Path $ProjectRoot "apps\enrollment-service") -Command "run dev"
    Start-ServiceProcess -Name "Admin BFF (port 3001)" -Path (Join-Path $ProjectRoot "apps\admin-bff") -Command "run dev"
    Start-ServiceProcess -Name "Teacher BFF (port 3002)" -Path (Join-Path $ProjectRoot "apps\teacher-bff") -Command "run dev"
    Start-ServiceProcess -Name "Student BFF (port 3003)" -Path (Join-Path $ProjectRoot "apps\student-bff") -Command "run dev"
    
    Write-Host ""
    Write-Host "All services started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "API Gateway: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "   - /api/admin/*   -> Admin BFF (port 3001)"
    Write-Host "   - /api/teacher/* -> Teacher BFF (port 3002)"
    Write-Host "   - /api/student/* -> Student BFF (port 3003)"
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
    
    # Wait for user input
    while ($true) {
        Start-Sleep -Seconds 1
    }
} else {
    # Production mode
    Write-Host "Building services..." -ForegroundColor Yellow
    bun run build
    
    Start-ServiceProcess -Name "Gateway" -Path (Join-Path $ProjectRoot "apps\gateway") -Command "run start"
    Start-ServiceProcess -Name "User Service" -Path (Join-Path $ProjectRoot "apps\user-service") -Command "run start"
    Start-ServiceProcess -Name "Course Service" -Path (Join-Path $ProjectRoot "apps\course-service") -Command "run start"
    Start-ServiceProcess -Name "Enrollment Service" -Path (Join-Path $ProjectRoot "apps\enrollment-service") -Command "run start"
    Start-ServiceProcess -Name "Admin BFF" -Path (Join-Path $ProjectRoot "apps\admin-bff") -Command "run start"
    Start-ServiceProcess -Name "Teacher BFF" -Path (Join-Path $ProjectRoot "apps\teacher-bff") -Command "run start"
    Start-ServiceProcess -Name "Student BFF" -Path (Join-Path $ProjectRoot "apps\student-bff") -Command "run start"
    
    Write-Host ""
    Write-Host "Production services started!" -ForegroundColor Green
    
    # Keep running
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
