param([int]$timeoutSec=60)
# Headless check of every cards/*.html: reports pages whose hint is not the normal "ready" text
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$root = (Split-Path $PSScriptRoot -Parent) -replace "\\", "/"
$bad = @()
foreach ($f in Get-ChildItem "$root/cards" -Filter *.html | Sort-Object Name) {
  $udd = Join-Path $env:TEMP ("edge-chk-" + (Get-Random))
  $out = Join-Path $env:TEMP ("dom-" + (Get-Random) + ".html")
  $argv = @("--headless=new", "--user-data-dir=`"$udd`"", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
            "--allow-file-access-from-files", "--virtual-time-budget=15000", "--dump-dom", "`"file:///$root/cards/$($f.Name)?t=2`"")
  $p = Start-Process -FilePath $edge -ArgumentList $argv -PassThru -WindowStyle Hidden -RedirectStandardOutput $out
  if (-not $p.WaitForExit($timeoutSec * 1000)) {
    Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like "*$udd*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    $bad += "$($f.BaseName): TIMEOUT"; continue
  }
  $dom = Get-Content $out -Raw -Encoding UTF8
  $m = [regex]::Match($dom, 'id="hint"[^>]*>([^<]*)<')
  $hint = if ($m.Success) { $m.Groups[1].Value } else { "<no hint>" }
  if ($hint -notmatch "Pam-A|Rider") { $bad += "$($f.BaseName): $hint" }
  Remove-Item $out, $udd -Recurse -Force -ErrorAction SilentlyContinue
}
"checked: " + (Get-ChildItem "$root/cards" -Filter *.html).Count
if ($bad.Count) { "BAD:"; $bad } else { "ALL OK" }
