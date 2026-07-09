@echo off
setlocal enabledelayedexpansion
title LikhaHealth — Production Startup

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║        LikhaHealth — Production Start        ║
echo  ║        Angono Municipal Health Center        ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ─── CHECK: Node.js ───────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed or not on PATH.
    echo          Install Node.js v20 LTS from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('node -v') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% found.

:: ─── CHECK: PM2 ───────────────────────────────────────────────
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo  [WARN] PM2 not found. Installing globally...
    npm install -g pm2
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to install PM2.
        pause
        exit /b 1
    )
)
echo  [OK] PM2 found.

:: ─── STEP 1: Install dependencies (if node_modules missing) ───
if not exist "node_modules" (
    echo.
    echo  [Step 1] Installing dependencies...
    npm install --workspaces
    if %errorlevel% neq 0 (
        echo  [ERROR] npm install failed.
        pause
        exit /b 1
    )
) else (
    echo  [Step 1] Dependencies already installed. Skipping.
)

:: ─── STEP 2: Build React frontend ─────────────────────────────
echo.
echo  [Step 2] Building React frontend for production...
npm run build
if %errorlevel% neq 0 (
    echo  [ERROR] Vite build failed. Check the output above for errors.
    pause
    exit /b 1
)
echo  [OK] Frontend built successfully → server/public/

:: ─── STEP 3: Create logs directory ────────────────────────────
if not exist "logs" mkdir logs

:: ─── STEP 4: Start with PM2 ───────────────────────────────────
echo.
echo  [Step 3] Starting LikhaHealth API with PM2...
pm2 describe likhahealth-api >nul 2>&1
if %errorlevel% equ 0 (
    echo  [INFO] Existing PM2 process found. Restarting...
    pm2 restart likhahealth-api
) else (
    pm2 start ecosystem.config.js --env production
)

if %errorlevel% neq 0 (
    echo  [ERROR] PM2 failed to start. Falling back to direct node...
    echo.
    set NODE_ENV=production
    node server/server.js
    pause
    exit /b 1
)

:: ─── DONE ─────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║          LikhaHealth is now running!         ║
echo  ╠══════════════════════════════════════════════╣
echo  ║  Local:    http://localhost:5000             ║
echo  ║  Network:  http://192.168.1.10:5000          ║
echo  ║  Health:   http://localhost:5000/api/health  ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  To view logs:    pm2 logs likhahealth-api
echo  To stop server:  pm2 stop likhahealth-api
echo  To check status: pm2 status
echo.
pause
