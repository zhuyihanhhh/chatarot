param([int]$timeoutSec=1500)
# Bake all card layers: starts server.js, opens tools/bake.html?auto in headless Edge, waits for 78 meta.json
$root = Split-Path $PSScriptRoot -Parent
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$srv = Start-Process node -ArgumentList "server.js" -WorkingDirectory $root -PassThru -WindowStyle Hidden
Start-Sleep 1.5
$udd = Join-Path $env:TEMP ("edge-bake-" + (Get-Random))
$port = if ($env:PORT) { $env:PORT } else { 3090 }
$p = Start-Process -FilePath $edge -ArgumentList @("--headless=new", "--user-data-dir=`"$udd`"", "--remote-debugging-port=0", "http://127.0.0.1:$port/tools/bake.html?auto") -PassThru -WindowStyle Hidden
$t0 = Get-Date; $last = -1
while (((Get-Date) - $t0).TotalSeconds -lt $timeoutSec) {
  Start-Sleep 5
  $n = (Get-ChildItem "$root/assets/baked" -Recurse -Filter meta.json -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt $t0 }).Count
  if ($n -ne $last) { "baked: $n / 78  ({0:N0}s)" -f ((Get-Date) - $t0).TotalSeconds; $last = $n }
  if ($n -ge 78) { break }
}
Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like "*$udd*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Stop-Process $srv.Id -ErrorAction SilentlyContinue
Start-Sleep 1
Remove-Item $udd -Recurse -Force -ErrorAction SilentlyContinue
$size = (Get-ChildItem "$root/assets/baked" -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
"total baked size: {0:N1} MB" -f $size
