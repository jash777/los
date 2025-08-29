#!/bin/bash

# Comprehensive End-to-End LOS Testing Script
# This script runs the complete loan origination system test

echo "🚀 LOS Comprehensive End-to-End Testing"
echo "========================================"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if the server is running
echo "🔍 Checking if LOS server is running..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ LOS server is running"
else
    echo "❌ LOS server is not running on localhost:3000"
    echo "Please start the server with: npm start"
    exit 1
fi

echo ""
echo "📋 Test Options:"
echo "1. Run Comprehensive E2E Test (Automated)"
echo "2. Run Manual Stage Testing (Interactive)"
echo "3. Setup Demo Data"
echo "4. Check System Status"
echo ""

read -p "Select option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🤖 Running Comprehensive End-to-End Test..."
        echo "This will test two applications through all 7 stages"
        echo ""
        node src/scripts/comprehensive-end-to-end-test.js
        ;;
    2)
        echo ""
        echo "🧪 Starting Manual Stage Testing..."
        echo "This provides interactive control over each stage"
        echo ""
        node src/scripts/manual-stage-testing.js
        ;;
    3)
        echo ""
        echo "🎭 Setting up demo data..."
        node src/scripts/manage-underwriting-status.js demo
        ;;
    4)
        echo ""
        echo "📊 Checking system status..."
        echo ""
        echo "=== API Health ==="
        curl -s http://localhost:3000/health | jq '.' || echo "Health check failed"
        echo ""
        echo "=== API Info ==="
        curl -s http://localhost:3000/api | jq '.data.availablePhases[] | {phase: .phase, name: .name, status: .status}' || echo "API info failed"
        echo ""
        echo "=== Underwriting Stats ==="
        curl -s http://localhost:3000/api/underwriting-status/stats | jq '.stats' || echo "Stats check failed"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "✅ Test execution completed!"
echo "Check the logs above for detailed results."
