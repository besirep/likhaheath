@echo off
setlocal
title LikhaHealth — Adviser Local Setup

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║         LikhaHealth — Adviser Quick Start           ║
echo  ║         Local Development Mode (localhost)          ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo  Please install Node.js v20 LTS from: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('node -v') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% detected.

:: Install dependencies if needed
if not exist "node_modules" (
    echo.
    echo  [1/2] Installing dependencies (first run only, please wait)...
    call npm run install:all
    if %errorlevel% neq 0 (
        echo  [ERROR] npm install failed. Check your internet connection.
        pause
        exit /b 1
    )
)

echo.
echo  [2/2] Starting LikhaHealth in development mode...
echo.
echo  ─────────────────────────────────────────────────────────────
echo  Once started, open your browser and go to:
echo.
echo    http://localhost:5173     ← Main application
echo    http://localhost:5000/api/health  ← API health check
echo.
echo  Default login accounts (from seed.sql):
echo    Admin:       admin@likhahealth.com  / Admin@2025!
echo    Doctor:      Check seed.sql for doctor accounts
echo    Receptionist: Check seed.sql for receptionist accounts
echo.
echo  Press Ctrl+C to stop both servers when done.
echo  ─────────────────────────────────────────────────────────────
echo.

call npm start
pause
