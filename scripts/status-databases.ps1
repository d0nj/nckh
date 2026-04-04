#requires -Version 5.1
<#
.SYNOPSIS
    Check status of PostgreSQL and Redis services

.DESCRIPTION
    Displays the current status of PostgreSQL and Redis services,
    including whether they are running, process IDs, and port availability.

.EXAMPLE
    .\scripts\status-databases.ps1
    Shows status of PostgreSQL and Redis
#>

Write-Host "Thai Binh University Training Platform - Database Status" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Check PostgreSQL
# ============================================
Write-Host "PostgreSQL:" -ForegroundColor Yellow

$pgRunning = $false
$pgPid = $null

# Check if port 5432 is listening
try {
    $pgConn = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
    $pgRunning = $pgConn.TcpTestSucceeded
} catch {}

# Find PostgreSQL processes
$pgProcesses = Get-Process | Where-Object { $_.ProcessName -like "*postgres*" -or $_.ProcessName -like "*postmaster*" } -ErrorAction SilentlyContinue

if ($pgRunning) {
    Write-Host "  Status:     RUNNING" -ForegroundColor Green
    Write-Host "  Port:       5432" -ForegroundColor White
    
    if ($pgProcesses) {
        Write-Host "  Processes:" -ForegroundColor White
        foreach ($proc in $pgProcesses) {
            Write-Host "    - PID $($proc.Id): $($proc.ProcessName) (CPU: $([math]::Round($proc.CPU, 2))s)" -ForegroundColor Gray
        }
    }
    
    # Try to get PostgreSQL version
    $psql = "$env:USERPROFILE/scoop/shims/psql.exe"
    if (-not (Test-Path $psql)) {
        $psql = "$env:USERPROFILE/scoop/apps/postgresql/current/bin/psql.exe"
    }
    if (Test-Path $psql) {
        try {
            $version = & $psql -h localhost -U postgres -tAc "SELECT version();" 2>$null
            if ($version) {
                Write-Host "  Version:    $($version.Split(',')[0])" -ForegroundColor Gray
            }
        } catch {}
    }
    
    # Check data directory
    $dataDir = "$env:USERPROFILE/scoop/persist/postgresql/data"
    if (Test-Path $dataDir) {
        Write-Host "  Data Dir:   $dataDir" -ForegroundColor Gray
    }
} else {
    Write-Host "  Status:     STOPPED" -ForegroundColor Red
    if ($pgProcesses) {
        Write-Host "  Note:       Processes exist but port not responding" -ForegroundColor Yellow
        foreach ($proc in $pgProcesses) {
            Write-Host "    - PID $($proc.Id): $($proc.ProcessName)" -ForegroundColor Gray
        }
    }
}

Write-Host ""

# ============================================
# Check Redis
# ============================================
Write-Host "Redis:" -ForegroundColor Yellow

$redisRunning = $false

# Check if port 6379 is listening
try {
    $redisConn = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
    $redisRunning = $redisConn.TcpTestSucceeded
} catch {}

# Find Redis processes
$redisProcesses = Get-Process | Where-Object { $_.ProcessName -like "*redis-server*" } -ErrorAction SilentlyContinue

if ($redisRunning) {
    Write-Host "  Status:     RUNNING" -ForegroundColor Green
    Write-Host "  Port:       6379" -ForegroundColor White
    
    if ($redisProcesses) {
        Write-Host "  Processes:" -ForegroundColor White
        foreach ($proc in $redisProcesses) {
            Write-Host "    - PID $($proc.Id): $($proc.ProcessName) (CPU: $([math]::Round($proc.CPU, 2))s)" -ForegroundColor Gray
        }
    }
    
    # Try to get Redis info
    $redisCli = "$env:USERPROFILE/scoop/shims/redis-cli.exe"
    if (-not (Test-Path $redisCli)) {
        $redisCli = "$env:USERPROFILE/scoop/apps/redis/current/redis-cli.exe"
    }
    if (Test-Path $redisCli) {
        try {
            $info = & $redisCli info server 2>$null
            if ($info) {
                $version = ($info | Select-String "redis_version:") -replace "redis_version:", "" -replace "\r", ""
                $mode = ($info | Select-String "redis_mode:") -replace "redis_mode:", "" -replace "\r", ""
                if ($version) {
                    Write-Host "  Version:    $version" -ForegroundColor Gray
                }
                if ($mode) {
                    Write-Host "  Mode:       $mode" -ForegroundColor Gray
                }
            }
        } catch {}
    }
} else {
    Write-Host "  Status:     STOPPED" -ForegroundColor Red
    if ($redisProcesses) {
        Write-Host "  Note:       Processes exist but port not responding" -ForegroundColor Yellow
        foreach ($proc in $redisProcesses) {
            Write-Host "    - PID $($proc.Id): $($proc.ProcessName)" -ForegroundColor Gray
        }
    }
}

Write-Host ""

# ============================================
# Check Database Connection
# ============================================
Write-Host "Database Connectivity:" -ForegroundColor Yellow

$psql = "$env:USERPROFILE/scoop/shims/psql.exe"
if (-not (Test-Path $psql)) {
    $psql = "$env:USERPROFILE/scoop/apps/postgresql/current/bin/psql.exe"
}
if (Test-Path $psql) {
    # Check for thai_binh_training database
    try {
        $dbExists = & $psql -h localhost -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='thai_binh_training';" 2>$null
        if ($dbExists -eq "1") {
            Write-Host "  Database 'thai_binh_training': EXISTS" -ForegroundColor Green
            
            # Check for schemas
            try {
                $schemas = & $psql -h localhost -U postgres -d thai_binh_training -tAc "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('auth', 'academic', 'student', 'certification', 'finance');" 2>$null
                if ($schemas) {
                    Write-Host "  Schemas:" -ForegroundColor White
                    $schemas -split "\n" | ForEach-Object {
                        if ($_.Trim()) {
                            Write-Host "    $_" -ForegroundColor Gray
                        }
                    }
                }
            } catch {}
        } else {
            Write-Host "  Database 'thai_binh_training': NOT FOUND" -ForegroundColor Red
            Write-Host "    Run: .\scripts\init-database.ps1" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  Cannot check database status (PostgreSQL may not be running)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Commands:" -ForegroundColor White
Write-Host "  Start:   .\scripts\start-databases.ps1" -ForegroundColor Gray
Write-Host "  Stop:    .\scripts\stop-databases.ps1" -ForegroundColor Gray
Write-Host "  Init:    .\scripts\init-database.ps1" -ForegroundColor Gray
Write-Host "  Setup:   .\scripts\setup-databases.ps1" -ForegroundColor Gray
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
