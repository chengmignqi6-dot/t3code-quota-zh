@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\install.ps1" -Mode restore %*
set "RESULT=%ERRORLEVEL%"
echo.
pause
exit /b %RESULT%
