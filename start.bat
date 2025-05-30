@echo off
echo Starting AutoState...
echo.
echo Make sure you have:
echo 1. Python virtual environment activated
echo 2. .env file configured in backend folder
echo 3. Dependencies installed (pip install -r requirements.txt, npm install)
echo.
echo Starting Backend Server...
start cmd /k "cd backend && python main.py"
echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul
echo.
echo Starting Frontend Server...
start cmd /k "cd frontend && npm start"
echo.
echo AutoState is starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul 