#!/bin/bash

# Thai Binh University Training Platform - Status Check
# Usage: ./scripts/status.sh

echo "📊 Thai Binh University Training Platform - Status Check"
echo "========================================================="
echo ""

services=(
    "Gateway:8000"
    "Admin BFF:3001"
    "Teacher BFF:3002"
    "Student BFF:3003"
    "User Service:3004"
    "Course Service:3005"
    "Enrollment Service:3006"
)

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    
    if nc -z localhost "$port" 2>/dev/null; then
        echo "✅ $name (port $port)"
    else
        echo "❌ $name (port $port) - Not running"
    fi
done

echo ""
echo "📍 API Gateway: http://localhost:8000"
