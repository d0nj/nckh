<#
.SYNOPSIS
    Stop all Thai Binh University Training Platform services

.DESCRIPTION
    Stops all running Bun processes for the training platform
#>

Write-Host "Stopping all services..." -ForegroundColor Yellow

# Find and stop all bun processes related to our services
$processes = Get-Process -Name "bun" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "(gateway|user-service|course-service|enrollment-service|admin-bff|teacher-bff|student-bff)"
}

if ($processes) {
    foreach ($proc in $processes) {
        Write-Host "  Stopping process $($proc.Id)..." -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "All services stopped" -ForegroundColor Green
} else {
    Write-Host "No running services found" -ForegroundColor Cyan
}

# Also check for Node processes (in case)
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "(thai-binh)"
}

if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}
