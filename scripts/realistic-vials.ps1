Add-Type -AssemblyName System.Drawing

$root   = 'C:\Users\homel\Downloads\project'
$bgPath = Join-Path $root 'public\images\testing\background_only.png'
$srcDir = Join-Path $root 'public\images\png'
$outDir = Join-Path $root 'public\images\products'
New-Item -ItemType Directory -Force $outDir | Out-Null

# Set $only to a subset of slugs to test; empty = process everything.
$only = @()

# product slug -> vial source filename
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

# --- shadow / reflection tuning ---
$CAST_DX         = 16     # cast shadow horizontal offset (light from upper-left)
$CAST_DY         = 26     # cast shadow vertical offset
$CAST_OPACITY    = 0.27
$CAST_BLUR_W     = 70     # smaller = softer blur
$CONTACT_OPACITY = 0.42
$CONTACT_BLUR_W  = 90
$CONTACT_WSCALE  = 1.06   # contact ellipse width vs vial width
$CONTACT_HSCALE  = 0.16   # contact ellipse height vs vial width
$REFL_OPACITY    = 0.11
$REFL_HEIGHT     = 0.20   # reflection height as fraction of vial height
$REFL_BANDS      = 18
$REFL_BLUR_W     = 300    # soften reflection so mirrored text isn't legible

$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [int64]92)

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
  $ia.SetColorMatrix($cm)
  return $ia
}

function Get-SilhouetteAttr() {
  # RGB -> 0 (black), alpha preserved
  $cm = New-Object System.Drawing.Imaging.ColorMatrix
  $cm.Matrix00 = 0; $cm.Matrix11 = 0; $cm.Matrix22 = 0
  $ia = New-Object System.Drawing.Imaging.ImageAttributes
  $ia.SetColorMatrix($cm)
  return $ia
}

function Blur-Copy($src, $smallW) {
  $smallH = [int]($src.Height * $smallW / $src.Width); if ($smallH -lt 1) { $smallH = 1 }
  $small = New-Object System.Drawing.Bitmap $smallW, $smallH
  $g1 = New-HQGraphics $small
  $g1.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $smallW, $smallH))
  $g1.Dispose()
  $big = New-Object System.Drawing.Bitmap $src.Width, $src.Height
  $g2 = New-HQGraphics $big
  $g2.DrawImage($small, (New-Object System.Drawing.Rectangle 0, 0, $src.Width, $src.Height))
  $g2.Dispose(); $small.Dispose()
  return $big
}

function Get-AlphaBBox($img, $scanW) {
  $scanH = [int]($img.Height * $scanW / $img.Width)
  $small = New-Object System.Drawing.Bitmap $scanW, $scanH
  $g = New-HQGraphics $small
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $scanW, $scanH)); $g.Dispose()
  $minx = $scanW; $miny = $scanH; $maxx = 0; $maxy = 0
  for ($y = 0; $y -lt $scanH; $y++) {
    for ($x = 0; $x -lt $scanW; $x++) {
      if ($small.GetPixel($x, $y).A -gt 30) {
        if ($x -lt $minx) { $minx = $x }; if ($x -gt $maxx) { $maxx = $x }
        if ($y -lt $miny) { $miny = $y }; if ($y -gt $maxy) { $maxy = $y }
      }
    }
  }
  $small.Dispose()
  $sx = $img.Width / $scanW
  return @{ X = $minx * $sx; Y = $miny * $sx; W = ($maxx - $minx) * $sx; H = ($maxy - $miny) * $sx }
}

$bg = [System.Drawing.Image]::FromFile($bgPath)
$fullRect = New-Object System.Drawing.Rectangle 0, 0, $OUTW, $OUTH
$sil = Get-SilhouetteAttr
$made = 0

