Add-Type -AssemblyName System.Drawing

$root   = 'C:\Users\homel\project'
$bgPath = Join-Path $root 'public\images\testing\background_only.png'
$srcDir = Join-Path $root 'public\images\png'
$outDir = Join-Path $root 'public\images\products'
New-Item -ItemType Directory -Force $outDir | Out-Null

# product slug -> vial source filename (in public/images/png)
$map = [ordered]@{
  # --- existing products ---
  'glp-3-rt'            = 'R10 PNG.png'
  'glp-2-tz'            = 'Tirz 10 PNG.png'
  'tesamorelin'         = 'Tesa 10 PNG.png'
  'mots-c'              = 'MOTS 10 PNG.png'
  'glow'                = 'GLOW 70.png'
  'klow'                = 'KLOW PNG.png'
  'adamax'              = 'ADAMAX  10 PNG.png'
  'glutathione'         = 'Glutathione PNG.png'
  'bac-water'           = 'BAC 10 PNG.png'
  'cjc-1295-ipamorelin' = 'CJC + IPA 10 PNG.png'
  'nad-plus'            = 'NAD 500 PNG.png'
  'mt1'                 = 'MT1 PNG.png'
  'melanotan-2'         = 'MT2 PNG.jpg'
  # --- new products ---
  'ghk-cu'              = 'GHK 50 PNG.png'
  '5-amino-1mq'         = '5 Amino PNG.png'
  'kpv'                 = 'KPV 10 PNG.png'
  'wolverine'           = 'WOLVERINE 10 PNG.png'
  'semax'               = 'SEMAX 10 PNG.png'
  'selank'              = 'SELANK 10 PNG.png'
  'ss-31'               = 'SS31 10 PNG.png'
  'll-37'               = 'LL37 PNG.png'
  'bpc-157'             = 'BPC PNG.png'
  'tb-500'              = 'TB 500 PNG.png'
  'sermorelin'          = 'Serm 10 PNG.png'
  'ipamorelin'          = 'IPA 10 PNG.png'
  'igf1-lr3'            = 'IGF PNG.png'
  'cagrilintide'        = 'Cagri PNG.png'
  'hcg'                 = 'HCG 5000 iu PNG.png'
  'epithalon'           = 'Epithalon PNG.png'
  'kisspeptin'          = 'Kisspeptin 10 PNG.png'
  'pt-141'              = 'PT 141 PNG.png'
  'thymosin-alpha-1'    = 'Thymosin Alpha 1- PNG.png'
  'dsip'                = 'DSIP 10 PNG.png'
  'cjc-1295-with-dac'   = 'CJC with dac PNG.png'
  'cjc-1295-no-dac'     = 'CJC no dac PNG.png'
  'aod-9604'            = 'AOD PNG.png'
  # --- custom stacks / bundles ---
  'ara-290'             = 'ARA290 PNG.png'
  'trifecta'            = 'trifecta PNG.png'
  'trifecta-deluxe'     = 'trifecta deluxe.png'
  'neuro-duo'           = 'neuro duo.jpg'
  'shred-plus'          = 'shred + PNG.png'
  'peak-pulse'          = 'peak pulse PNG.png'
  'metabolic-reset'     = 'metabolic reset 1  PNG.png'
}

$OUTW = 2560
$OUTH = 3200
# Zoom factor for single vials (1.0 = vial PNG's own framing). Multi-vial bundles stay at 1.0.
$ZOOM = 1.2
$NOZOOM = @('peak-pulse', 'shred-plus', 'neuro-duo', 'trifecta', 'trifecta-deluxe', 'metabolic-reset')

$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [int64]96)

function Draw-Cover($g, $img, $cw, $ch) {
  $scale = [Math]::Max($cw / $img.Width, $ch / $img.Height)
  $w = $img.Width * $scale
  $h = $img.Height * $scale
  $x = ($cw - $w) / 2
  $y = ($ch - $h) / 2
  $g.DrawImage($img, [float]$x, [float]$y, [float]$w, [float]$h)
}

$bg = [System.Drawing.Image]::FromFile($bgPath)
$made = 0

foreach ($slug in $map.Keys) {
  $vp = Join-Path $srcDir $map[$slug]
  if (-not (Test-Path $vp)) { Write-Output "MISSING vial: $($map[$slug])"; continue }
  $vial = [System.Drawing.Image]::FromFile($vp)

  $canvas = New-Object System.Drawing.Bitmap $OUTW, $OUTH
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  $g.SmoothingMode       = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode   = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode     = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality  = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  Draw-Cover $g $bg $OUTW $OUTH

  $s = if ($NOZOOM -contains $slug) { 1.0 } else { $ZOOM }
  $vw = $OUTW * $s
  $vh = $OUTH * $s
  $vx = ($OUTW - $vw) / 2
  $vy = ($OUTH - $vh) / 2
  $g.DrawImage($vial, [float]$vx, [float]$vy, [float]$vw, [float]$vh)

  $outPath = Join-Path $outDir ($slug + '.jpg')
  $canvas.Save($outPath, $enc, $encParams)
  $g.Dispose(); $canvas.Dispose(); $vial.Dispose()
  $made++
  Write-Output ("OK  {0,-24} <- {1}" -f ($slug + '.jpg'), $map[$slug])
}

$bg.Dispose()
Write-Output "DONE ($made images)"
