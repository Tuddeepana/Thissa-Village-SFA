@echo off
title KOT Print Agent - Tissa Village
color 0A

echo.
echo  ====================================================
echo          KOT PRINT AGENT - TISSA VILLAGE
echo  ====================================================
echo.

:: ── Read .env file ──────────────────────────────────────────────────
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Parse .env values
for /f "usebackq tokens=1,* delims==" %%a in ("%SCRIPT_DIR%.env") do (
    set "line=%%a"
    if not "!line:~0,1!"=="#" (
        set "%%a=%%b"
    )
)

:: Enable delayed expansion after setting vars (re-read with delayed expansion)
setlocal enabledelayedexpansion

:: Re-parse .env with delayed expansion enabled
for /f "usebackq tokens=1,* delims==" %%a in ("%SCRIPT_DIR%.env") do (
    set "firstchar=%%a"
    set "firstchar=!firstchar:~0,1!"
    if not "!firstchar!"=="#" (
        if not "%%b"=="" (
            set "%%a=%%b"
        )
    )
)

echo  [1/4] Checking configuration...
echo.

if "!NGROK_DOMAIN!"=="" (
    echo  ERROR: NGROK_DOMAIN not set in .env
    echo  Please edit .env and set your ngrok static domain.
    pause
    exit /b 1
)

if "!NGROK_AUTHTOKEN!"=="your-ngrok-authtoken-here" (
    echo  ERROR: NGROK_AUTHTOKEN not configured in .env
    echo  Get your authtoken from https://dashboard.ngrok.com
    pause
    exit /b 1
)

if "!AGENT_PORT!"=="" set "AGENT_PORT=4000"

echo   Agent Port : !AGENT_PORT!
echo   Printer    : !PRINTER_IP!:!PRINTER_PORT!
echo   ngrok      : !NGROK_DOMAIN!
echo.

:: ── Kill any existing instances ──────────────────────────────────────
echo  [2/4] Stopping any existing instances...
taskkill /f /im ngrok.exe >nul 2>&1
:: Kill node processes running on the agent port
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":!AGENT_PORT!" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%p >nul 2>&1
)
echo   Done.
echo.

:: ── Start Print Agent ────────────────────────────────────────────────
echo  [3/4] Starting Print Agent on port !AGENT_PORT!...
start /b /min "PrintAgent" cmd /c "cd /d "%SCRIPT_DIR%" && node index.js"
timeout /t 2 /nobreak >nul
echo   Print Agent started.
echo.

:: ── Start ngrok ──────────────────────────────────────────────────────
echo  [4/4] Starting ngrok tunnel...
start /b /min "ngrok" cmd /c "ngrok http !AGENT_PORT! --domain=!NGROK_DOMAIN! --authtoken=!NGROK_AUTHTOKEN!"
timeout /t 3 /nobreak >nul
echo   ngrok tunnel started.
echo.

:: ── Verify ───────────────────────────────────────────────────────────
echo  ====================================================
echo   ALL SERVICES STARTED SUCCESSFULLY!
echo  ====================================================
echo.
echo   Print Agent : http://localhost:!AGENT_PORT!
echo   Public URL  : https://!NGROK_DOMAIN!
echo.
echo   This URL never changes. Set it once in SFA:
echo     Settings ^> Printer Setup ^> Agent URL
echo.
echo  ====================================================
echo   DO NOT CLOSE THIS WINDOW
echo   (Minimize it to keep printing working)
echo  ====================================================
echo.

:: Keep window alive
cmd /k "echo Printer agent is running... Press Ctrl+C to stop."
