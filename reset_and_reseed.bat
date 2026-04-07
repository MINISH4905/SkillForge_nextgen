@echo off
setlocal EnableDelayedExpansion
title SkillForge — DB Reset + Reseed

echo.
echo ============================================================
echo  🔥  SkillForge DB Reset + Reseed System v3.0
echo ============================================================
echo.

cd /d "%~dp0skillforge_v2"

echo [1/4] Flushing database...
python manage.py flush --no-input
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Database flush failed!
    pause & exit /b 1
)
echo       Done.

echo.
echo [2/4] Applying migrations...
python manage.py migrate --run-syncdb
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Migration failed!
    pause & exit /b 1
)
echo       Done.

echo.
echo [3/4] Clearing scenario memory cache...
# Skip memory reset if ai_engine is not available or handled internally
# python -c "import sys; sys.path.insert(0,'../ai_engine'); from services.memory_service import memory_service; memory_service.reset_memory(); print('       Memory cleared.')"

echo.
echo [4/4] Seeding deterministic tasks (5-domain central seeding)...
python manage.py seed_levels
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Task seeding failed!
    pause & exit /b 1
)

echo.
echo ============================================================
echo  ✅  SkillForge is ready! Tasks seeded across 5 domains.
echo ============================================================
echo.
pause
