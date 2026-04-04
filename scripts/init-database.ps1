#requires -Version 5.1
<#
.SYNOPSIS
    Initialize Thai Binh University Training Platform Database

.DESCRIPTION
    Creates the database, user, schemas, and runs Drizzle migrations for the
    Thai Binh University Training Platform.

.PARAMETER DbName
    Database name (default: thai_binh_training)

.PARAMETER DbUser
    Database user (default: thai_binh)

.PARAMETER DbPassword
    Database password (default: thai_binh_dev)

.PARAMETER SkipUserCreation
    Skip user creation if user already exists

.EXAMPLE
    .\scripts\init-database.ps1
    Initializes database with default settings

.EXAMPLE
    .\scripts\init-database.ps1 -DbName "mydb" -DbUser "admin" -DbPassword "secret"
    Initializes with custom credentials

.NOTES
    Requires PostgreSQL to be running (started via start-databases.ps1 or docker-compose)
#>

param(
    [string]$DbName = "thai_binh_training",
    [string]$DbUser = "thai_binh",
    [string]$DbPassword = "thai_binh_dev",
    [switch]$SkipUserCreation
)

# Get script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "Thai Binh University Training Platform - Database Initialization" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed via scoop (try shims first, then direct paths)
$psql = "$env:USERPROFILE/scoop/shims/psql.exe"
$pgCtl = "$env:USERPROFILE/scoop/shims/pg_ctl.exe"
$createuser = "$env:USERPROFILE/scoop/shims/createuser.exe"
$createdb = "$env:USERPROFILE/scoop/shims/createdb.exe"

# Fallback to direct paths if shims don't exist
if (-not (Test-Path $psql)) {
    $psql = "$env:USERPROFILE/scoop/apps/postgresql/current/bin/psql.exe"
    $pgCtl = "$env:USERPROFILE/scoop/apps/postgresql/current/bin/pg_ctl.exe"
    $createuser = "$env:USERPROFILE/scoop/apps/postgresql/current/bin/createuser.exe"
    $createdb = "$env:USERPROFILE/scoop/apps/postgresql/current/bin/createdb.exe"
}

# Final fallback to PATH
if (-not (Test-Path $psql)) {
    try {
        $psqlCmd = Get-Command psql -ErrorAction Stop
        $psql = $psqlCmd.Source
    } catch {
        Write-Host "ERROR: PostgreSQL client (psql) not found." -ForegroundColor Red
        Write-Host "Please install PostgreSQL via Scoop:" -ForegroundColor Yellow
        Write-Host "   scoop install postgresql" -ForegroundColor White
        exit 1
    }
}

# Check if PostgreSQL is running
Write-Host "Checking if PostgreSQL is running..." -ForegroundColor Yellow
try {
    $result = & $psql -h localhost -U postgres -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL is not running"
    }
    Write-Host "PostgreSQL is running on localhost" -ForegroundColor Green
} catch {
    Write-Host "ERROR: PostgreSQL is not running on localhost" -ForegroundColor Red
    Write-Host "Please start PostgreSQL first:" -ForegroundColor Yellow
    Write-Host "   .\scripts\start-databases.ps1" -ForegroundColor White
    Write-Host "   or" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d postgres" -ForegroundColor White
    exit 1
}

Write-Host ""

# ============================================
# Create database user
# ============================================
if (-not $SkipUserCreation) {
    Write-Host "Creating database user: $DbUser" -ForegroundColor Yellow
    
    # Check if user exists
    $userExists = & $psql -h localhost -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DbUser';" 2>$null
    
    if ($userExists -eq "1") {
        Write-Host "  User '$DbUser' already exists" -ForegroundColor Gray
    } else {
        Write-Host "  Creating user '$DbUser'..." -ForegroundColor Gray
        & $psql -h localhost -U postgres -c "CREATE USER $DbUser WITH PASSWORD '$DbPassword';" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  User created successfully" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Failed to create user" -ForegroundColor Red
            exit 1
        }
    }
    
    # Grant superuser privileges (needed for schema creation)
    Write-Host "  Granting superuser privileges to $DbUser..." -ForegroundColor Gray
    & $psql -h localhost -U postgres -c "ALTER USER $DbUser WITH SUPERUSER CREATEDB;" 2>&1 | Out-Null
    
    Write-Host ""
}

# ============================================
# Create database
# ============================================
Write-Host "Creating database: $DbName" -ForegroundColor Yellow

# Check if database exists
$dbExists = & $psql -h localhost -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName';" 2>$null

