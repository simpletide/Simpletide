$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$dir = 'C:\Users\homel\Downloads\project\reference\peptora'
New-Item -ItemType Directory -Force $dir | Out-Null
$base = 'https://peptora-medusa-images-cdn.sfo3.digitaloceanspaces.com/variant-images/'

$items = [ordered]@{
  'tesamorelin.jpg' = 'Tesamorelin 20mg.jpg'
  'bpc-157.jpg'     = 'BPC-157 10mg.jpg'
  'glow.jpg'        = 'glow.jpg'
  'wolverine.jpg'   = 'Wolverine 20mg.jpg'
  'klow.jpg'        = 'KLOW.jpg'
  'nad.jpg'         = 'NAD+ 500mg.jpg'
}

foreach ($k in $items.Keys) {
  $u = $base + [uri]::EscapeDataString($items[$k])
  $out = Join-Path $dir $k
  try {
    Invoke-WebRequest -Uri $u -OutFile $out
    $sz = (Get-Item $out).Length
    $im = [System.Drawing.Image]::FromFile($out)
    '{0,-16} {1}x{2}  {3} bytes' -f $k, $im.Width, $im.Height, $sz
    $im.Dispose()
  } catch {
    'FAIL ' + $k + ' : ' + $_.Exception.Message
  }
}
