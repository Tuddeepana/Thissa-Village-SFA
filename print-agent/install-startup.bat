@echo off
title Install KOT Print Agent to Windows Startup
color 0B

echo.
echo  ====================================================
echo   INSTALL KOT PRINT AGENT TO WINDOWS STARTUP
echo  ====================================================
echo.
echo  This will make the Print Agent start automatically
echo  when any user logs into this computer.
echo.

set "SCRIPT_DIR=%~dp0"
set "TARGET=%SCRIPT_DIR%start-printer.bat"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_DIR%\KOT Print Agent.lnk"

:: Check if start-printer.bat exists
if not exist "%TARGET%" (
    echo  ERROR: start-printer.bat not found!
    echo  Make sure this script is in the print-agent folder.
    pause
    exit /b 1
)

:: Create shortcut using PowerShell
echo  Creating startup shortcut...
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.WindowStyle = 7; $s.Description = 'KOT Print Agent - Tissa Village'; $s.Save()"

if exist "%SHORTCUT%" (
    echo.
    echo  ====================================================
    echo   INSTALLED SUCCESSFULLY!
    echo  ====================================================
    echo.
    echo   Shortcut created at:
    echo   %SHORTCUT%
    echo.
    echo   The Print Agent will now start automatically
    echo   when a user logs into Windows.
    echo.
    echo   To remove: delete the shortcut from
    echo   %STARTUP_DIR%
    echo.
) else (
    echo.
    echo  ERROR: Failed to create shortcut.
    echo  You can manually add start-printer.bat to your
    echo  Startup folder:
    echo    1. Press Win+R
    echo    2. Type: shell:startup
    echo    3. Create a shortcut to start-printer.bat
    echo.
)

pause
