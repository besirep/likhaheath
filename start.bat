@echo off
echo.
echo Initializing LikhaHealth Project...
echo.

:: Check if package.json exists (should be created by now)
if not exist "package.json" (
    echo [ERROR] Root package.json not found!
    pause
    exit /b
)

echo Step 1: Initializing Workspace & Dependencies...
call npm install --no-save concurrently
call npm install

echo.
echo Step 2: Starting Development Servers...
echo ──────────────────────────────────────────
call npm run dev
pause
