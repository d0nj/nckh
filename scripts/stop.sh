#!/bin/bash

# Thai Binh University Training Platform - Stop Script
# Usage: ./scripts/stop.sh

echo "🛑 Stopping all services..."

# Find and kill bun processes related to our services
pkill -f "bun.*(gateway|user-service|course-service|enrollment-service|admin-bff|teacher-bff|student-bff)" 2>/dev/null || true

echo "✅ All services stopped"
