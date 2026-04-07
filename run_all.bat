@echo off
title SkillForge Production Hub
echo ===========================================
echo ⚔️ Starting SkillForge Production Environment
echo ===========================================
cd %~dp0

echo [1/2] Launching AI Engine (FastAPI on 8001)...
start "SkillForge AI Engine" cmd /k "cd ai_engine && ..\pytorch_env\Scripts\activate.bat && python -m uvicorn main:app --port 8001"

echo [2/2] Launching Core Platform (Django on 8000)...
start "SkillForge Django Backend" cmd /k "cd backend && ..\pytorch_env\Scripts\activate.bat && python manage.py runserver 8000"

echo.
echo 🚀 All systems are launching!
echo ⏳ Waiting 5 seconds for model initialization...
timeout /t 5 /nobreak > nul

echo 🌐 Opening SkillForge UI...
start http://127.0.0.1:8000/
echo ===========================================
echo READY! The Forge is hot.
echo ===========================================
pause
