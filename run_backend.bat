@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
echo [Backend] Dang khoi dong FastAPI tai http://127.0.0.1:8000 ...
echo [Backend] Tai lieu API (Swagger): http://127.0.0.1:8000/docs
call .venv\Scripts\activate.bat
uvicorn app.main:app --reload --reload-include ".env" --host 127.0.0.1 --port 8000
pause
