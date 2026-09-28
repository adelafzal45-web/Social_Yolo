@echo off
title Social Yolo - backend
if exist "%~dp0Social_Yolo_BE\Backend" (
  cd /d "%~dp0Social_Yolo_BE\Backend"
) else (
  cd /d "%~dp0Social_Yolo\Backend"
)
set PORT=3001
echo ============================================================
echo   NestJS backend  ->  http://localhost:3001/api
echo ============================================================
call npm run start:dev

