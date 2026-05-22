@echo off
title Stop KOT Print Agent
color 0C

echo.
echo  Stopping KOT Print Agent services...
echo.

:: Stop ngrok
taskkill /f /im ngrok.exe >nul 2>&1
echo  [x] ngrok stopped

:: Stop node processes on agent port (read from .env)
setlocal enabledelayedexpansion
set "AGENT_PORT=4000"
for /f "usebackq tokens=1,* delims==" %%a in ("%~dp0.env") do (
    if "%%a"=="AGENT_PORT" set "AGENT_PORT=%%b"
)

for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":!AGENT_PORT!" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%p >nul 2>&1
)
echo  [x] Print Agent stopped
echo.
echo  All services stopped.
echo.
pause
