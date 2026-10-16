param([Parameter(Mandatory)][string[]]$Stems)
# Download steve-p.org Pam-A scans -> assets/cards/<stem>.png / .jpg / .js (base64 embedded)
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$dir = Join-Path $root "assets/cards"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$ua = "Mozilla/5.0"; $ref = "https://steve-p.org/cards/RWSa.html"
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$ps = New-Object System.Drawing.Imaging.EncoderParameters 1
$ps.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]93)
foreach ($s in $Stems) {
  $png = Join-Path $dir "$s.png"; $jpg = Join-Path $dir "$s.jpg"; $js = Join-Path $dir "$s.js"
  if (-not (Test-Path $png)) {
    $cs = (Invoke-WebRequest -Uri ("https://steve-p.org/cards/cscalc.php?fs=$s&dt=" + [DateTimeOffset]::Now.ToUnixTimeMilliseconds()) -UseBasicParsing -UserAgent $ua -Headers @{Referer = $ref }).Content.Trim()
    Invoke-WebRequest -Uri "https://steve-p.org/cards/pixe/${s}_$cs.png" -OutFile $png -UseBasicParsing -UserAgent $ua -Headers @{Referer = $ref } -TimeoutSec 180
    Start-Sleep -Milliseconds 800
  }
  $img = [System.Drawing.Image]::FromFile($png)
  $img.Save($jpg, $enc, $ps); $w = $img.Width; $h = $img.Height; $img.Dispose()
  $b = [Convert]::ToBase64String([IO.File]::ReadAllBytes($jpg))
  [IO.File]::WriteAllText($js, "window.CARD_IMG='data:image/jpeg;base64,$b';")
  "$s ${w}x$h"
}
