@echo off
setlocal
echo Freeing ports 3001, 3000 (if already in use)...
powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort 3000, 3001 -ErrorAction SilentlyContinue) | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; exit 0" >nul 2>&1
for %%P in (3001 3000) do for /f "tokens=5" %%a in ('netstat -ano ^| findstr /C:":%%P " ^| findstr /C:"LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo Starting backend (port 3001)...
start "Social Yolo - Backend" cmd /k "%~dp0start-backend.bat"

echo Starting frontend (port 3000)...
start "Social Yolo - Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo ============================================================
echo   Social Yolo is starting in TWO windows (No Python needed!)
echo.
echo   Background removal is now powered by native Node.js
echo   @imgly/background-removal-node (ONNX) inside NestJS.
echo.
echo   When the FRONTEND window shows "Ready", open:
echo.
echo       http://localhost:3000
echo.
echo   To stop: close the two windows or press Ctrl+C in each.
echo ============================================================
echo.
pause
endlocal