if ($dbExists -eq "1") {
    Write-Host "  Database '$DbName' already exists" -ForegroundColor Gray
} else {
    Write-Host "  Creating database '$DbName'..." -ForegroundColor Gray
    & $psql -h localhost -U postgres -c "CREATE DATABASE $DbName OWNER $DbUser ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8';" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to create database" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# ============================================
# Create schemas and grant permissions
# ============================================
Write-Host "Creating PostgreSQL schemas..." -ForegroundColor Yellow

$schemas = @("auth", "academic", "student", "certification", "finance")

foreach ($schema in $schemas) {
    Write-Host "  Creating schema: $schema" -ForegroundColor Gray
    & $psql -h localhost -U postgres -d $DbName -c "CREATE SCHEMA IF NOT EXISTS $schema AUTHORIZATION $DbUser;" 2>&1 | Out-Null
    & $psql -h localhost -U postgres -d $DbName -c "GRANT ALL ON SCHEMA $schema TO $DbUser;" 2>&1 | Out-Null
}

Write-Host "  Schemas created successfully" -ForegroundColor Green
Write-Host ""

# ============================================
# Run init-schemas.sql if it exists
# ============================================
$initSqlPath = "$ProjectRoot/scripts/init-schemas.sql"
if (Test-Path $initSqlPath) {
    Write-Host "Running init-schemas.sql..." -ForegroundColor Yellow
    & $psql -h localhost -U $DbUser -d $DbName -f $initSqlPath 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Schema initialization completed" -ForegroundColor Green
    } else {
        Write-Host "WARNING: init-schemas.sql had errors (may already be applied)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# ============================================
# Run Drizzle migrations if available
# ============================================
Write-Host "Checking for Drizzle ORM setup..." -ForegroundColor Yellow

$drizzleConfig = "$ProjectRoot/packages/database/drizzle.config.ts"
if (Test-Path $drizzleConfig) {
    Write-Host "  Found Drizzle configuration" -ForegroundColor Gray
    
    # Check if bun is available
    try {
        $bunVersion = (bun --version) 2>$null
        Write-Host "  Bun version: $bunVersion" -ForegroundColor Gray
        
        # Set environment variables for database connection
        $env:DATABASE_URL = "postgresql://$DbUser`:$DbPassword@localhost:5432/$DbName"
        
        Write-Host ""
        Write-Host "Running Drizzle ORM migrations..." -ForegroundColor Yellow
        Write-Host "  Command: bun run db:push" -ForegroundColor Gray
        
        Push-Location "$ProjectRoot/packages/database"
        $migrationResult = bun run db:push 2>&1
        Pop-Location
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Drizzle migrations completed successfully" -ForegroundColor Green
        } else {
            Write-Host "WARNING: Drizzle migrations had errors" -ForegroundColor Yellow
            Write-Host "You may need to run: cd packages/database && bun run db:push" -ForegroundColor White
        }
    } catch {
        Write-Host "  Bun not found. Skipping Drizzle migrations." -ForegroundColor Yellow
        Write-Host "  To run migrations manually:" -ForegroundColor White
        Write-Host "    cd packages/database" -ForegroundColor Gray
        Write-Host "    bun install" -ForegroundColor Gray
        Write-Host "    bun run db:push" -ForegroundColor Gray
    }
} else {
    Write-Host "  No Drizzle configuration found. Skipping ORM migrations." -ForegroundColor Gray
}

Write-Host ""

# ============================================
# Display summary
# ============================================
Write-Host "================================================" -ForegroundColor Green
Write-Host "Database initialization complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "   Database:   $DbName" -ForegroundColor White
Write-Host "   User:       $DbUser" -ForegroundColor White
Write-Host "   Host:       localhost" -ForegroundColor White
Write-Host "   Port:       5432" -ForegroundColor White
Write-Host ""
Write-Host "Connection URL:" -ForegroundColor Cyan
Write-Host "   postgresql://$DbUser`:$DbPassword@localhost:5432/$DbName" -ForegroundColor White
Write-Host ""
Write-Host "Schemas created:" -ForegroundColor Cyan
foreach ($schema in $schemas) {
    Write-Host "   - $schema" -ForegroundColor White
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "   1. Copy environment file:" -ForegroundColor White
Write-Host "      cp .env.example .env" -ForegroundColor Gray
Write-Host "   2. Install dependencies:" -ForegroundColor White
Write-Host "      bun install" -ForegroundColor Gray
Write-Host "   3. Start the application:" -ForegroundColor White
Write-Host "      .\scripts\start.ps1" -ForegroundColor Gray
Write-Host ""
