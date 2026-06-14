@echo off
REM My-Neuro AI Virtual Companion Launcher (Cloud TTS Version)
REM 使用云端TTS，本地TTS不会说中文时使用此脚本
REM Starts ASR, BERT (skip local TTS), and Live2D frontend with Cloud TTS

cd /d %~dp0
title My-Neuro AI Launcher (Cloud TTS)
echo ========================================
echo   My-Neuro AI Launcher (Cloud TTS)
echo ========================================
echo.
echo [配置] 使用云端TTS（火山引擎/阿里云）
echo        跳过本地GPU TTS服务
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

REM 启用云端TTS配置
echo [2/5] Enabling Cloud TTS in config...
echo      Modifying config.json to enable cloud TTS...

REM 使用Node.js修改配置文件
cd /d %~dp0live-2d
if exist ".\node\node.exe" (
    .\node\node.exe -e "const fs=require('fs');const cfg=JSON.parse(fs.readFileSync('config.json','utf8'));cfg.tts.enabled=false;cfg.cloud.volcengine_tts.enabled=true;fs.writeFileSync('config.json',JSON.stringify(cfg,null,2));"
    echo      OK - Cloud TTS enabled (Volcengine)
) else (
    node -e "const fs=require('fs');const cfg=JSON.parse(fs.readFileSync('config.json','utf8'));cfg.tts.enabled=false;cfg.cloud.volcengine_tts.enabled=true;fs.writeFileSync('config.json',JSON.stringify(cfg,null,2));"
    echo      OK - Cloud TTS enabled (Volcengine)
)
cd /d %~dp0
echo.

echo [3/5] Starting ASR Service (Speech Recognition / CPU, port 1000)...
if not exist "full-hub\asr_api.py" (
    echo [ERROR] ASR service file not found!
    pause
    exit /b 1
)
start "ASR Service" cmd /c "chcp 65001 >nul && cd /d "%~dp0full-hub" && "%PYEXE%" asr_api.py & pause"
echo      OK - ASR service window launched
timeout /t 3 /nobreak >nul

echo [4/5] Starting BERT Service (Emotion Classification / CPU, port 6007)...
if not exist "full-hub\omni_bert_api.py" (
    echo [ERROR] BERT service file not found!
    pause
    exit /b 1
)
start "BERT Service" cmd /c "chcp 65001 >nul && cd /d "%~dp0full-hub" && "%PYEXE%" omni_bert_api.py & pause"
echo      OK - BERT service window launched
timeout /t 3 /nobreak >nul

echo [TTS] Skipping local GPU TTS (using cloud TTS instead)
echo      Cloud TTS: Volcengine (火山引擎)
echo      Voice: 俏皮公主 (saturn_zh_female_tiaopigongzhu_tob)
echo.

echo [5/5] Starting Main Program (Live2D Desktop Pet)...
echo.
echo Launching My-Neuro frontend...
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
    timeout /t 3 /nobreak >nul
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
    timeout /t 3 /nobreak >nul
    chcp 65001 >nul
    node .\node_modules\electron\cli.js .
)

echo.
echo Main program exited. Background service windows can be closed manually.
pause
