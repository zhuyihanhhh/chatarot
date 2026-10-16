param([string]$page="cards/RWSa-T-00.html", [string]$query="", [string]$out="F:/temp/code/chatarot/assets/_shot.png", [int]$w=800, [int]$h=1300, [int]$timeoutSec=90)
# Headless Edge screenshot: shot.ps1 cards/XXX.html "debug&t=3" out.png  (killed after timeout to avoid hangs)
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$root = (Split-Path $PSScriptRoot -Parent) -replace "\\", "/"
$url = "file:///$root/$page" + $(if ($query) { "?" + $query } else { "" })
if (Test-Path $out) { Remove-Item $out }
$udd = Join-Path $env:TEMP ("edge-shot-" + (Get-Random))
$argv = @("--headless=new", "--user-data-dir=`"$udd`"", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--allow-file-access-from-files",
          "--window-size=$w,$h", "--virtual-time-budget=15000", "--screenshot=`"$out`"", "`"$url`"")
$p = Start-Process -FilePath $edge -ArgumentList $argv -PassThru -WindowStyle Hidden
if (-not $p.WaitForExit($timeoutSec * 1000)) {
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like "*$udd*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  "TIMEOUT"
}
Start-Sleep 1
Remove-Item $udd -Recurse -Force -ErrorAction SilentlyContinue
Test-Path $out
