@echo off
REM My-Neuro AI Virtual Companion Launcher (Silent Mode)
REM All services run in background, logs saved to ./logs/

cd /d %~dp0
title My-Neuro AI Launcher
echo ================================
echo   My-Neuro AI Launcher
echo   (Silent Mode - Services in Background)
echo ================================
echo.

REM Create logs directory
if not exist "logs" mkdir logs
set "LOG_DIR=%~dp0logs"
echo [Logs] Saved to: %LOG_DIR%
echo.

REM Find Python
set "PYEXE="
if exist "%~dp0env\python.exe" set "PYEXE=%~dp0env\python.exe"
if not defined PYEXE if exist "C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" set "PYEXE=C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe"
if not defined PYEXE set "PYEXE=python"
echo [Python] %PYEXE%
echo.

echo [1/5] Checking config file...
if not exist "live-2d\config.json" (
    echo [ERROR] Config file not found!
    pause
    exit /b 1
)
echo      OK - Config file found
echo.

echo [2/5] Starting ASR Service (port 1000) in background...
if not exist "full-hub\asr_api.py" (
    echo [ERROR] ASR service file not found!
    pause
    exit /b 1
)
start /B "" cmd /c "cd /d "%~dp0full-hub" && "%PYEXE%" asr_api.py > "%LOG_DIR%\asr.log" 2>&1"
echo      OK - ASR running, log: logs\asr.log
timeout /t 2 /nobreak >/dev/null

echo [3/5] Starting BERT Service (port 6007) in background...
if not exist "full-hub\omni_bert_api.py" (
    echo [ERROR] BERT service file not found!
    pause
    exit /b 1
)
start /B "" cmd /c "cd /d "%~dp0full-hub" && "%PYEXE%" omni_bert_api.py > "%LOG_DIR%\bert.log" 2>&1"
echo      OK - BERT running, log: logs\bert.log
timeout /t 2 /nobreak >/dev/null

echo [4/5] Starting TTS Service (GPU, port 5000) in background...
if not exist "full-hub\tts-hub\GPT-SoVITS-Bundle\api.py" (
    echo [ERROR] TTS service file not found!
    pause
    exit /b 1
)
echo      Note: GPU model loading takes 30-60 seconds...
start /B "" cmd /c "cd /d "%~dp0full-hub\tts-hub\GPT-SoVITS-Bundle" && set "PATH=%~dp0full-hub\tts-hub\GPT-SoVITS-Bundle\runtime;%PATH%" && runtime\python.exe api.py -p 5000 -d cuda -s role_voice_api/neuro/merge.pth -dr role_voice_api/neuro/01.wav -dt "Hold on please, I'm busy." -dl "en" > "%LOG_DIR%\tts.log" 2>&1"
echo      OK - TTS running, log: logs\tts.log
timeout /t 2 /nobreak >/dev/null

echo [5/5] Starting Main Program (Live2D)...
echo.
echo All services are running in background.
echo Logs: %LOG_DIR%
echo.
echo Press Ctrl+C to stop this launcher and view service status.
echo Services will keep running in background until manually stopped.
echo.
timeout /t 8 /nobreak >/dev/null

cd /d %~dp0live-2d
if exist ".\node\node.exe" (
    echo      Launching Live2D with built-in node...
    chcp 65001 >/dev/null
    .\node\node.exe .\node_modules\electron\cli.js .
) else (
    echo      Launching Live2D with system node...
    where node >/dev/null 2>&1
    if errorlevel 1 (
        echo [ERROR] node.exe not found!
        pause
        exit /b 1
    )
    chcp 65001 >/dev/null
    node .\node_modules\electron\cli.js .
)

echo.
echo ================================
echo   Service Status
echo ================================
echo.
echo Live2D exited. Background services are still running.
echo.
echo To view logs:
echo   - ASR:  logs\asr.log
echo   - BERT: logs\bert.log
echo   - TTS:  logs\tts.log
echo.
echo To stop services, use Task Manager to end:
echo   - python.exe (multiple instances)
echo.
echo Press any key to check current service ports...
pause >/dev/null

echo.
echo Checking active services...
netstat -ano | findstr ":1000 :5000 :6007" | findstr "LISTENING"
echo.
echo Above ports should show if services are still running.
echo.
pause
