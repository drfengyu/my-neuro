@echo off
chcp 65001 >nul
cd /d %~dp0
echo ================================
echo   My-Neuro AI 虚拟伴侣启动器
echo ================================
echo.

REM ---- 解析可用的 Python（按优先级回退）----
set "PYEXE="
if exist "%~dp0env\python.exe" set "PYEXE=%~dp0env\python.exe"
if not defined PYEXE if exist "C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" set "PYEXE=C:\Users\Drfen\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe"
if not defined PYEXE set "PYEXE=python"
echo [Python] %PYEXE%

echo [1/5] 检查配置文件...
if not exist "live-2d\config.json" (
    echo [错误] 配置文件不存在！
    pause
    exit /b 1
)

echo [2/5] 启动 ASR 服务（语音识别 / CPU）...
start "ASR Service" cmd /c "cd /d %~dp0full-hub && "%PYEXE%" asr_api.py & pause"
timeout /t 3 /nobreak >nul

echo [3/5] 启动 BERT 服务（情感分类 / CPU）...
start "BERT Service" cmd /c "cd /d %~dp0full-hub && "%PYEXE%" omni_bert_api.py & pause"
timeout /t 3 /nobreak >nul

echo [4/5] 启动 TTS 服务（GPT-SoVITS / GPU 加速，端口 5000）...
echo     注：本地语音模型加载约需 30-60 秒，首句合成会预热稍慢。
start "TTS Service (GPU)" cmd /c "cd /d %~dp0full-hub\tts-hub\GPT-SoVITS-Bundle && set "PATH=%~dp0full-hub\tts-hub\GPT-SoVITS-Bundle\runtime;%PATH%" && runtime\python.exe api.py -p 5000 -d cuda -s role_voice_api/neuro/merge.pth -dr role_voice_api/neuro/01.wav -dt "Hold on please, I'm busy. Okay, I think I heard him say he wants me to stream Hollow Knight on Tuesday and Thursday." -dl "en" & pause"
timeout /t 3 /nobreak >nul

echo [5/5] 启动主程序（Live2D 桌宠）...
echo.
echo 正在启动 My-Neuro 主界面，请等待服务加载（约 30-60 秒）...
echo.
timeout /t 8 /nobreak >nul

cd /d %~dp0live-2d
if exist ".\node\node.exe" (
    .\node\node.exe .\node_modules\electron\cli.js .
) else (
    node .\node_modules\electron\cli.js .
)

echo.
echo 主程序已退出。各后台服务窗口可手动关闭。
pause
