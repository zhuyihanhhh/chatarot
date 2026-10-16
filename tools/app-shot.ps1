param([string]$url="http://127.0.0.1:3090/app/#demo=celtic", [string]$out="", [int]$w=1600, [int]$h=1000, [int]$budget=20000, [int]$timeoutSec=120)
# Headless Edge against running server: screenshot (if -out) or dump DOM, and print console errors
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$udd = Join-Path $env:TEMP ("edge-app-" + (Get-Random))
$log = Join-Path $env:TEMP ("edge-app-" + (Get-Random) + ".log")
$dom = Join-Path $env:TEMP ("edge-app-" + (Get-Random) + ".html")
$argv = @("--headless=new", "--user-data-dir=`"$udd`"", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--window-size=$w,$h",
          "--virtual-time-budget=$budget", "--enable-logging=stderr", "--v=0")
if ($out) { if (Test-Path $out) { Remove-Item $out }; $argv += "--screenshot=`"$out`"" } else { $argv += "--dump-dom" }
$argv += "`"$url`""
$p = Start-Process -FilePath $edge -ArgumentList $argv -PassThru -WindowStyle Hidden -RedirectStandardError $log -RedirectStandardOutput $dom
if (-not $p.WaitForExit($timeoutSec * 1000)) {
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like "*$udd*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  "TIMEOUT"
}
Start-Sleep 1
Get-Content $log -Encoding UTF8 | Where-Object { $_ -match "CONSOLE|Uncaught|Error" -and $_ -notmatch "task_manager|sync\\engine|gpu|GPU|swiftshader" } | Select-Object -First 15
if (-not $out) { $d = Get-Content $dom -Raw -Encoding UTF8; $m = [regex]::Match($d, 'id="demoResult">([^<]*)<'); if ($m.Success) { $m.Groups[1].Value } else { "no demoResult"; $d.Substring(0, [Math]::Min(1500, $d.Length)) } }
else { Test-Path $out }
Remove-Item $udd, $log, $dom -Recurse -Force -ErrorAction SilentlyContinue
