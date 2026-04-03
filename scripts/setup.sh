#!/bin/bash

# Thai Binh University Training Platform - Setup Script
# Usage: ./scripts/setup.sh

set -e

cd "$(dirname "$0")/.."

echo "🔧 Thai Binh University Training Platform - Setup"
echo "=================================================="
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo -n "⚠️  .env file already exists. Overwrite? (y/N): "
    read -r response
    if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "🎲 Generating secure secrets..."

# Generate secrets (base64 encoded random bytes)
generate_secret() {
    openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64
}

BETTER_AUTH_SECRET=$(generate_secret)
JWT_SECRET=$(generate_secret)

# Create root .env
cat > .env << EOF
# Thai Binh University Training Platform - Environment Configuration
# Generated: $(date)

# Node Environment
NODE_ENV=development

# Database Configuration (libsql/Turso)
DATABASE_URL=file:./data/dev.db
DATABASE_AUTH_TOKEN=

# Better Auth Configuration
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
BETTER_AUTH_URL=http://localhost:8000

# JWT Secret for Gateway
JWT_SECRET=$JWT_SECRET

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8000
EOF

echo "✅ Created root .env"

# Create gateway .env
cat > apps/gateway/.env << EOF
# Gateway Environment Configuration
NODE_ENV=development
PORT=8000

# JWT Secret for token verification
JWT_SECRET=$JWT_SECRET

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
EOF

echo "✅ Created apps/gateway/.env"

# Create BFF .env files
for service in admin-bff:3001 teacher-bff:3002 student-bff:3003; do
    IFS=':' read -r name port <<< "$service"
    short_name=$(echo "$name" | sed 's/-bff//')
    display_name=$(echo "$short_name" | awk '{print toupper(substr($0,1,1))substr($0,2)}')
    
    cat > "apps/$name/.env" << EOF
# $display_name BFF Environment Configuration
NODE_ENV=development
PORT=$port

# Database
DATABASE_URL=file:./data/$short_name.db
DATABASE_AUTH_TOKEN=

# Auth
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
BETTER_AUTH_URL=http://localhost:8000
JWT_SECRET=$JWT_SECRET

# Core Service URLs
USER_SERVICE_URL=http://localhost:3004
COURSE_SERVICE_URL=http://localhost:3005
ENROLLMENT_SERVICE_URL=http://localhost:3006

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
EOF
    
    echo "✅ Created apps/$name/.env"
done

# Create core service .env files
for service in user-service:3004 course-service:3005 enrollment-service:3006; do
    IFS=':' read -r name port <<< "$service"
    db_name=$(echo "$name" | sed 's/-service//')
    display_name=$(echo "$db_name" | awk '{print toupper(substr($0,1,1))substr($0,2)}')
    
    cat > "apps/$name/.env" << EOF
# $display_name Service Environment Configuration
NODE_ENV=development
PORT=$port

# Database
DATABASE_URL=file:./data/$db_name.db
DATABASE_AUTH_TOKEN=

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8000
EOF
    
    echo "✅ Created apps/$name/.env"
done

# Create data directories
mkdir -p data apps/user-service/data apps/course-service/data apps/enrollment-service/data \
         apps/admin-bff/data apps/teacher-bff/data apps/student-bff/data

echo "✅ Created data directories"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. bun install          # Install dependencies"
echo "  2. ./scripts/start.sh   # Start all services"
echo ""
echo "📍 API Gateway will be available at: http://localhost:8000"
