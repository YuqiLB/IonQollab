param(
  [string]$AsepritePath = 'C:\Users\bondl\aseprite\build-v1444\bin\aseprite.exe'
)

# Native exports only. No resizing, palette conversion, trimming or source edits.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$portraits = @(
  @{ Name = 'idle'; Source = 'art/character/native_68x89_v001/portrait_68x89_v003.aseprite' },
  @{ Name = 'blushing'; Source = 'art/character/expressions_68x89_v001/mira-blushing_68x89.aseprite' },
  @{ Name = 'happy'; Source = 'art/character/expressions_68x89_v001/mira-happy_68x89.aseprite' },
  @{ Name = 'serious'; Source = 'art/character/expressions_68x89_v001/mira-serious_68x89.aseprite' },
  @{ Name = 'surprised'; Source = 'art/character/expressions_68x89_v001/mira-surprised_68x89.aseprite' }
)

foreach ($portrait in $portraits) {
  $sourceFile = Join-Path $projectRoot $portrait.Source
  $relativeOutput = 'assets/characters/mira-' + $portrait.Name + '-68x89.png'
  $outputFile = Join-Path $projectRoot $relativeOutput
  $sourceHash = (Get-FileHash -LiteralPath $sourceFile -Algorithm SHA256).Hash
  $startedAt = [DateTime]::UtcNow
  $export = Start-Process -FilePath $AsepritePath -WorkingDirectory $projectRoot -ArgumentList @(
    '--batch', $portrait.Source, '--save-as', $relativeOutput
  ) -WindowStyle Hidden -Wait -PassThru
  # This native build may return exit code 1 even after a successful PNG export.
  # Require a newly written, correctly sized PNG instead of trusting that code.
  $result = Get-Item -LiteralPath $outputFile
  if ($result.LastWriteTimeUtc -lt $startedAt.AddSeconds(-2)) { throw "No fresh export: $relativeOutput" }
  $bytes = [System.IO.File]::ReadAllBytes($outputFile)
  if ($bytes.Length -lt 24 -or [BitConverter]::ToString($bytes, 0, 8) -ne '89-50-4E-47-0D-0A-1A-0A') {
    throw "Not a PNG: $relativeOutput"
  }
  $width = $bytes[16] * 16777216 + $bytes[17] * 65536 + $bytes[18] * 256 + $bytes[19]
  $height = $bytes[20] * 16777216 + $bytes[21] * 65536 + $bytes[22] * 256 + $bytes[23]
  if ($width -ne 68 -or $height -ne 89) { throw "Expected a 68 x 89 export: $relativeOutput" }
  if ((Get-FileHash -LiteralPath $sourceFile -Algorithm SHA256).Hash -ne $sourceHash) {
    throw "Editable source changed unexpectedly: $sourceFile"
  }
  Write-Output ('Exported ' + $relativeOutput + ' (68 x 89; source unchanged)')
}
