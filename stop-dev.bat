@echo off
title Wallhaven Studio - Stop
cd /d "%~dp0"

echo ==============================================
echo   Wallhaven Studio 停止开发进程
echo ==============================================
echo.

echo [1/2] 停止 Electron 进程 ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$base = '%~dp0node_modules'; $list = @(Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path.StartsWith($base, [System.StringComparison]::OrdinalIgnoreCase) }); if ($list.Count -gt 0) { foreach ($p in $list) { Write-Host ('  已停止 Electron PID ' + $p.Id); Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } } else { Write-Host '  未发现本项目的 Electron 进程' }"

echo [2/2] 停止 Vite 开发服务器 ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$conns = @(Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue); $killed = $false; foreach ($c in $conns) { $procId = $c.OwningProcess; $proc = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $procId) -ErrorAction SilentlyContinue; if ($proc -and $proc.CommandLine -like '*vite*') { Write-Host ('  已停止 Vite PID ' + $procId); Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue; $killed = $true } }; if (-not $killed) { Write-Host '  未发现运行中的 Vite 开发服务器' }"

echo.
echo [完成] 停止流程执行完毕。
timeout /t 3 >nul 2>nul
