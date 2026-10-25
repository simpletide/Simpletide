Add-Type -AssemblyName System.Drawing

$srcDir = 'C:\Users\homel\Downloads\project\public\images\png'
$files = Get-ChildItem -LiteralPath $srcDir -File | Sort-Object Name

foreach ($f in $files) {
  $img = [System.Drawing.Bitmap]::FromFile($f.FullName)
  $fmt = $img.PixelFormat
  $hasAlphaFlag = ($fmt.ToString() -match 'Argb|Alpha')
  # sample corners + a grid to detect真 transparency
  $w = $img.Width; $h = $img.Height
  $corner = $img.GetPixel(5, 5)
  $minA = 255
  for ($x = 0; $x -lt $w; $x += [int]($w/20)) {
    for ($y = 0; $y -lt $h; $y += [int]($h/20)) {
      $a = $img.GetPixel($x, $y).A
      if ($a -lt $minA) { $minA = $a }
    }
  }
  '{0,-28} {1,-22} alphaFmt={2,-5} minA={3,-4} corner=A{4} R{5} G{6} B{7}' -f $f.Name, $fmt, $hasAlphaFlag, $minA, $corner.A, $corner.R, $corner.G, $corner.B
  $img.Dispose()
}
