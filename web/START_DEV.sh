#!/bin/bash
# Start React Dashboard Development Environment
#
# This script:
# 1. Stops any running Docker containers
# 2. Starts backend nodes WITHOUT dashboard container
# 3. Waits for health checks
# 4. Starts Vite dev server for React dashboard
#
# The React app runs on http://localhost:3001

set -e

echo "========================================="
echo "React Dashboard Development Setup"
echo "========================================="
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

echo "1. Stopping any existing containers..."
docker-compose -f docker-compose.local.yml down 2>/dev/null || true
echo "   ✓ Stopped"
echo ""

echo "2. Starting backend nodes (no dashboard container)..."
docker-compose \
  -f docker-compose.local.yml \
  -f docker-compose.local.dev.yml \
  -f docker-compose.local.dev-react.yml \
  up -d

echo "   ✓ Started: node1, node2, node3, nginx, jupyter"
echo ""

echo "3. Waiting for health checks..."
sleep 5

# Check nginx health
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo "   ✓ Nginx load balancer ready (:8080)"
else
    echo "   ⚠ Warning: Nginx not responding yet (give it a few seconds)"
fi

# Check node health
for port in 8081 8082 8083; do
    if curl -sf http://localhost:$port/health > /dev/null 2>&1; then
        echo "   ✓ Node on :$port ready"
    else
        echo "   ⚠ Warning: Node :$port not ready yet"
    fi
done

echo ""
echo "4. Starting React dashboard (Vite dev server)..."
echo ""
echo "========================================="
echo "Dashboard will open at:"
echo "http://localhost:3001"
echo "========================================="
echo ""
echo "API Backend: http://localhost:8080"
echo "Jupyter: http://localhost:8888"
echo ""
echo "Press Ctrl+C to stop the dev server"
echo "To stop backend nodes: ./run stop"
echo ""

cd web
exec pnpm dev
