#requires -Version 5.1
<#
.SYNOPSIS
    Start PostgreSQL and Redis services installed via Scoop

.DESCRIPTION
    Starts PostgreSQL and Redis services for the Thai Binh University Training Platform.
    Assumes both PostgreSQL and Redis were installed via Scoop on Windows.

.PARAMETER DataDir
    PostgreSQL data directory (default: ~/scoop/persist/postgresql/data)

.PARAMETER RedisConfig
    Redis configuration file path (default: uses redis.conf from scoop)

.EXAMPLE
    .\scripts\start-databases.ps1
    Starts PostgreSQL and Redis with default settings

.EXAMPLE
    .\scripts\start-databases.ps1 -DataDir "D:\pgdata" -RedisConfig "D:\redis.conf"
    Starts with custom data directory and Redis config

.NOTES
    Requires PostgreSQL and Redis installed via Scoop:
    scoop install postgresql redis
#>

param(
    [string]$DataDir = "$env:USERPROFILE/scoop/persist/postgresql/data",
    [string]$RedisConfig = "$env:USERPROFILE/scoop/apps/redis/current/redis.conf"
)

# Get script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "Thai Binh University Training Platform - Database Services" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Store process IDs for cleanup
$script:processes = @()

# Cleanup function
function Stop-Services {
    Write-Host ""
    Write-Host "Shutting down database services..." -ForegroundColor Yellow
    
    # Determine paths (shims or direct)
    $redisCliPath = if (Test-Path "$env:USERPROFILE/scoop/shims/redis-cli.exe") { 
        "$env:USERPROFILE/scoop/shims/redis-cli.exe" 
    } else { 
        "$env:USERPROFILE/scoop/apps/redis/current/redis-cli.exe" 
    }
    $pgCtlPath = if (Test-Path "$env:USERPROFILE/scoop/shims/pg_ctl.exe") { 
        "$env:USERPROFILE/scoop/shims/pg_ctl.exe" 
    } else { 
        "$env:USERPROFILE/scoop/apps/postgresql/current/bin/pg_ctl.exe" 
    }
    
    # Stop Redis gracefully
    Write-Host "  Stopping Redis..." -ForegroundColor Gray
    try {
        if (Test-Path $redisCliPath) {
            & $redisCliPath shutdown nosave 2>$null
            Start-Sleep -Seconds 1
        }
    } catch {}
    
    # Stop PostgreSQL gracefully
    Write-Host "  Stopping PostgreSQL..." -ForegroundColor Gray
    try {
        if (Test-Path $pgCtlPath) {
            & $pgCtlPath stop -D $DataDir -m fast 2>$null
            Start-Sleep -Seconds 2
        }
    } catch {}
    
    # Force kill any remaining processes
    foreach ($proc in $script:processes) {
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        } catch {}
    }
    
    Write-Host ""
    Write-Host "Database services stopped." -ForegroundColor Green
    exit 0
}

# Register cleanup on Ctrl+C
trap { Stop-Services }

# Function to check if a port is in use
function Test-PortInUse {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

# Function to wait for a port to be available
function Wait-ForPort {
    param(
        [int]$Port,
        [string]$ServiceName,
        [int]$TimeoutSeconds = 30
    )
    
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        if (Test-PortInUse -Port $Port) {
            return $true
        }
        Start-Sleep -Seconds 1
        $elapsed++
        Write-Host "  Waiting for $ServiceName... ($elapsed/$TimeoutSeconds)" -ForegroundColor DarkGray
    }
    return $false
}

Write-Host "Checking Scoop installation..." -ForegroundColor Yellow

# Check if scoop is installed
if (-not (Test-Path "$env:USERPROFILE/scoop")) {
    Write-Host "ERROR: Scoop is not installed. Please install Scoop first:" -ForegroundColor Red
    Write-Host "   irm get.scoop.sh | iex" -ForegroundColor White
    exit 1
}

# Check PostgreSQL (try shims first, then direct paths)
$pgCtl = "$env:USERPROFILE/scoop/shims/pg_ctl.exe"
$createdb = "$env:USERPROFILE/scoop/shims/createdb.exe"
$psql = "$env:USERPROFILE/scoop/shims/psql.exe"
$initdb = "$env:USERPROFILE/scoop/shims/initdb.exe"

# Fallback to direct paths if shims don't exist
if (-not (Test-Path $pgCtl)) {
    $pgCtl = "$env:USERPROFILE/scoop/apps/postgresql/current/bin/pg_ctl.exe"
    $createdb = "$env:USERPROFILE/scoop/apps/postgresql/current/bin/createdb.exe"
    $psql = "$env:USERPROFILE/scoop/apps/postgresql/current/bin/psql.exe"
    $initdb = "$env:USERPROFILE/scoop/apps/postgresql/current/bin/initdb.exe"
}

if (-not (Test-Path $pgCtl)) {
    Write-Host "ERROR: PostgreSQL is not installed via Scoop. Install it with:" -ForegroundColor Red
    Write-Host "   scoop install postgresql" -ForegroundColor White
    exit 1
}

# Check Redis (try shims first, then direct paths)
$redisServer = "$env:USERPROFILE/scoop/shims/redis-server.exe"
$redisCli = "$env:USERPROFILE/scoop/shims/redis-cli.exe"

if (-not (Test-Path $redisServer)) {
    $redisServer = "$env:USERPROFILE/scoop/apps/redis/current/redis-server.exe"
    $redisCli = "$env:USERPROFILE/scoop/apps/redis/current/redis-cli.exe"
}

