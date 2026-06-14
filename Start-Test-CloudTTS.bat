@echo off
chcp 65001 >nul
cd /d %~dp0
title My-Neuro 测试启动 (云端TTS)

echo ========================================
echo   My-Neuro 云端TTS测试启动
echo ========================================
echo.

REM 1. 验证配置
echo [1/5] 验证配置文件...
node check-config-safe.js
echo.
pause

REM 2. 测试云端TTS
echo [2/5] 测试云端TTS连接...
echo      (这会测试火山引擎API是否可用)
node test-cloud-tts.js
echo.
pause

REM 3. 查找Python
set "PYEXE="
if exist "C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" (
    set "PYEXE=C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe"
) else (
    set "PYEXE=python"
)
echo [3/5] Python路径: %PYEXE%
echo.

REM 4. 启动服务
echo [4/5] 启动后端服务...
echo.
echo      启动ASR (端口1000)...
start "ASR Service" cmd /c "chcp 65001 >nul && cd /d "%~dp0full-hub" && "%PYEXE%" asr_api.py & pause"
timeout /t 3 /nobreak >nul

echo      启动BERT (端口6007)...
start "BERT Service" cmd /c "chcp 65001 >nul && cd /d "%~dp0full-hub" && "%PYEXE%" omni_bert_api.py & pause"
timeout /t 3 /nobreak >nul

echo      跳过本地TTS (使用云端TTS)
echo.

REM 5. 启动前端
echo [5/5] 启动Live2D前端...
echo.
echo      等待服务初始化...
timeout /t 5 /nobreak >nul

cd /d %~dp0live-2d

if exist ".\node\node.exe" (
    echo      使用内置node.exe
    .\node\node.exe .\node_modules\electron\cli.js .
) else (
    echo      使用系统node
    node .\node_modules\electron\cli.js .
)

echo.
echo 程序已退出
pause
