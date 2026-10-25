Add-Type -AssemblyName System.Drawing

$root   = 'C:\Users\homel\Downloads\project'
$bgPath = Join-Path $root 'public\images\testing\background_only.png'
$srcDir = Join-Path $root 'public\images\png'
$outDir = Join-Path $root 'public\images\products'
New-Item -ItemType Directory -Force $outDir | Out-Null

# Set $only to a subset of slugs to test; empty = process everything.
$only = @()

$map = [ordered]@{
  'glp-3-rt'='R10 PNG.png'; 'glp-2-tz'='Tirz 10 PNG.png'; 'tesamorelin'='Tesa 10 PNG.png'
  'mots-c'='MOTS 10 PNG.png'; 'glow'='GLOW 70.png'; 'klow'='KLOW PNG.png'
  'adamax'='ADAMAX  10 PNG.png'; 'glutathione'='Glutathione PNG.png'; 'bac-water'='BAC 10 PNG.png'
  'cjc-1295-ipamorelin'='CJC + IPA 10 PNG.png'; 'nad-plus'='NAD 500 PNG.png'; 'mt1'='MT1 PNG.png'
  'melanotan-2'='MT2 PNG.jpg'; 'ghk-cu'='GHK 50 PNG.png'; '5-amino-1mq'='5 Amino PNG.png'
  'kpv'='KPV 10 PNG.png'; 'wolverine'='WOLVERINE 10 PNG.png'; 'semax'='SEMAX 10 PNG.png'
  'selank'='SELANK 10 PNG.png'; 'ss-31'='SS31 10 PNG.png'; 'll-37'='LL37 PNG.png'
  'bpc-157'='BPC PNG.png'; 'tb-500'='TB 500 PNG.png'; 'sermorelin'='Serm 10 PNG.png'
  'ipamorelin'='IPA 10 PNG.png'; 'igf1-lr3'='IGF PNG.png'; 'cagrilintide'='Cagri PNG.png'
  'hcg'='HCG 5000 iu PNG.png'; 'epithalon'='Epithalon PNG.png'; 'kisspeptin'='Kisspeptin 10 PNG.png'
  'pt-141'='PT 141 PNG.png'; 'thymosin-alpha-1'='Thymosin Alpha 1- PNG.png'; 'dsip'='DSIP 10 PNG.png'
  'cjc-1295-with-dac'='CJC with dac PNG.png'; 'cjc-1295-no-dac'='CJC no dac PNG.png'; 'aod-9604'='AOD PNG.png'
  'ara-290'='ARA290 PNG.png'; 'trifecta'='trifecta PNG.png'; 'trifecta-deluxe'='trifecta deluxe.png'
  'neuro-duo'='neuro duo.jpg'; 'shred-plus'='shred + PNG.png'; 'peak-pulse'='peak pulse PNG.png'
  'metabolic-reset'='metabolic reset 1  PNG.png'
}

$OUTW = 1400
$OUTH = 1750
$HORIZON = [int]($OUTH * 0.70)   # where wall meets floor (behind vial)

# --- tuning ---
$FLOOR_SHEEN     = 120   # alpha of glossy highlight near horizon (0-255)
$VIGNETTE        = 70    # alpha of corner darkening (0-255)
$AO_OPACITY      = 0.34  # tight occlusion right at the base
$AO_WSCALE       = 0.92
$AO_HSCALE       = 0.10
$CAST_OPACITY    = 0.30  # soft projected floor shadow
$CAST_SQUASH     = 0.20  # vertical squash of the projected silhouette
$CAST_DX         = 40    # shift right (light from upper-left)
$CAST_BLUR_W     = 80
$REFL_OPACITY    = 0.30
$REFL_LEN        = 0.42  # reflection length as fraction of vial height
$REFL_BANDS      = 24
$REFL_BLUR_W     = 300

$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [int64]93)

function New-HQGraphics($bmp) {
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  return $g
}
function Get-AlphaAttr($a) {
  $cm = New-Object System.Drawing.Imaging.ColorMatrix
  $cm.Matrix33 = [float]$a
  $ia = New-Object System.Drawing.Imaging.ImageAttributes
  $ia.SetColorMatrix($cm); return $ia
}
function Get-SilhouetteAttr() {
  $cm = New-Object System.Drawing.Imaging.ColorMatrix
  $cm.Matrix00 = 0; $cm.Matrix11 = 0; $cm.Matrix22 = 0
  $ia = New-Object System.Drawing.Imaging.ImageAttributes
  $ia.SetColorMatrix($cm); return $ia
}
function Blur-Copy($src, $smallW) {
  $smallH = [int]($src.Height * $smallW / $src.Width); if ($smallH -lt 1) { $smallH = 1 }
  $small = New-Object System.Drawing.Bitmap $smallW, $smallH
  $g1 = New-HQGraphics $small
  $g1.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $smallW, $smallH)); $g1.Dispose()
  $big = New-Object System.Drawing.Bitmap $src.Width, $src.Height
  $g2 = New-HQGraphics $big
  $g2.DrawImage($small, (New-Object System.Drawing.Rectangle 0, 0, $src.Width, $src.Height)); $g2.Dispose()
  $small.Dispose(); return $big
}
function Get-AlphaBBox($img, $scanW) {
  $scanH = [int]($img.Height * $scanW / $img.Width)
  $small = New-Object System.Drawing.Bitmap $scanW, $scanH
  $g = New-HQGraphics $small
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $scanW, $scanH)); $g.Dispose()
  $minx = $scanW; $miny = $scanH; $maxx = 0; $maxy = 0
  for ($y = 0; $y -lt $scanH; $y++) { for ($x = 0; $x -lt $scanW; $x++) {
    if ($small.GetPixel($x, $y).A -gt 30) {
      if ($x -lt $minx){$minx=$x}; if ($x -gt $maxx){$maxx=$x}
      if ($y -lt $miny){$miny=$y}; if ($y -gt $maxy){$maxy=$y}
    }
  }}
  $small.Dispose()
  $sx = $img.Width / $scanW
  return @{ X=$minx*$sx; Y=$miny*$sx; W=($maxx-$minx)*$sx; H=($maxy-$miny)*$sx }
}