if (-not (Test-Path $redisServer)) {
    Write-Host "ERROR: Redis is not installed via Scoop. Install it with:" -ForegroundColor Red
    Write-Host "   scoop install redis" -ForegroundColor White
    exit 1
}

Write-Host "PostgreSQL and Redis found via Scoop" -ForegroundColor Green
Write-Host ""

# Check if services are already running
$pgRunning = Test-PortInUse -Port 5432
$redisRunning = Test-PortInUse -Port 6379

if ($pgRunning -and $redisRunning) {
    Write-Host "PostgreSQL (port 5432) and Redis (port 6379) are already running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database URLs:" -ForegroundColor Cyan
    Write-Host "   PostgreSQL: postgresql://thai_binh:thai_binh_dev@localhost:5432/thai_binh_training" -ForegroundColor White
    Write-Host "   Redis:      redis://localhost:6379" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C to stop services" -ForegroundColor Yellow
    while ($true) { Start-Sleep -Seconds 1 }
}

# ============================================
# Initialize PostgreSQL if needed
# ============================================
if (-not $pgRunning) {
    Write-Host "Initializing PostgreSQL..." -ForegroundColor Yellow

    # Create data directory if it doesn't exist
    if (-not (Test-Path $DataDir)) {
        Write-Host "  Creating PostgreSQL data directory: $DataDir" -ForegroundColor Gray
        New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
    }

    # Initialize database cluster if not already initialized
    if (-not (Test-Path "$DataDir/PG_VERSION")) {
        Write-Host "  Initializing PostgreSQL database cluster..." -ForegroundColor Gray
        & $initdb -D $DataDir --locale=en_US.UTF-8 --encoding=UTF8 --username=postgres
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to initialize PostgreSQL" -ForegroundColor Red
            exit 1
        }
        Write-Host "  PostgreSQL cluster initialized" -ForegroundColor Green
        
        # Create log directory
        $logDir = "$DataDir/log"
        if (-not (Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
    } else {
        Write-Host "  PostgreSQL data directory already initialized" -ForegroundColor Gray
    }

    # ============================================
    # Start PostgreSQL
    # ============================================
    Write-Host "Starting PostgreSQL..." -ForegroundColor Yellow
    
    $pgLog = "$DataDir/log/postgresql.log"
    & $pgCtl start -D $DataDir -l $pgLog -w
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to start PostgreSQL" -ForegroundColor Red
        Write-Host "Check log file: $pgLog" -ForegroundColor Yellow
        exit 1
    }
    
    # Wait for PostgreSQL to be ready
    Write-Host "  Waiting for PostgreSQL to accept connections..." -ForegroundColor Gray
    if (Wait-ForPort -Port 5432 -ServiceName "PostgreSQL" -TimeoutSeconds 30) {
        Write-Host "  PostgreSQL is running on port 5432" -ForegroundColor Green
    } else {
        Write-Host "ERROR: PostgreSQL failed to start within timeout" -ForegroundColor Red
        exit 1
    }
}

# ============================================
# Start Redis
# ============================================
if (-not $redisRunning) {
    Write-Host "Starting Redis..." -ForegroundColor Yellow
    
    # Check if custom config exists, otherwise start with defaults
    if (Test-Path $RedisConfig) {
        Write-Host "  Using Redis config: $RedisConfig" -ForegroundColor Gray
        $redisProc = Start-Process -FilePath $redisServer -ArgumentList $RedisConfig -WindowStyle Hidden -PassThru
    } else {
        Write-Host "  Starting Redis with default configuration" -ForegroundColor Gray
        $redisProc = Start-Process -FilePath $redisServer -WindowStyle Hidden -PassThru
    }
    
    $script:processes += $redisProc
    
    # Wait a moment for Redis to start
    Start-Sleep -Seconds 2
    
    # Wait for Redis to be ready
    Write-Host "  Waiting for Redis to accept connections..." -ForegroundColor Gray
    if (Wait-ForPort -Port 6379 -ServiceName "Redis" -TimeoutSeconds 10) {
        Write-Host "  Redis is running on port 6379" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Redis may not have started properly" -ForegroundColor Yellow
    }
}

# ============================================
# Display connection information
# ============================================
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "Database services are running!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "PostgreSQL:" -ForegroundColor Cyan
Write-Host "   Host:     localhost" -ForegroundColor White
Write-Host "   Port:     5432" -ForegroundColor White
Write-Host "   User:     postgres (default)" -ForegroundColor White
Write-Host "   Data Dir: $DataDir" -ForegroundColor White
Write-Host ""
Write-Host "Redis:" -ForegroundColor Cyan
Write-Host "   Host:     localhost" -ForegroundColor White
Write-Host "   Port:     6379" -ForegroundColor White
Write-Host ""
Write-Host "Connection URLs:" -ForegroundColor Cyan
Write-Host "   PostgreSQL: postgresql://localhost:5432" -ForegroundColor White
Write-Host "   Redis:      redis://localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "   1. Run database initialization:" -ForegroundColor White
Write-Host "      .\scripts\init-database.ps1" -ForegroundColor Gray
Write-Host "   2. Or use docker-compose:" -ForegroundColor White
Write-Host "      docker-compose up -d postgres redis" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop services" -ForegroundColor Yellow

# Keep running until Ctrl+C
while ($true) {
    Start-Sleep -Seconds 1
}
