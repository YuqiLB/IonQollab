param(
  [string]$AsepritePath = 'C:\Users\bondl\aseprite\build-v1444\bin\aseprite.exe'
)

# Export the supplied native canvases, without changing the editable sources.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$sprites = @(
  @{ Name = 'redcoat-standing-136x178'; Source = 'art/sprites/redcoat_standing_136x178_v001/redcoat-standing_136x178.aseprite'; Width = 136; Height = 178 },
  @{ Name = 'machine-68x89'; Source = 'art/sprites/redcoat_and_machine_68x89_v001/machine_68x89.aseprite'; Width = 68; Height = 89 },
  @{ Name = 'redcoat-fallen-68x89'; Source = 'art/sprites/redcoat_and_machine_68x89_v001/redcoat-fallen_68x89.aseprite'; Width = 68; Height = 89 }
)
foreach ($sprite in $sprites) {
  $sourceFile = Join-Path $projectRoot $sprite.Source
  $relativeOutput = 'assets/characters/' + $sprite.Name + '.png'
  $outputFile = Join-Path $projectRoot $relativeOutput
  $sourceHash = (Get-FileHash -LiteralPath $sourceFile -Algorithm SHA256).Hash
  $startedAt = [DateTime]::UtcNow
  Start-Process -FilePath $AsepritePath -WorkingDirectory $projectRoot -ArgumentList @(
    '--batch', $sprite.Source, '--save-as', $relativeOutput
  ) -WindowStyle Hidden -Wait
  # This native build can return 1 after a successful export; validate the PNG.
  $result = Get-Item -LiteralPath $outputFile
  if ($result.LastWriteTimeUtc -lt $startedAt.AddSeconds(-2)) { throw "No fresh export: $relativeOutput" }
  $bytes = [System.IO.File]::ReadAllBytes($outputFile)
  if ($bytes.Length -lt 24 -or [BitConverter]::ToString($bytes, 0, 8) -ne '89-50-4E-47-0D-0A-1A-0A') {
    throw "Not a PNG: $relativeOutput"
  }
  $width = $bytes[16] * 16777216 + $bytes[17] * 65536 + $bytes[18] * 256 + $bytes[19]
  $height = $bytes[20] * 16777216 + $bytes[21] * 65536 + $bytes[22] * 256 + $bytes[23]
  if ($width -ne $sprite.Width -or $height -ne $sprite.Height) { throw "Incorrect native size: $relativeOutput" }
  if ((Get-FileHash -LiteralPath $sourceFile -Algorithm SHA256).Hash -ne $sourceHash) {
    throw "Editable source changed unexpectedly: $sourceFile"
  }
  Write-Output ("Exported $relativeOutput ($width x $height; source unchanged)")
}
