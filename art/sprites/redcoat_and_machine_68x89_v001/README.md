# Editable 68 × 89 sprites

Open the `.aseprite` files directly in Aseprite. Each has one ordinary unlocked
RGB pixel layer named **Sprite - EDIT HERE**. Every visible pixel belongs to
that layer, so Pencil and Eraser can edit the sprite itself. There is no
reference layer, covering layer, locked background, or restrictive selection.

| Sprite | Editable file | Transparent native PNG |
| --- | --- | --- |
| Standing character | `redcoat-standing_68x89.aseprite` | `redcoat-standing_68x89.png` |
| Fallen character | `redcoat-fallen_68x89.aseprite` | `redcoat-fallen_68x89.png` |
| Machine | `machine_68x89.aseprite` | `machine_68x89.png` |

All canvases are exactly **68 × 89**. Files ending `_8x.png` are exact
nearest-neighbour **544 × 712** previews. `sprites_native.png` and
`sprites_preview_4x.png` show standing, fallen, machine from left to right.

## Process

The three original PNG attachments are preserved unchanged in `sources/`.
This uses the same direct nearest-neighbour conversion and editable single
layer workflow as the earlier portraits. The artwork was not redrawn, rotated,
smoothed, or palette-reduced. Each retained RGB value comes directly from a
sampled source pixel.

These inputs already have transparent backgrounds. Most visible source pixels
have alpha 253, and almost invisible stray edge pixels have very low alpha.
The conversion uses alpha 128 as its visibility cutoff: lower alpha becomes
transparent; retained alpha becomes 255. No color-based background removal is
used, preserving the black outlines and gray machine structure.

After removing empty margins according to that cutoff, each sprite is fitted
proportionally with integer rounding, centered horizontally, and bottom-aligned
in its 68 × 89 canvas. The horizontal fallen pose therefore uses a 68 × 30
region with transparent space above it. It is not stretched into an upright
shape. All three share the same bottom baseline.

| Sprite | Source size | Source crop `(x,y,width,height)` | Fitted size | Output offset | Sampling phase |
| --- | --- | --- | --- | --- | --- |
| Standing | 1097 × 1434 | `(257,12,610,1419)` | 38 × 89 | `(15,0)` | 0.75 |
| Fallen | 1536 × 1024 | `(33,220,1484,661)` | 68 × 30 | `(0,59)` | 0.5 |
| Machine | 1097 × 1434 | `(109,70,962,1319)` | 65 × 89 | `(1,0)` | 0.5 |

Four sampling offsets were compared visually to retain the clearest details.
Fine details necessarily simplify at this small resolution. Original poses,
orientation, colors, clothing, and machine design are retained.

## Verification

The original images, native outputs, and nearest-neighbour previews were
visually inspected. `qa/verify_editable.lua` checks the saved 68 × 89 RGB files,
one active unlocked normal layer, empty selection, native/render equality,
binary transparency, and exact 8× enlargement.

The independent `qa/verify_sampling.ps1` check compares every native PNG pixel
against its corresponding original source sample and alpha cutoff. All 6,052
pixels per output match. Results are recorded in `qa/source_sampling.txt`.

It invokes Aseprite's actual Pencil and Eraser tools on opaque pixels inside
three regions of each sprite, saves separate test copies, and reopens them to
verify that the edits persist. Final delivery files remain unchanged. The
report is `qa/verification.txt`. This is a drawing-tool API test, not a GUI
mouse-click test. Deliberately modified QA probes are excluded from the ZIP.

## Lua source

`convert_sprites.lua` contains the complete conversion and export workflow.
Run from the repository root with Aseprite's batch command. It refuses to
overwrite final Aseprite files. For a new version, use a new output directory,
copy the source PNGs, and update `ROOT` in the Lua script:

```powershell
Start-Process -FilePath 'C:\Users\bondl\aseprite\build-v1444\bin\aseprite.exe' -ArgumentList @('--batch','--script','art/sprites/redcoat_and_machine_68x89_v002/convert_sprites.lua') -WindowStyle Hidden -Wait
```

Earlier artwork and the game assets are unchanged.
