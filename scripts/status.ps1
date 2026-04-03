<#
.SYNOPSIS
    Check status of Thai Binh University Training Platform services

.DESCRIPTION
    Displays the running status of all microservices
#>

Write-Host "📊 Thai Binh University Training Platform - Status Check" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{ Name = "Gateway"; Port = 8000 },
    @{ Name = "Admin BFF"; Port = 3001 },
    @{ Name = "Teacher BFF"; Port = 3002 },
    @{ Name = "Student BFF"; Port = 3003 },
    @{ Name = "User Service"; Port = 3004 },
    @{ Name = "Course Service"; Port = 3005 },
    @{ Name = "Enrollment Service"; Port = 3006 }
)

foreach ($service in $services) {
    $port = $service.Port
    $name = $service.Name
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "✅ $name (port $port)" -ForegroundColor Green
        } else {
            Write-Host "❌ $name (port $port) - Not running" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $name (port $port) - Error checking" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📍 API Gateway: http://localhost:8000" -ForegroundColor Cyan
