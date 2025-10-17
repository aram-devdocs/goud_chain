#!/bin/bash
# Start React Dashboard Development Environment
#
# This script:
# 1. Starts backend nodes WITHOUT dashboard container (via ./run dev-perf)
# 2. Waits for health checks
# 3. Starts Vite dev server for React dashboard
#
# The React app runs on http://localhost:3001

set -e

# Navigate to project root
cd "$(dirname "$0")/.."

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║  🚀 React Dashboard Development Environment           ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if backend is already running
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo "✓ Backend already running"
else
    echo "Starting backend nodes (this may take 30-60 seconds)..."
    echo ""
    
    # Start in background, capture PID
    ./run dev-perf > /tmp/goud-backend.log 2>&1 &
    BACKEND_PID=$!
    
    echo "Waiting for backend to start..."
    for i in {1..60}; do
        if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
            echo "✓ Backend ready!"
            break
        fi
        if [ $i -eq 60 ]; then
            echo "⚠️  Backend taking longer than expected. Check logs:"
            echo "   tail -f /tmp/goud-backend.log"
        fi
        sleep 1
    done
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Backend Services:                                     ║"
echo "║  • Nginx Load Balancer: http://localhost:8080          ║"
echo "║  • Node 1: http://localhost:8081                       ║"
echo "║  • Node 2: http://localhost:8082                       ║"
echo "║  • Node 3: http://localhost:8083                       ║"
echo "║  • Jupyter Lab: http://localhost:8888                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Health check summary
echo "Quick health check:"
for port in 8080 8081 8082 8083; do
    if curl -sf http://localhost:$port/health > /dev/null 2>&1; then
        echo "  ✓ Port $port: OK"
    else
        echo "  ⚠ Port $port: Not responding"
    fi
done

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║  Starting React Dashboard...                          ║"
echo "║  📱 http://localhost:3001                              ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop the dev server (backend keeps running)"
echo "To stop backend: cd /workspace && ./run stop"
echo ""

cd web
exec pnpm dev
