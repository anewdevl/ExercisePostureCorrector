@echo off
echo Starting AI Fitness Trainer...

REM Activate virtual environment if it exists
if exist ..\fitness_env\Scripts\activate.bat (
    call ..\fitness_env\Scripts\activate.bat
)

REM Start Flask backend in a new window
start cmd /k "python run.py"

REM Wait for Flask to start
echo Waiting for Flask backend to start...
timeout /t 3 /nobreak > nul

REM Start React frontend in a new window
cd frontend
start cmd /k "npm start"

REM Open browser after a brief delay
echo Waiting for application to start...
timeout /t 5 /nobreak > nul
start http://localhost:3000

echo Servers started! Close the command windows when you're done.
pause 