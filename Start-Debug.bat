@echo off
chcp 65001 >nul
cd /d "%~dp0"
title My-Neuro 启动诊断

echo ========================================
echo   My-Neuro 启动诊断
echo ========================================
echo.
echo 当前目录: %CD%
echo.

REM 检查关键文件
echo [检查] 关键文件...
if not exist "live-2d\config.json" (
    echo ❌ 错误: live-2d\config.json 不存在
    pause
    exit /b 1
)
echo ✅ config.json 存在
echo.

if not exist "full-hub\asr_api.py" (
    echo ❌ 错误: full-hub\asr_api.py 不存在
    pause
    exit /b 1
)
echo ✅ asr_api.py 存在
echo.

REM 检查Python
echo [检查] Python环境...
set "PYEXE="
if exist "C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" (
    set "PYEXE=C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe"
    echo ✅ 找到Hermes Python: %PYEXE%
) else (
    where python >nul 2>&1
    if errorlevel 1 (
        echo ❌ 错误: 找不到Python
        pause
        exit /b 1
    )
    set "PYEXE=python"
    echo ✅ 使用系统Python
)
echo.

REM 检查Node
echo [检查] Node环境...
if exist "live-2d\node\node.exe" (
    echo ✅ 找到内置Node
) else (
    where node >nul 2>&1
    if errorlevel 1 (
        echo ❌ 错误: 找不到Node.js
        pause
        exit /b 1
    )
    echo ✅ 使用系统Node
)
echo.

REM 检查Electron
echo [检查] Electron...
if exist "live-2d\node_modules\electron\cli.js" (
    echo ✅ Electron已安装
) else (
    echo ❌ 错误: Electron未安装
    echo    请运行: cd live-2d && npm install
    pause
    exit /b 1
)
echo.

echo ========================================
echo   所有检查通过，开始启动
echo ========================================
echo.
pause

REM 启动ASR
echo [启动] ASR服务 (端口1000)...
start "ASR Service" cmd /c "chcp 65001 >nul && cd /d "%~dp0full-hub" && "%PYEXE%" asr_api.py || (echo ASR启动失败 && pause)"
timeout /t 3 /nobreak >nul
echo.

REM 启动BERT
echo [启动] BERT服务 (端口6007)...
start "BERT Service" cmd /c "chcp 65001 >nul && cd /d "%~dp0full-hub" && "%PYEXE%" omni_bert_api.py || (echo BERT启动失败 && pause)"
timeout /t 3 /nobreak >nul
echo.

echo [跳过] 本地TTS (使用云端TTS)
echo.

REM 启动Live2D
echo [启动] Live2D前端...
echo        等待后端服务初始化 (5秒)...
timeout /t 5 /nobreak >nul
echo.

cd /d "%~dp0live-2d"

if exist ".\node\node.exe" (
    echo        使用内置Node启动...
    ".\node\node.exe" ".\node_modules\electron\cli.js" . || (
        echo.
        echo ❌ Electron启动失败
        echo.
        pause
        exit /b 1
    )
) else (
    echo        使用系统Node启动...
    node ".\node_modules\electron\cli.js" . || (
        echo.
        echo ❌ Electron启动失败
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   程序已退出
echo ========================================
echo.
pause
