@echo off
title Social Yolo - Image Service (MIGRATED)
echo.
echo ============================================================
echo   NOTICE: Python image service has been migrated!
echo.
echo   Background removal is now powered by native Node.js
echo   @imgly/background-removal-node (ONNX runtime) directly
echo   inside the NestJS backend (port 3001).
echo.
echo   You do NOT need to run this service anymore.
echo   Python, PyTorch, Uvicorn, and rembg are no longer needed.
echo.
echo   Simply run start-backend.bat and start-frontend.bat.
echo   Or run run.bat to start everything in two windows.
echo ============================================================
echo.
pause
