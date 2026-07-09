@echo off
setlocal enabledelayedexpansion
title LikhaHealth — First-Time Setup (deploy.bat)

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║        LikhaHealth — First-Time Deployment Setup     ║
echo  ║        Angono Municipal Health Center                ║
echo  ║        Run this ONCE on the server PC                ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  This script will:
echo    1. Verify prerequisites (Node.js, npm)
echo    2. Install all project dependencies
echo    3. Install PM2 globally
echo    4. Generate a secure JWT secret
echo    5. Guide you through .env configuration
echo    6. Build the frontend for production
echo    7. Configure PM2 to start on Windows boot
echo.
pause

:: ─── CHECK: Node.js ───────────────────────────────────────────
echo.
echo  [Check 1/2] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is NOT installed.
    echo.
    echo  Please install Node.js v20 LTS from:
    echo    https://nodejs.org/en/download
    echo.
    echo  Re-run this script after installation.
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('node -v') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% is installed.

:: ─── CHECK: npm ───────────────────────────────────────────────
echo  [Check 2/2] Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] npm not found. Re-install Node.js.
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('npm -v') do set NPM_VER=%%v
echo  [OK] npm v%NPM_VER% is installed.

:: ─── INSTALL PM2 ──────────────────────────────────────────────
echo.
echo  [Step 1/6] Installing PM2 process manager globally...
where pm2 >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] PM2 already installed. Skipping.
) else (
    npm install -g pm2
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to install PM2.
        pause
        exit /b 1
    )
    echo  [OK] PM2 installed.
)

:: ─── INSTALL CROSS-ENV ────────────────────────────────────────
echo.
echo  [Step 2/6] Installing project dependencies...
call npm install --workspaces
if %errorlevel% neq 0 (
    echo  [ERROR] Dependency installation failed.
    pause
    exit /b 1
)
echo  [OK] All dependencies installed.

:: ─── GENERATE JWT SECRET ──────────────────────────────────────
echo.
echo  [Step 3/6] Generating secure JWT secret...
for /f %%i in ('node -e "process.stdout.write(require('crypto').randomBytes(64).toString('hex'))"') do set JWT_SEC=%%i
echo  [OK] JWT Secret generated: %JWT_SEC%
echo.
echo  ─────────────────────────────────────────────────────────
echo  ACTION REQUIRED — Configure server\.env:
echo  ─────────────────────────────────────────────────────────
echo.
echo  Open: %~dp0server\.env
echo.
echo  Set the following values:
echo    JWT_SECRET=%JWT_SEC%
echo    NODE_ENV=production
echo    CORS_ORIGIN=http://[THIS-PC-LAN-IP]:5000
echo.
echo  Common LAN IPs to try:
echo    192.168.1.10   (default — change if different)
echo    192.168.1.11   (backup)
echo    192.168.0.10   (alternate subnet)
echo.
echo  To find this PC's LAN IP, run:  ipconfig
echo  Look for "IPv4 Address" under your network adapter.
echo.
echo  Also set your MySQL root password if XAMPP has one configured.
echo  ─────────────────────────────────────────────────────────
echo.
echo  Press any key AFTER you have updated server\.env...
pause

:: ─── DATABASE REMINDER ────────────────────────────────────────
echo.
echo  [Step 4/6] Database setup reminder:
echo  ─────────────────────────────────────────────────────────
echo  Before continuing, ensure:
echo    1. XAMPP is installed and MySQL is running
echo    2. You have imported database\schema.sql into phpMyAdmin
echo    3. You have imported database\seed.sql for initial data
echo.
echo  Open phpMyAdmin at: http://localhost/phpmyadmin
echo  ─────────────────────────────────────────────────────────
echo  Press any key once the database is ready...
pause

:: ─── BUILD FRONTEND ───────────────────────────────────────────
echo.
echo  [Step 5/6] Building React frontend...
call npm run build
if %errorlevel% neq 0 (
    echo  [ERROR] Vite build failed. Fix the errors above and re-run.
    pause
    exit /b 1
)
echo  [OK] Frontend built → server/public/

:: ─── CREATE LOGS DIR ──────────────────────────────────────────
if not exist "logs" mkdir logs

:: ─── START WITH PM2 + CONFIGURE STARTUP ───────────────────────
echo.
echo  [Step 6/6] Starting with PM2 and configuring auto-startup...
call pm2 start ecosystem.config.js --env production
if %errorlevel% neq 0 (
    echo  [ERROR] PM2 start failed.
    pause
    exit /b 1
)

call pm2 save
echo  [OK] PM2 process saved.

echo.
echo  ─────────────────────────────────────────────────────────
echo  IMPORTANT: To make LikhaHealth start automatically on
echo  Windows boot, run the following in an Administrator
echo  Command Prompt:
echo.
echo    npm install -g pm2-windows-startup
echo    pm2-windows-startup install
echo    pm2 save
echo  ─────────────────────────────────────────────────────────
echo.

:: ─── DONE ─────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║           DEPLOYMENT SETUP COMPLETE!                 ║
echo  ╠══════════════════════════════════════════════════════╣
echo  ║  App URL:   http://[THIS-PC-LAN-IP]:5000            ║
echo  ║  Default:   http://192.168.1.10:5000                ║
echo  ║  Health:    http://192.168.1.10:5000/api/health     ║
echo  ╠══════════════════════════════════════════════════════╣
echo  ║  Useful commands:                                    ║
echo  ║    pm2 status              — check running status    ║
echo  ║    pm2 logs likhahealth-api — view live logs         ║
echo  ║    pm2 restart likhahealth-api — restart server      ║
echo  ║    pm2 stop likhahealth-api — stop server            ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
pause
