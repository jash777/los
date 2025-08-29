@echo off
REM Comprehensive End-to-End LOS Testing Script for Windows
REM This script runs the complete loan origination system test

echo 🚀 LOS Comprehensive End-to-End Testing
echo ========================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if the server is running
echo 🔍 Checking if LOS server is running...
curl -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ LOS server is not running on localhost:3000
    echo Please start the server with: npm start
    pause
    exit /b 1
) else (
    echo ✅ LOS server is running
)

echo.
echo 📋 Test Options:
echo 1. Run Comprehensive E2E Test (Automated)
echo 2. Run Manual Stage Testing (Interactive)
echo 3. Setup Demo Data
echo 4. Check System Status
echo.

set /p choice="Select option (1-4): "

if "%choice%"=="1" (
    echo.
    echo 🤖 Running Comprehensive End-to-End Test...
    echo This will test two applications through all 7 stages
    echo.
    node src/scripts/comprehensive-end-to-end-test.js
) else if "%choice%"=="2" (
    echo.
    echo 🧪 Starting Manual Stage Testing...
    echo This provides interactive control over each stage
    echo.
    node src/scripts/manual-stage-testing.js
) else if "%choice%"=="3" (
    echo.
    echo 🎭 Setting up demo data...
    node src/scripts/manage-underwriting-status.js demo
) else if "%choice%"=="4" (
    echo.
    echo 📊 Checking system status...
    echo.
    echo === API Health ===
    curl -s http://localhost:3000/health
    echo.
    echo === API Info ===
    curl -s http://localhost:3000/api
    echo.
    echo === Underwriting Stats ===
    curl -s http://localhost:3000/api/underwriting-status/stats
) else (
    echo ❌ Invalid option
    pause
    exit /b 1
)

echo.
echo ✅ Test execution completed!
echo Check the logs above for detailed results.
pause
