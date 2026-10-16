param([int]$x0,[int]$y0,[int]$x1,[int]$y1,[string]$out,[double]$scale=1.6,[int]$step=20,[string]$src="F:/temp/code/chatarot/assets/fool-pamA.png")
# Crop a region of the source image and overlay a pixel grid (thin every $step px, bold + labels every 100 px)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile($src)
$w = [int](($x1-$x0)*$scale); $h = [int](($y1-$y0)*$scale)
$bmp = New-Object System.Drawing.Bitmap($w,$h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'NearestNeighbor'
$g.DrawImage($img, (New-Object System.Drawing.Rectangle(0,0,$w,$h)), (New-Object System.Drawing.Rectangle($x0,$y0,($x1-$x0),($y1-$y0))), 'Pixel')
$thin = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110,255,0,255),1)
$bold = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(230,0,0,255),1)
$f = New-Object System.Drawing.Font("Arial",9,[System.Drawing.FontStyle]::Bold)
for($x=[math]::Ceiling($x0/$step)*$step; $x -lt $x1; $x+=$step){
  $px=($x-$x0)*$scale; $p= if($x%100 -eq 0){$bold}else{$thin}; $g.DrawLine($p,$px,0,$px,$h)
  if($x%100 -eq 0){ for($yy=0;$yy -lt $h;$yy+=160){ $g.DrawString("$x",$f,[System.Drawing.Brushes]::Blue,$px+2,$yy) } }
}
for($y=[math]::Ceiling($y0/$step)*$step; $y -lt $y1; $y+=$step){
  $py=($y-$y0)*$scale; $p= if($y%100 -eq 0){$bold}else{$thin}; $g.DrawLine($p,0,$py,$w,$py)
  if($y%100 -eq 0){ for($xx=0;$xx -lt $w;$xx+=200){ $g.DrawString("$y",$f,[System.Drawing.Brushes]::Red,$xx+2,$py+1) } }
}
$bmp.Save($out); $g.Dispose(); $img.Dispose(); $bmp.Dispose()
