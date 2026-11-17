@echo off
cd /d "%~dp0"
start "" cmd /c "timeout /t 2 >nul & start http://127.0.0.1:8094/"
py -3 -m http.server 8094 --bind 127.0.0.1