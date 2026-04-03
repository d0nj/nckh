<#
.SYNOPSIS
    Setup script for Thai Binh University Training Platform

.DESCRIPTION
    Generates secure secrets and initializes the development environment
#>

param(
    [switch]$Force
)

Write-Host "Thai Binh University Training Platform - Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if ((Test-Path ".env") -and (-not $Force)) {
    Write-Host ".env file already exists. Use -Force to overwrite." -ForegroundColor Yellow
    exit 0
}

Write-Host "Generating secure secrets..." -ForegroundColor Yellow

# Generate secrets
function Generate-Secret {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

$authSecret = Generate-Secret

# Create root .env
$rootEnv = @"
# Thai Binh University Training Platform - Environment Configuration
# Generated: $(Get-Date)

# Node Environment
NODE_ENV=development

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://thai_binh:thai_binh_dev@localhost:5432/thai_binh_training

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Auth Configuration
# BETTER_AUTH_SECRET is used for both better-auth AND JWT validation
BETTER_AUTH_SECRET=$authSecret
BETTER_AUTH_URL=http://localhost:8000

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8000
"@

$rootEnv | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "Created root .env" -ForegroundColor Green

# Create gateway .env
$gatewayEnv = @"
# Gateway Environment Configuration
NODE_ENV=development
PORT=8000

# Auth (BETTER_AUTH_SECRET is used for JWT validation)
BETTER_AUTH_SECRET=$authSecret

# BFF Service URLs
ADMIN_BFF_URL=http://localhost:3001
TEACHER_BFF_URL=http://localhost:3002
STUDENT_BFF_URL=http://localhost:3003

# Rate Limits (requests per minute)
ADMIN_RATE_LIMIT=200
TEACHER_RATE_LIMIT=300
STUDENT_RATE_LIMIT=500

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8000
"@

$gatewayEnv | Out-File -FilePath "apps\gateway\.env" -Encoding UTF8
Write-Host "Created apps/gateway/.env" -ForegroundColor Green

# Create BFF .env files
$services = @(
    @{ Name = "admin-bff"; Port = 3001 },
    @{ Name = "teacher-bff"; Port = 3002 },
    @{ Name = "student-bff"; Port = 3003 }
)

foreach ($service in $services) {
    $name = $service.Name
    $port = $service.Port
    $shortName = $name -replace '-bff', ''
    
    $bffEnv = @"
# BFF Environment Configuration
NODE_ENV=development
PORT=$port

# Database
DATABASE_URL=postgresql://thai_binh:thai_binh_dev@localhost:5432/thai_binh_training
REDIS_URL=redis://localhost:6379

# Auth
BETTER_AUTH_SECRET=$authSecret
BETTER_AUTH_URL=http://localhost:8000

# Core Service URLs
USER_SERVICE_URL=http://localhost:3004
COURSE_SERVICE_URL=http://localhost:3005
ENROLLMENT_SERVICE_URL=http://localhost:3006

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
"@
    
    $bffEnv | Out-File -FilePath "apps\$name\.env" -Encoding UTF8
    Write-Host "Created apps/$name/.env" -ForegroundColor Green
}

# Create core service .env files
$coreServices = @(
    @{ Name = "user-service"; Port = 3004 },
    @{ Name = "course-service"; Port = 3005 },
    @{ Name = "enrollment-service"; Port = 3006 }
)

foreach ($service in $coreServices) {
    $name = $service.Name
    $port = $service.Port
    $dbName = $name -replace '-service', ''
    
    $serviceEnv = @"
# Service Environment Configuration
NODE_ENV=development
PORT=$port

# Database (PostgreSQL)
DATABASE_URL=postgresql://thai_binh:thai_binh_dev@localhost:5432/thai_binh_training
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8000
"@
    
    $serviceEnv | Out-File -FilePath "apps\$name\.env" -Encoding UTF8
    Write-Host "Created apps/$name/.env" -ForegroundColor Green
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. docker-compose up -d    # Start PostgreSQL and Redis" -ForegroundColor White
Write-Host "  2. bun install             # Install dependencies" -ForegroundColor White
Write-Host "  3. .\scripts\start.ps1     # Start all services" -ForegroundColor White
Write-Host ""
Write-Host "API Gateway will be available at: http://localhost:8000" -ForegroundColor Cyan