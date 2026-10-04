@echo off
title Wallhaven Studio - Dev
cd /d "%~dp0"

echo ==============================================
echo   Wallhaven Studio 开发模式启动脚本
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装：https://nodejs.org/
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 pnpm，可尝试运行：corepack enable
  pause
  exit /b 1
)

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }"
if errorlevel 1 (
  echo [警告] 端口 5173 已被占用，可能已有开发服务在运行。
  echo        请先运行 stop-dev.bat 停止旧进程，再重新启动。
  pause
  exit /b 1
)

if not exist "node_modules\electron\dist\electron.exe" (
  echo [提示] 未检测到完整依赖，正在执行 pnpm install ...
  call pnpm install
  if errorlevel 1 (
    echo [错误] 依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)

echo [信息] 正在启动 Vite + Electron，首次启动需要几秒 ...
echo [信息] 关闭 Electron 窗口即可结束，或运行 stop-dev.bat 停止。
echo.

call pnpm run dev

echo.
echo [信息] 开发进程已退出。
pause
