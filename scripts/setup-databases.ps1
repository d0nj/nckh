#requires -Version 5.1
<#
.SYNOPSIS
    Combined script to start and initialize databases for Thai Binh University Training Platform

.DESCRIPTION
    This script starts PostgreSQL and Redis via Scoop, then initializes the database
    with schemas and runs Drizzle migrations. It's a convenience wrapper around
    start-databases.ps1 and init-database.ps1.

.PARAMETER SkipInit
    Skip database initialization (only start services)

.PARAMETER DbName
    Database name (default: thai_binh_training)

.PARAMETER DbUser
    Database user (default: thai_binh)

.PARAMETER DbPassword
    Database password (default: thai_binh_dev)

.EXAMPLE
    .\scripts\setup-databases.ps1
    Starts databases and initializes them

.EXAMPLE
    .\scripts\setup-databases.ps1 -SkipInit
    Only starts databases without initialization

.NOTES
    Requires PostgreSQL and Redis installed via Scoop
#>

param(
    [switch]$SkipInit,
    [string]$DbName = "thai_binh_training",
    [string]$DbUser = "thai_binh",
    [string]$DbPassword = "thai_binh_dev"
)

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Thai Binh University Training Platform - Database Setup" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Check if scoop is installed
if (-not (Test-Path "$env:USERPROFILE/scoop")) {
    Write-Host "ERROR: Scoop is not installed." -ForegroundColor Red
    Write-Host "Please install Scoop first:" -ForegroundColor Yellow
    Write-Host "   irm get.scoop.sh | iex" -ForegroundColor White
    exit 1
}

# Check if postgresql and redis are installed (try shims first, then direct paths)
$pgInstalled = Test-Path "$env:USERPROFILE/scoop/shims/pg_ctl.exe"
$redisInstalled = Test-Path "$env:USERPROFILE/scoop/shims/redis-server.exe"

# Fallback to direct paths
if (-not $pgInstalled) {
    $pgInstalled = Test-Path "$env:USERPROFILE/scoop/apps/postgresql/current/bin/pg_ctl.exe"
}
if (-not $redisInstalled) {
    $redisInstalled = Test-Path "$env:USERPROFILE/scoop/apps/redis/current/redis-server.exe"
}

if (-not $pgInstalled -or -not $redisInstalled) {
    Write-Host "Missing database services. Install them with:" -ForegroundColor Red
    if (-not $pgInstalled) {
        Write-Host "   scoop install postgresql" -ForegroundColor White
    }
    if (-not $redisInstalled) {
        Write-Host "   scoop install redis" -ForegroundColor White
    }
    exit 1
}

# ============================================
# Step 1: Start database services
# ============================================
Write-Host "Step 1: Starting database services..." -ForegroundColor Yellow
Write-Host ""

# Start databases in a background job so we can continue with initialization
$startDbScript = {
    param($ScriptDir)
    & "$ScriptDir/start-databases.ps1"
}

# Start databases
& "$ScriptDir/start-databases.ps1" &
$dbJob = $LASTEXITCODE

# Wait a moment for services to start
Write-Host "Waiting for services to start..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Check if services are running
$pgRunning = $false
$redisRunning = $false

try {
    $pgConn = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
    $pgRunning = $pgConn.TcpTestSucceeded
} catch {}

try {
    $redisConn = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
    $redisRunning = $redisConn.TcpTestSucceeded
} catch {}

if (-not $pgRunning -or -not $redisRunning) {
    Write-Host "Services not ready yet. Waiting more..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    try {
        $pgConn = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
        $pgRunning = $pgConn.TcpTestSucceeded
    } catch {}
    
    try {
        $redisConn = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
        $redisRunning = $redisConn.TcpTestSucceeded
    } catch {}
}

if (-not $pgRunning) {
    Write-Host "WARNING: PostgreSQL may not be running yet" -ForegroundColor Yellow
}

if (-not $redisRunning) {
    Write-Host "WARNING: Redis may not be running yet" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# Step 2: Initialize database (if not skipped)
# ============================================
if (-not $SkipInit) {
    Write-Host "Step 2: Initializing database..." -ForegroundColor Yellow
    Write-Host ""
    
    & "$ScriptDir/init-database.ps1" -DbName $DbName -DbUser $DbUser -DbPassword $DbPassword
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "WARNING: Database initialization may have failed" -ForegroundColor Yellow
        Write-Host "You can run it manually:" -ForegroundColor White
        Write-Host "   .\scripts\init-database.ps1" -ForegroundColor Gray
    }
} else {
    Write-Host "Step 2: Skipping database initialization (use -SkipInit flag)" -ForegroundColor Gray
    Write-Host ""
}

# ============================================
# Display final status
# ============================================
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services Status:" -ForegroundColor Cyan
if ($pgRunning) {
    Write-Host "   PostgreSQL: RUNNING (port 5432)" -ForegroundColor Green
} else {
    Write-Host "   PostgreSQL: UNKNOWN (may still be starting)" -ForegroundColor Yellow
}
if ($redisRunning) {
    Write-Host "   Redis:      RUNNING (port 6379)" -ForegroundColor Green
} else {
    Write-Host "   Redis:      UNKNOWN (may still be starting)" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Connection URLs:" -ForegroundColor Cyan
Write-Host "   PostgreSQL: postgresql://$DbUser@localhost:5432/$DbName" -ForegroundColor White
Write-Host "   Redis:      redis://localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "Management Commands:" -ForegroundColor Cyan
Write-Host "   Stop services:    .\scripts\stop-databases.ps1" -ForegroundColor White
Write-Host "   Check status:     .\scripts\status-databases.ps1" -ForegroundColor White
Write-Host "   Re-initialize:    .\scripts\init-database.ps1" -ForegroundColor White
Write-Host ""
Write-Host "NOTE: Services are running in the background." -ForegroundColor Yellow
Write-Host "Use '.\scripts\stop-databases.ps1' to stop them." -ForegroundColor Yellow
Write-Host ""
