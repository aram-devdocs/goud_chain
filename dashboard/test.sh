#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Testing dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Warning: Node.js not found. Skipping JavaScript syntax check."
else
    # Check server.js syntax
    echo "Checking server.js syntax..."
    node --check "$SCRIPT_DIR/server.js" || {
        echo "Error: server.js has syntax errors."
        exit 1
    }
fi

# Basic HTML validation - check for common issues
echo "Validating HTML structure..."
if [ -f "$SCRIPT_DIR/index.html" ]; then
    # Check for basic HTML structure
    if ! grep -q "<html" "$SCRIPT_DIR/index.html"; then
        echo "Error: index.html missing <html> tag"
        exit 1
    fi
    if ! grep -q "<head" "$SCRIPT_DIR/index.html"; then
        echo "Error: index.html missing <head> tag"
        exit 1
    fi
    if ! grep -q "<body" "$SCRIPT_DIR/index.html"; then
        echo "Error: index.html missing <body> tag"
        exit 1
    fi
    echo "HTML validation passed."
else
    echo "Warning: index.html not found."
fi

echo "Dashboard tests passed!"
