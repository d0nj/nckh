#requires -Version 5.1
<#
.SYNOPSIS
    Stop PostgreSQL and Redis services started via Scoop

.DESCRIPTION
    Stops PostgreSQL and Redis services that were started via Scoop on Windows.
    Can gracefully shut down services or force kill them if needed.

.PARAMETER Force
    Force stop (kill processes instead of graceful shutdown)

.EXAMPLE
    .\scripts\stop-databases.ps1
    Gracefully stops PostgreSQL and Redis

.EXAMPLE
    .\scripts\stop-databases.ps1 -Force
    Force stops PostgreSQL and Redis
#>

param(
    [switch]$Force,
    [string]$DataDir = "$env:USERPROFILE/scoop/persist/postgresql/data"
)

Write-Host "Thai Binh University Training Platform - Stop Database Services" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

$stoppedCount = 0

# ============================================
# Stop Redis
# ============================================
Write-Host "Stopping Redis..." -ForegroundColor Yellow

# Try shims first, then direct paths
$redisCli = "$env:USERPROFILE/scoop/shims/redis-cli.exe"
$redisServer = "$env:USERPROFILE/scoop/shims/redis-server.exe"

if (-not (Test-Path $redisCli)) {
    $redisCli = "$env:USERPROFILE/scoop/apps/redis/current/redis-cli.exe"
    $redisServer = "$env:USERPROFILE/scoop/apps/redis/current/redis-server.exe"
}

if (Test-Path $redisCli) {
    # Try graceful shutdown first
    $result = & $redisCli shutdown nosave 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Redis stopped gracefully" -ForegroundColor Green
        $stoppedCount++
    } else {
        # Find and kill redis-server process
        $redisProcesses = Get-Process | Where-Object { $_.ProcessName -like "*redis-server*" } -ErrorAction SilentlyContinue
        if ($redisProcesses) {
            foreach ($proc in $redisProcesses) {
                try {
                    Stop-Process -Id $proc.Id -Force:$Force -ErrorAction SilentlyContinue
                    Write-Host "  Redis process stopped (PID: $($proc.Id))" -ForegroundColor Green
                    $stoppedCount++
                } catch {
                    Write-Host "  Failed to stop Redis process (PID: $($proc.Id))" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "  No Redis processes found" -ForegroundColor Gray
        }
    }
} else {
    # Try to find and kill redis-server directly
    $redisProcesses = Get-Process | Where-Object { $_.ProcessName -like "*redis-server*" } -ErrorAction SilentlyContinue
    if ($redisProcesses) {
        foreach ($proc in $redisProcesses) {
            try {
                Stop-Process -Id $proc.Id -Force:$Force -ErrorAction SilentlyContinue
                Write-Host "  Redis process stopped (PID: $($proc.Id))" -ForegroundColor Green
                $stoppedCount++
            } catch {
                Write-Host "  Failed to stop Redis process (PID: $($proc.Id))" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  Redis not running or not found" -ForegroundColor Gray
    }
}

Start-Sleep -Seconds 1

# ============================================
# Stop PostgreSQL
# ============================================
Write-Host "Stopping PostgreSQL..." -ForegroundColor Yellow

# Try shims first, then direct paths
$pgCtl = "$env:USERPROFILE/scoop/shims/pg_ctl.exe"

if (-not (Test-Path $pgCtl)) {
    $pgCtl = "$env:USERPROFILE/scoop/apps/postgresql/current/bin/pg_ctl.exe"
}

if (Test-Path $pgCtl) {
    # Check if PostgreSQL is running
    $status = & $pgCtl status -D $DataDir 2>&1
    
    if ($status -like "*server is running*") {
        if ($Force) {
            # Force stop
            & $pgCtl stop -D $DataDir -m immediate 2>&1 | Out-Null
        } else {
            # Graceful stop
            & $pgCtl stop -D $DataDir -m fast 2>&1 | Out-Null
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  PostgreSQL stopped gracefully" -ForegroundColor Green
            $stoppedCount++
        } else {
            Write-Host "  pg_ctl stop failed, trying to kill process..." -ForegroundColor Yellow
            # Find and kill postgres process
            $pgProcesses = Get-Process | Where-Object { $_.ProcessName -like "*postgres*" -or $_.ProcessName -like "*postmaster*" } -ErrorAction SilentlyContinue
            foreach ($proc in $pgProcesses) {
                try {
                    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                    Write-Host "  PostgreSQL process stopped (PID: $($proc.Id))" -ForegroundColor Green
                    $stoppedCount++
                } catch {}
            }
        }
    } else {
        Write-Host "  PostgreSQL is not running" -ForegroundColor Gray
    }
} else {
    Write-Host "  pg_ctl not found, trying to find processes..." -ForegroundColor Yellow
    # Find and kill postgres processes
    $pgProcesses = Get-Process | Where-Object { $_.ProcessName -like "*postgres*" -or $_.ProcessName -like "*postmaster*" } -ErrorAction SilentlyContinue
    if ($pgProcesses) {
        foreach ($proc in $pgProcesses) {
            try {
                Stop-Process -Id $proc.Id -Force:$Force -ErrorAction SilentlyContinue
                Write-Host "  PostgreSQL process stopped (PID: $($proc.Id))" -ForegroundColor Green
                $stoppedCount++
            } catch {
                Write-Host "  Failed to stop PostgreSQL process (PID: $($proc.Id))" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  No PostgreSQL processes found" -ForegroundColor Gray
    }
}

Write-Host ""

# ============================================
# Verify ports are free
# ============================================
Write-Host "Verifying ports are released..." -ForegroundColor Yellow

Start-Sleep -Seconds 2

$pgPortFree = $true
$redisPortFree = $true

try {
    $pgConn = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
    if ($pgConn.TcpTestSucceeded) {
        $pgPortFree = $false
    }
} catch {}

try {
    $redisConn = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
    if ($redisConn.TcpTestSucceeded) {
        $redisPortFree = $false
    }
} catch {}

if ($pgPortFree) {
    Write-Host "  Port 5432 (PostgreSQL): FREE" -ForegroundColor Green
} else {
    Write-Host "  Port 5432 (PostgreSQL): STILL IN USE" -ForegroundColor Red
}

if ($redisPortFree) {
    Write-Host "  Port 6379 (Redis):      FREE" -ForegroundColor Green
} else {
    Write-Host "  Port 6379 (Redis):      STILL IN USE" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "Database services stopped!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
