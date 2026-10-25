Add-Type -AssemblyName System.Drawing

$dir = 'C:\Users\homel\Downloads\project\reference\peptora'
$img = [System.Drawing.Bitmap]::FromFile((Join-Path $dir 'tesamorelin.jpg'))
$W = $img.Width; $H = $img.Height
"Size: ${W}x${H}"

# sample background/scene colors (x,y in 2000x2000 space; vial occupies ~x600-1400)
$pts = @(
  @(40,40,'TL corner'), @(1000,30,'top center'), @(1960,40,'TR corner'),
  @(40,700,'left mid'), @(1960,700,'right mid'),
  @(40,1200,'left lower'), @(1960,1200,'right lower'),
  @(120,1150,'bright glow?'),
  @(40,1500,'left floor-ish'), @(40,1650,'left floor'),
  @(300,1850,'floor LL'), @(1000,1950,'floor center'), @(1700,1850,'floor R')
)
foreach ($p in $pts) {
  $c = $img.GetPixel($p[0], $p[1])
  '{0,-14} ({1,4},{2,4}) = R{3,3} G{4,3} B{5,3}' -f $p[2], $p[0], $p[1], $c.R, $c.G, $c.B
}

# detect horizon by scanning column x=60 for brightness jump
"`n-- vertical brightness profile at x=60 (back wall -> floor) --"
for ($y = 1300; $y -lt 2000; $y += 50) {
  $c = $img.GetPixel(60, $y)
  $lum = [int](0.299*$c.R + 0.587*$c.G + 0.114*$c.B)
  '{0,4}: lum={1,3}  R{2,3} G{3,3} B{4,3}' -f $y, $lum, $c.R, $c.G, $c.B
}

# crop the bottom (floor + shadow + reflection) and enlarge for viewing
$crop = New-Object System.Drawing.Bitmap 1024, 512
$g = [System.Drawing.Graphics]::FromImage($crop)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$srcRect = New-Object System.Drawing.Rectangle 500, 1450, 1000, 500
$g.DrawImage($img, (New-Object System.Drawing.Rectangle 0,0,1024,512), $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$crop.Save((Join-Path $dir '_floor_zoom.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()

# crop top-left background corner zoom (gradient + vignette)
$crop2 = New-Object System.Drawing.Bitmap 600, 600
$g2 = [System.Drawing.Graphics]::FromImage($crop2)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.DrawImage($img, (New-Object System.Drawing.Rectangle 0,0,600,600), (New-Object System.Drawing.Rectangle 0,0,1000,1000), [System.Drawing.GraphicsUnit]::Pixel)
$g2.Dispose()
$crop2.Save((Join-Path $dir '_bg_zoom.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$crop2.Dispose()

$img.Dispose()
"saved _floor_zoom.png and _bg_zoom.png"
