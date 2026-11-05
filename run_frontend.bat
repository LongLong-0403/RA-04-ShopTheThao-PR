@echo off
chcp 65001 >nul
cd /d "%~dp0frontend"
echo [Frontend] Dang mo trinh duyet tai http://127.0.0.1:5500/index.html ...
start "" "http://127.0.0.1:5500/index.html"
python -m http.server 5500 --bind 127.0.0.1
pause
