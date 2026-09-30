@echo off
title Social Yolo - backend

rem Resolve the backend folder for the current layout (Backend\ at the repo root)
rem as well as the legacy nested layouts (Social_Yolo_BE\Backend, Social_Yolo\Backend).
set "BACKEND_DIR="
if exist "%~dp0Backend\package.json" set "BACKEND_DIR=%~dp0Backend"
if not defined BACKEND_DIR if exist "%~dp0Social_Yolo_BE\Backend\package.json" set "BACKEND_DIR=%~dp0Social_Yolo_BE\Backend"
if not defined BACKEND_DIR if exist "%~dp0Social_Yolo\Backend\package.json" set "BACKEND_DIR=%~dp0Social_Yolo\Backend"

if not defined BACKEND_DIR (
  echo [ERROR] Could not find the NestJS backend folder next to this script.
  echo         Expected one of: Backend\  Social_Yolo_BE\Backend\  Social_Yolo\Backend\
  echo.
  pause
  exit /b 1
)

cd /d "%BACKEND_DIR%"
set PORT=3001
echo ============================================================
echo   NestJS backend  ->  http://localhost:3001/api
echo ============================================================
call npm run start:dev

