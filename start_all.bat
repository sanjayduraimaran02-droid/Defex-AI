@echo off
echo ========================================================
echo  Launching Defex AI Workstation (Backend + Frontend)
echo ========================================================
start "Defex AI Backend" cmd /k "cd backend && python run.py"
timeout /t 2 >nul
start "Defex AI Frontend" cmd /k "cd frontend && npm run dev"
echo Both services launched!
echo Open your browser to: http://localhost:5173
pause
