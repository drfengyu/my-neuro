@echo off
REM 简化版启动脚本 - 仅测试新API配置
cd /d %~dp0
title My-Neuro 新API测试启动

echo ========================================
echo   My-Neuro 新API配置测试
echo ========================================
echo.
echo API: https://ai.littlesheep.cc/v1
echo Model: qwen3.5-397b-a17b
echo.
echo ========================================
echo.

REM 找Python
set "PYEXE="
if exist "C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" (
    set "PYEXE=C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe"
) else (
    set "PYEXE=python"
)

echo [Python] %PYEXE%
echo.

echo [1/4] 启动ASR服务 (端口1000)...
start "ASR Service" cmd /c "chcp 65001 >nul && cd /d "%~dp0full-hub" && "%PYEXE%" asr_api.py & pause"
timeout /t 3 /nobreak >nul
echo      OK
echo.

echo [2/4] 启动BERT服务 (端口6007)...
start "BERT Service" cmd /c "chcp 65001 >nul && cd /d "%~dp0full-hub" && "%PYEXE%" omni_bert_api.py & pause"
timeout /t 3 /nobreak >nul
echo      OK
echo.

echo [3/4] 跳过本地TTS (使用云端TTS)
echo      云端TTS已在config.json中配置
timeout /t 2 /nobreak >nul
echo.

echo [4/4] 启动Live2D前端...
echo.
cd /d %~dp0live-2d

if exist ".\node\node.exe" (
    echo      使用内置node.exe
    timeout /t 5 /nobreak >nul
    chcp 65001 >nul
    .\node\node.exe .\node_modules\electron\cli.js .
) else (
    echo      使用系统node
    timeout /t 5 /nobreak >nul
    chcp 65001 >nul
    node .\node_modules\electron\cli.js .
)

echo.
echo 程序已退出
pause
