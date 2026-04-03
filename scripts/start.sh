#!/bin/bash

# Thai Binh University Training Platform - Startup Script
# Usage: ./start.sh [dev|prod]

set -e

MODE=${1:-dev}

echo "🚀 Thai Binh University Training Platform"
echo "=========================================="
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

# Build packages if needed
if [ ! -d "packages/database/node_modules" ]; then
    echo "🔨 Building packages..."
    bun run build --filter=@thai-binh/database
    bun run build --filter=@thai-binh/types
    bun run build --filter=@thai-binh/utils
    bun run build --filter=@thai-binh/config
    bun run build --filter=@thai-binh/auth
fi

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "🌟 Starting services in $MODE mode..."
echo ""

if [ "$MODE" == "dev" ]; then
    # Start all services in dev mode
    echo "Starting Gateway (port 8000)..."
    cd apps/gateway && bun run dev &
    
    echo "Starting User Service (port 3004)..."
    cd ../user-service && bun run dev &
    
    echo "Starting Course Service (port 3005)..."
    cd ../course-service && bun run dev &
    
    echo "Starting Enrollment Service (port 3006)..."
    cd ../enrollment-service && bun run dev &
    
    echo "Starting Admin BFF (port 3001)..."
    cd ../admin-bff && bun run dev &
    
    echo "Starting Teacher BFF (port 3002)..."
    cd ../teacher-bff && bun run dev &
    
    echo "Starting Student BFF (port 3003)..."
    cd ../student-bff && bun run dev &
    
    echo ""
    echo "✅ All services started!"
    echo ""
    echo "📍 API Gateway: http://localhost:8000"
    echo "   - /api/admin/*   → Admin BFF (port 3001)"
    echo "   - /api/teacher/* → Teacher BFF (port 3002)"
    echo "   - /api/student/* → Student BFF (port 3003)"
    echo ""
    echo "🛑 Press Ctrl+C to stop all services"
    
else
    # Production mode
    echo "Starting services in production mode..."
    
    bun run build
    
    echo "Starting Gateway..."
    cd apps/gateway && bun run start &
    
    echo "Starting User Service..."
    cd ../user-service && bun run start &
    
    echo "Starting Course Service..."
    cd ../course-service && bun run start &
    
    echo "Starting Enrollment Service..."
    cd ../enrollment-service && bun run start &
    
    echo "Starting Admin BFF..."
    cd ../admin-bff && bun run start &
    
    echo "Starting Teacher BFF..."
    cd ../teacher-bff && bun run start &
    
    echo "Starting Student BFF..."
    cd ../student-bff && bun run start &
    
    echo ""
    echo "✅ Production services started!"
fi

# Wait for all background jobs
wait