$keys = if ($only.Count -gt 0) { $only } else { @($map.Keys) }
foreach ($slug in $keys) {
  $vp = Join-Path $srcDir $map[$slug]
  if (-not (Test-Path $vp)) { Write-Output "MISSING vial: $($map[$slug])"; continue }
  $vial = [System.Drawing.Bitmap]::FromFile($vp)

  # canvas bbox of the vial (source drawn to full frame)
  $bb = Get-AlphaBBox $vial 100
  $sc = $OUTW / $vial.Width
  $bx = $bb.X * $sc; $by = $bb.Y * $sc; $bw = $bb.W * $sc; $bh = $bb.H * $sc
  $baseY = $by + $bh
  $cx = $bx + $bw / 2

  $canvas = New-Object System.Drawing.Bitmap $OUTW, $OUTH
  $g = New-HQGraphics $canvas

  # 1) background (cover)
  $bgScale = [Math]::Max($OUTW / $bg.Width, $OUTH / $bg.Height)
  $bgw = $bg.Width * $bgScale; $bgh = $bg.Height * $bgScale
  $g.DrawImage($bg, [float](($OUTW - $bgw) / 2), [float](($OUTH - $bgh) / 2), [float]$bgw, [float]$bgh)

  # 2) reflection (mirrored vial fading downward from the base)
  $reflPx = [int]($bh * $REFL_HEIGHT)
  if ($reflPx -gt 8) {
    $reflTmp = New-Object System.Drawing.Bitmap $OUTW, $OUTH
    $gr = New-HQGraphics $reflTmp
    $gr.TranslateTransform(0, [float](2 * $baseY))
    $gr.ScaleTransform(1, -1)
    $gr.DrawImage($vial, $fullRect, 0, 0, $vial.Width, $vial.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $gr.ResetTransform(); $gr.Dispose()
    $reflBlur = Blur-Copy $reflTmp $REFL_BLUR_W
    $reflTmp.Dispose()
    $bandH = [Math]::Max(1, [int]($reflPx / $REFL_BANDS))
    for ($i = 0; $i -lt $REFL_BANDS; $i++) {
      $yTop = [int]($baseY + $i * $bandH)
      $op = $REFL_OPACITY * (1 - ($i / [double]$REFL_BANDS))
      if ($op -le 0) { continue }
      $ia = Get-AlphaAttr $op
      $dst = New-Object System.Drawing.Rectangle 0, $yTop, $OUTW, $bandH
      $g.DrawImage($reflBlur, $dst, 0, $yTop, $OUTW, $bandH, [System.Drawing.GraphicsUnit]::Pixel, $ia)
      $ia.Dispose()
    }
    $reflBlur.Dispose()
  }

  # 3) cast shadow (blurred silhouette, offset toward lower-right)
  $silBmp = New-Object System.Drawing.Bitmap $OUTW, $OUTH
  $gs = New-HQGraphics $silBmp
  $gs.DrawImage($vial, $fullRect, 0, 0, $vial.Width, $vial.Height, [System.Drawing.GraphicsUnit]::Pixel, $sil)
  $gs.Dispose()
  $castBlur = Blur-Copy $silBmp $CAST_BLUR_W
  $iaCast = Get-AlphaAttr $CAST_OPACITY
  $castDst = New-Object System.Drawing.Rectangle ([int]$CAST_DX), ([int]$CAST_DY), $OUTW, $OUTH
  $g.DrawImage($castBlur, $castDst, 0, 0, $OUTW, $OUTH, [System.Drawing.GraphicsUnit]::Pixel, $iaCast)
  $iaCast.Dispose(); $castBlur.Dispose(); $silBmp.Dispose()

  # 4) contact shadow (soft ellipse pooled at the base)
  $csBmp = New-Object System.Drawing.Bitmap $OUTW, $OUTH
  $gc = New-HQGraphics $csBmp
  $ew = $bw * $CONTACT_WSCALE; $eh = $bw * $CONTACT_HSCALE
  $ex = $cx - $ew / 2; $ey = $baseY - $eh * 0.45
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Black)
  $gc.FillEllipse($brush, [float]$ex, [float]$ey, [float]$ew, [float]$eh)
  $brush.Dispose(); $gc.Dispose()
  $csBlur = Blur-Copy $csBmp $CONTACT_BLUR_W
  $iaC = Get-AlphaAttr $CONTACT_OPACITY
  $g.DrawImage($csBlur, $fullRect, 0, 0, $OUTW, $OUTH, [System.Drawing.GraphicsUnit]::Pixel, $iaC)
  $iaC.Dispose(); $csBlur.Dispose(); $csBmp.Dispose()

  # 5) vial on top
  $g.DrawImage($vial, $fullRect, 0, 0, $vial.Width, $vial.Height, [System.Drawing.GraphicsUnit]::Pixel)

  $outPath = Join-Path $outDir ($slug + '.jpg')
  $canvas.Save($outPath, $enc, $encParams)
  $g.Dispose(); $canvas.Dispose(); $vial.Dispose()
  $made++
  Write-Output ("OK  {0,-22} <- {1}" -f ($slug + '.jpg'), $map[$slug])
}

$bg.Dispose()
Write-Output "DONE ($made images)"
