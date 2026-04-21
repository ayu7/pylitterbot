@echo off
REM Quick start script for the Litter Robot UI (Windows)

echo.
echo 🤖 Litter Robot UI - Quick Start
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install it first.
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python is not installed. Please install it first.
    exit /b 1
)

echo ✅ Prerequisites found
echo.

REM Setup Backend
echo Setting up backend...
cd ui-backend

if not exist "venv" (
    python -m venv venv
    echo ✅ Virtual environment created
)

call venv\Scripts\activate.bat

pip install -r requirements.txt >nul
echo ✅ Backend dependencies installed

if not exist ".env" (
    copy .env.example .env
    echo ⚠️  Created .env file - please edit with your credentials
)

cd ..

REM Setup Frontend
echo.
echo Setting up frontend...
cd ui-frontend

if not exist "node_modules" (
    call npm install >nul
    echo ✅ Frontend dependencies installed
)

cd ..

echo.
echo 🎉 Setup complete!
echo.
echo To start developing:
echo.
echo Terminal 1 - Backend:
echo   cd ui-backend
echo   venv\Scripts\activate
echo   python main.py
echo.
echo Terminal 2 - Frontend:
echo   cd ui-frontend
echo   npm run dev
echo.
echo Then open http://localhost:3000 in your browser