# ---- build the scene background once (wall + glossy floor + horizon + vignette) ----
$wall = [System.Drawing.Image]::FromFile($bgPath)
$scene = New-Object System.Drawing.Bitmap $OUTW, $OUTH
$gscene = New-HQGraphics $scene
$wScale = [Math]::Max($OUTW / $wall.Width, $OUTH / $wall.Height)
$ww = $wall.Width * $wScale; $wh = $wall.Height * $wScale
$gscene.DrawImage($wall, [float](($OUTW-$ww)/2), [float](($OUTH-$wh)/2), [float]$ww, [float]$wh)
$wall.Dispose()

# glossy floor sheen: bright near horizon, fading down
$rectFloor = New-Object System.Drawing.Rectangle 0, $HORIZON, $OUTW, ($OUTH-$HORIZON)
$lgb = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rectFloor, ([System.Drawing.Color]::FromArgb($FLOOR_SHEEN,236,242,245)), ([System.Drawing.Color]::FromArgb(0,236,242,245)), ([System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
$gscene.FillRectangle($lgb, $rectFloor); $lgb.Dispose()
# soft bright horizon band
$bandH = 90
$rectBand = New-Object System.Drawing.Rectangle 0, ($HORIZON-$bandH), $OUTW, ($bandH*2)
$lgb2 = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rectBand, ([System.Drawing.Color]::FromArgb(0,245,250,252)), ([System.Drawing.Color]::FromArgb(0,245,250,252)), ([System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
$blend = New-Object System.Drawing.Drawing2D.ColorBlend 3
$blend.Colors = @([System.Drawing.Color]::FromArgb(0,245,250,252), [System.Drawing.Color]::FromArgb(95,245,250,252), [System.Drawing.Color]::FromArgb(0,245,250,252))
$blend.Positions = @(0.0, 0.5, 1.0)
$lgb2.InterpolationColors = $blend
$gscene.FillRectangle($lgb2, $rectBand); $lgb2.Dispose()
# subtle darkening at very bottom for depth
$botH = [int]($OUTH*0.16)
$rectBot = New-Object System.Drawing.Rectangle 0, ($OUTH-$botH), $OUTW, $botH
$lgb3 = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rectBot, ([System.Drawing.Color]::FromArgb(0,10,30,55)), ([System.Drawing.Color]::FromArgb(55,10,30,55)), ([System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
$gscene.FillRectangle($lgb3, $rectBot); $lgb3.Dispose()
# corner vignette
$gp = New-Object System.Drawing.Drawing2D.GraphicsPath
$gp.AddEllipse(-($OUTW*0.30), -($OUTH*0.30), $OUTW*1.60, $OUTH*1.60)
$pgb = New-Object System.Drawing.Drawing2D.PathGradientBrush $gp
$pgb.CenterColor = [System.Drawing.Color]::FromArgb(0,0,0,0)
$pgb.SurroundColors = @([System.Drawing.Color]::FromArgb($VIGNETTE,8,28,52))
$gscene.FillRectangle($pgb, (New-Object System.Drawing.Rectangle 0,0,$OUTW,$OUTH))
$pgb.Dispose(); $gp.Dispose()
$gscene.Dispose()

$fullRect = New-Object System.Drawing.Rectangle 0, 0, $OUTW, $OUTH
$sil = Get-SilhouetteAttr
$made = 0

$keys = if ($only.Count -gt 0) { $only } else { @($map.Keys) }
foreach ($slug in $keys) {
  $vp = Join-Path $srcDir $map[$slug]
  if (-not (Test-Path $vp)) { Write-Output "MISSING vial: $($map[$slug])"; continue }
  $vial = [System.Drawing.Bitmap]::FromFile($vp)

  $bb = Get-AlphaBBox $vial 100
  $sc = $OUTW / $vial.Width
  $bx=$bb.X*$sc; $by=$bb.Y*$sc; $bw=$bb.W*$sc; $bh=$bb.H*$sc
  $baseY = $by + $bh
  $cx = $bx + $bw/2

  $canvas = New-Object System.Drawing.Bitmap $OUTW, $OUTH
  $g = New-HQGraphics $canvas
  $g.DrawImage($scene, $fullRect, 0, 0, $OUTW, $OUTH, [System.Drawing.GraphicsUnit]::Pixel)

  # silhouette (reused for reflection-as-shadow and cast shadow)
  $silBmp = New-Object System.Drawing.Bitmap $OUTW, $OUTH
  $gsil = New-HQGraphics $silBmp
  $gsil.DrawImage($vial, $fullRect, 0, 0, $vial.Width, $vial.Height, [System.Drawing.GraphicsUnit]::Pixel, $sil)
  $gsil.Dispose()

  # 1) reflection on the glossy floor (mirror the vial about baseY, fade down)
  $reflLenPx = [Math]::Min([int]($bh*$REFL_LEN), $OUTH-[int]$baseY-4)
  if ($reflLenPx -gt 10) {
    $reflTmp = New-Object System.Drawing.Bitmap $OUTW, $OUTH
    $gr = New-HQGraphics $reflTmp
    $gr.TranslateTransform(0, [float](2*$baseY))
    $gr.ScaleTransform(1, -1)
    $gr.DrawImage($vial, $fullRect, 0, 0, $vial.Width, $vial.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $gr.ResetTransform(); $gr.Dispose()
    $reflBlur = Blur-Copy $reflTmp $REFL_BLUR_W
    $reflTmp.Dispose()
    $bandPx = [Math]::Max(1, [int]($reflLenPx/$REFL_BANDS))
    for ($i=0; $i -lt $REFL_BANDS; $i++) {
      $yTop = [int]($baseY + $i*$bandPx)
      $op = $REFL_OPACITY * [Math]::Pow(1 - ($i/[double]$REFL_BANDS), 2.0)
      if ($op -le 0.003) { continue }
      $ia = Get-AlphaAttr $op
      $dst = New-Object System.Drawing.Rectangle 0, $yTop, $OUTW, $bandPx
      $g.DrawImage($reflBlur, $dst, 0, $yTop, $OUTW, $bandPx, [System.Drawing.GraphicsUnit]::Pixel, $ia)
      $ia.Dispose()
    }
    $reflBlur.Dispose()
  }

  # 2) projected cast shadow on the floor (squashed silhouette, shifted toward lower-right)
  $castTmp = New-Object System.Drawing.Bitmap $OUTW, $OUTH
  $gca = New-HQGraphics $castTmp
  $gca.TranslateTransform([float]($cx+$CAST_DX), [float]$baseY)
  $gca.ScaleTransform(1.02, -$CAST_SQUASH)   # mirror down + squash
  $gca.TranslateTransform([float](-$cx), [float](-$baseY))
  $gca.DrawImage($silBmp, $fullRect, 0, 0, $OUTW, $OUTH, [System.Drawing.GraphicsUnit]::Pixel)
  $gca.ResetTransform(); $gca.Dispose()
  $castBlur = Blur-Copy $castTmp $CAST_BLUR_W
  $iaCast = Get-AlphaAttr $CAST_OPACITY
  $g.DrawImage($castBlur, $fullRect, 0, 0, $OUTW, $OUTH, [System.Drawing.GraphicsUnit]::Pixel, $iaCast)
  $iaCast.Dispose(); $castBlur.Dispose(); $castTmp.Dispose()

  # 3) tight ambient-occlusion contact pool right where vial meets floor
  $aoBmp = New-Object System.Drawing.Bitmap $OUTW, $OUTH
  $gao = New-HQGraphics $aoBmp
  $aw = $bw*$AO_WSCALE; $ah = $bw*$AO_HSCALE
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,6,18,34))
  $gao.FillEllipse($brush, [float]($cx-$aw/2), [float]($baseY-$ah*0.5), [float]$aw, [float]$ah)
  $brush.Dispose(); $gao.Dispose()
  $aoBlur = Blur-Copy $aoBmp 150
  $iaAO = Get-AlphaAttr $AO_OPACITY
  $g.DrawImage($aoBlur, $fullRect, 0, 0, $OUTW, $OUTH, [System.Drawing.GraphicsUnit]::Pixel, $iaAO)
  $iaAO.Dispose(); $aoBlur.Dispose(); $aoBmp.Dispose()

  $silBmp.Dispose()

  # 4) vial on top
  $g.DrawImage($vial, $fullRect, 0, 0, $vial.Width, $vial.Height, [System.Drawing.GraphicsUnit]::Pixel)

  $outPath = Join-Path $outDir ($slug + '.jpg')
  $canvas.Save($outPath, $enc, $encParams)
  $g.Dispose(); $canvas.Dispose(); $vial.Dispose()
  $made++
  Write-Output ("OK  {0,-22} <- {1}" -f ($slug + '.jpg'), $map[$slug])
}
$scene.Dispose()
Write-Output "DONE ($made images)"
