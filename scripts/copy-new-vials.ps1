Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\homel\OneDrive\Pictures\png'
$dst = 'C:\Users\homel\Downloads\project\public\images\png'

$files = @(
  'ARA290 PNG.png',
  'trifecta PNG.png',
  'trifecta deluxe.png',
  'neuro duo.jpg',
  'shred + PNG.png',
  'peak pulse PNG.png',
  'metabolic reset 1  PNG.png'
)

foreach ($f in $files) {
  $s = Join-Path $src $f
  if (Test-Path -LiteralPath $s) {
    $d = Join-Path $dst $f
    Copy-Item -LiteralPath $s -Destination $d -Force
    $img = [System.Drawing.Image]::FromFile($d)
    '{0,-30} {1} x {2}  ar={3:N3}' -f $f, $img.Width, $img.Height, ($img.Width / $img.Height)
    $img.Dispose()
  } else {
    'MISSING: ' + $f
  }
}
