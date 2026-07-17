# Gera ícones PWA/favicon a partir da logo oficial CDS (fundo preto).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = [System.IO.Path]::GetFullPath((Join-Path $root '..\..\..\shared\img\logo-cds-sistemas.png'))
if (-not (Test-Path $src)) { throw "Logo não encontrada: $src" }

$logo = [System.Drawing.Image]::FromFile($src)

function New-AppIcon {
  param(
    [int]$Size,
    [string]$OutPath,
    [double]$PaddingRatio = 0.08
  )
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(255, 0, 0, 0))
  $pad = [int]([Math]::Floor($Size * $PaddingRatio))
  $box = $Size - (2 * $pad)
  $g.DrawImage($logo, $pad, $pad, $box, $box)
  $g.Dispose()
  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "OK $OutPath ($Size x $Size)"
}

New-AppIcon -Size 16  -OutPath (Join-Path $root 'favicon-16.png') -PaddingRatio 0.06
New-AppIcon -Size 32  -OutPath (Join-Path $root 'favicon-32.png') -PaddingRatio 0.06
New-AppIcon -Size 48  -OutPath (Join-Path $root 'icon-48.png') -PaddingRatio 0.06
New-AppIcon -Size 96  -OutPath (Join-Path $root 'icon-96.png') -PaddingRatio 0.06
New-AppIcon -Size 180 -OutPath (Join-Path $root 'apple-touch-icon.png') -PaddingRatio 0.08
New-AppIcon -Size 192 -OutPath (Join-Path $root 'icon-192.png') -PaddingRatio 0.08
New-AppIcon -Size 512 -OutPath (Join-Path $root 'icon-512.png') -PaddingRatio 0.08
New-AppIcon -Size 512 -OutPath (Join-Path $root 'icon-512-maskable.png') -PaddingRatio 0.18

# favicon.ico (32x32) — abas do navegador no celular
$icoPng = Join-Path $root 'favicon-32.png'
$icoOut = Join-Path $root 'favicon.ico'
$iconBmp = [System.Drawing.Image]::FromFile($icoPng)
$hIcon = $iconBmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = [System.IO.File]::Open($icoOut, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$iconBmp.Dispose()
Write-Host "OK $icoOut"

$logo.Dispose()
Write-Host 'Ícones PWA/favicon gerados.'
