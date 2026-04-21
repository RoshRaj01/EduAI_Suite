@echo off
REM Start the backend with the new schema
cd /d C:\Users\Omkaar\Desktop\Projects\EduAI_Suite\backend
echo Stopping any existing backend processes...
taskkill /F /IM python.exe 2>nul
timeout /t 2
echo Starting backend...
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
