@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"
title 塔罗之间 · 本地服务

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装 Node.js 18 或更高版本：https://nodejs.org/
  pause
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    copy /y ".env.example" ".env" >nul
    echo [提示] 已根据 .env.example 创建 .env。
    echo        如需 AI 解读，请在 .env 中填写 DEEPSEEK_API_KEY 后重新运行本脚本。
    echo.
  )
)

set "PORT=3090"
if exist ".env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
    if /i "%%a"=="PORT" if not "%%b"=="" set "PORT=%%b"
  )
)
set "URL=http://127.0.0.1:%PORT%/app/"

rem 关闭占用该端口的旧服务（仅限 node server.js；若被其他程序占用则提示并退出）
powershell -NoProfile -Command ^
  "$ids = Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach($id in $ids){ $p = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $id); if($p -and $p.Name -eq 'node.exe' -and $p.CommandLine -like '*server.js*'){ Stop-Process -Id $id -Force; Write-Host ('[提示] 已关闭旧服务（PID ' + $id + '）') } else { Write-Host ('[错误] 端口 %PORT% 被其他程序占用：' + $(if($p){$p.Name}else{$id})); exit 2 } }; for($i=0;$i -lt 20 -and (Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue);$i++){ Start-Sleep -Milliseconds 250 }"
if errorlevel 2 (
  echo        请关闭该程序，或在 .env 中修改 PORT 后重试。
  pause
  exit /b 1
)

rem 后台等待服务就绪后打开浏览器（最多等 15 秒）
start "" /b powershell -NoProfile -WindowStyle Hidden -Command ^
  "$u='http://127.0.0.1:%PORT%/api/status'; for($i=0;$i -lt 60;$i++){ try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 $u | Out-Null; Start-Process '%URL%'; break } catch { Start-Sleep -Milliseconds 250 } }"

echo 正在启动服务……关闭此窗口即可停止服务。
echo.
node server.js
echo.
echo 服务已停止。
pause
