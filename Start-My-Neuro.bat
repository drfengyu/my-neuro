@echo off
REM My-Neuro AI Virtual Companion Launcher
REM Starts ASR, BERT, GPU TTS, and Live2D frontend

cd /d %~dp0
title My-Neuro AI Launcher
echo ================================
echo   My-Neuro AI Launcher
echo ================================
echo.

REM Find Python (priority: env/python -> hermes venv -> system python)
set "PYEXE="
if exist "%~dp0env\python.exe" set "PYEXE=%~dp0env\python.exe"
if not defined PYEXE if exist "C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" set "PYEXE=C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe"
if not defined PYEXE set "PYEXE=python"
echo [Python] %PYEXE%
echo.

echo [1/5] Checking config file...
if not exist "live-2d\config.json" (
    echo [ERROR] Config file not found!
    echo Path: %~dp0live-2d\config.json
    pause
    exit /b 1
)
echo      OK - Config file found
echo.

echo [2/5] Starting ASR Service (Speech Recognition / CPU, port 1000)...
if not exist "full-hub\asr_api.py" (
    echo [ERROR] ASR service file not found!
    pause
    exit /b 1
)
start "ASR Service" cmd /c "chcp 65001 >nul && cd /d "%~dp0full-hub" && "%PYEXE%" asr_api.py & pause"
echo      OK - ASR service window launched
timeout /t 3 /nobreak >nul

echo [3/5] Starting BERT Service (Emotion Classification / CPU, port 6007)...
if not exist "full-hub\omni_bert_api.py" (
    echo [ERROR] BERT service file not found!
    pause
    exit /b 1
)
start "BERT Service" cmd /c "chcp 65001 >nul && cd /d "%~dp0full-hub" && "%PYEXE%" omni_bert_api.py & pause"
echo      OK - BERT service window launched
timeout /t 3 /nobreak >nul

echo [4/5] Starting TTS Service (GPT-SoVITS / GPU CUDA, port 5000)...
if not exist "full-hub\tts-hub\GPT-SoVITS-Bundle\api.py" (
    echo [ERROR] TTS service file not found!
    pause
    exit /b 1
)
echo      Note: GPU model loading takes 30-60 seconds...
start "TTS Service (GPU)" cmd /c "chcp 65001 >nul && cd /d "%~dp0full-hub\tts-hub\GPT-SoVITS-Bundle" && set "PATH=%~dp0full-hub\tts-hub\GPT-SoVITS-Bundle\runtime;%PATH%" && runtime\python.exe api.py -p 5000 -d cuda -s role_voice_api/neuro/merge.pth -dr role_voice_api/neuro/01.wav -dt "Hold on please, I'm busy." -dl "en" & pause"
echo      OK - TTS service window launched (loading model...)
timeout /t 3 /nobreak >nul

echo [5/5] Starting Main Program (Live2D Desktop Pet)...
echo.
echo Launching My-Neuro frontend, please wait 30-60 seconds...
echo.

REM Check electron
cd /d %~dp0live-2d
if exist ".\node\node.exe" (
    echo      Using built-in node.exe...
    if not exist ".\node_modules\electron\cli.js" (
        echo [ERROR] Electron not found!
        echo Path: %~dp0live-2d\node_modules\electron\cli.js
        pause
        exit /b 1
    )
    timeout /t 8 /nobreak >nul
    chcp 65001 >nul
    .\node\node.exe .\node_modules\electron\cli.js .
) else (
    echo      Using system node...
    where node >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] node.exe not found!
        echo Please check live-2d\node\ directory or install Node.js
        pause
        exit /b 1
    )
    timeout /t 8 /nobreak >nul
    chcp 65001 >nul
    node .\node_modules\electron\cli.js .
)

echo.
echo Main program exited. Background service windows can be closed manually.
pause
