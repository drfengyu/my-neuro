@echo off
chcp 65001 >nul
cd /d %~dp0
title My-Neuro AI 虚拟伴侣启动�?echo ================================
echo   My-Neuro AI 虚拟伴侣启动�?echo ================================
echo.

REM ---- 解析可用�?Python（按优先级回退�?---
set "PYEXE="
if exist "%~dp0env\python.exe" set "PYEXE=%~dp0env\python.exe"
if not defined PYEXE if exist "C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" set "PYEXE=C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe"
if not defined PYEXE set "PYEXE=python"
echo [Python] %PYEXE%
echo.

echo [1/5] 检查配置文�?..
if not exist "live-2d\config.json" (
    echo [错误] 配置文件不存在！
    echo 路径: %~dp0live-2d\config.json
    pause
    exit /b 1
)
echo      �?配置文件正常
echo.

echo [2/5] 启动 ASR 服务（语音识�?/ CPU�?..
if not exist "full-hub\asr_api.py" (
    echo [错误] ASR 服务文件不存在！
    pause
    exit /b 1
)
start "ASR Service" cmd /c "cd /d %~dp0full-hub && "%PYEXE%" asr_api.py & pause"
echo      �?ASR 服务窗口已启动（端口 1000�?timeout /t 3 /nobreak >nul

echo [3/5] 启动 BERT 服务（情感分�?/ CPU�?..
if not exist "full-hub\omni_bert_api.py" (
    echo [错误] BERT 服务文件不存在！
    pause
    exit /b 1
)
start "BERT Service" cmd /c "cd /d %~dp0full-hub && "%PYEXE%" omni_bert_api.py & pause"
echo      �?BERT 服务窗口已启动（端口 6007�?timeout /t 3 /nobreak >nul

echo [4/5] 启动 TTS 服务（GPT-SoVITS / GPU 加速，端口 5000�?..
if not exist "full-hub\tts-hub\GPT-SoVITS-Bundle\api.py" (
    echo [错误] TTS 服务文件不存在！
    pause
    exit /b 1
)
echo      注：本地语音模型加载约需 30-60 秒，首句合成会预热稍慢�?start "TTS Service (GPU)" cmd /c "cd /d %~dp0full-hub\tts-hub\GPT-SoVITS-Bundle && set "PATH=%~dp0full-hub\tts-hub\GPT-SoVITS-Bundle\runtime;%PATH%" && runtime\python.exe api.py -p 5000 -d cuda -s role_voice_api/neuro/merge.pth -dr role_voice_api/neuro/01.wav -dt "Hold on please, I'm busy. Okay, I think I heard him say he wants me to stream Hollow Knight on Tuesday and Thursday." -dl "en" & pause"
echo      �?TTS 服务窗口已启动（GPU 模型加载�?..�?timeout /t 3 /nobreak >nul

echo [5/5] 启动主程序（Live2D 桌宠�?..
echo.
echo 正在启动 My-Neuro 主界面，请等待服务加载（�?30-60 秒）...
echo.

REM 检�?electron 是否存在
cd /d %~dp0live-2d
if exist ".\node\node.exe" (
    echo      使用内置 node.exe 启动...
    if not exist ".\node_modules\electron\cli.js" (
        echo [错误] Electron 文件不存在！
        echo 路径: %~dp0live-2d\node_modules\electron\cli.js
        pause
        exit /b 1
    )
    timeout /t 8 /nobreak >nul
    .\node\node.exe .\node_modules\electron\cli.js .
) else (
    echo      使用系统 node 启动...
    where node >nul 2>&1
    if errorlevel 1 (
        echo [错误] 找不�?node.exe�?        echo 请检�?live-2d\node\ 目录或安�?Node.js
        pause
        exit /b 1
    )
    timeout /t 8 /nobreak >nul
    node .\node_modules\electron\cli.js .
)

echo.
echo 主程序已退出。各后台服务窗口可手动关闭�?pause
