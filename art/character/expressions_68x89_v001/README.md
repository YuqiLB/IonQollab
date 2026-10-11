# Mira expressions — editable 68 × 89 pixels

Open the `.aseprite` files directly in Aseprite. Each has one ordinary,
unlocked RGB pixel layer named **Character - EDIT HERE**. The character itself
is on that layer: use Pencil to repaint existing pixels, Eraser to remove them,
and the eyedropper to pick existing colors. There is no reference layer,
covering layer, locked background, or active selection.

| Expression | Editable file | Transparent export |
| --- | --- | --- |
| Serious / annoyed | `mira-serious_68x89.aseprite` | `mira-serious_68x89.png` |
| Surprised | `mira-surprised_68x89.aseprite` | `mira-surprised_68x89.png` |
| Blushing / embarrassed | `mira-blushing_68x89.aseprite` | `mira-blushing_68x89.png` |
| Happy / laughing | `mira-happy_68x89.aseprite` | `mira-happy_68x89.png` |

The editable canvases and native PNGs are exactly **68 × 89**. Files ending
`_8x.png` are **544 × 712** viewing previews, not the native editing files.
The contact sheets use the order serious, surprised, blushing, happy.

## Conversion

The process follows the earlier native portrait conversion: direct
nearest-neighbour sampling, transparent matte removal, and one unlocked raster
layer. Retained RGB values come directly from the supplied screenshots; there
is no smoothing, palette reduction, generative redraw, or feature repainting.
Fine detail necessarily simplifies at this resolution.

These screenshots have different proportions from the earlier portrait, so
each is fitted proportionally with integer rounding, centered horizontally,
and padded with transparency to the same 68 × 89 canvas. Sampling offsets were
visually compared to retain each expression and its glasses. Neutral gray
background connected to the exterior and confirmed openings between hair
strands was removed. The serious screenshot's unrelated two-pixel left border
was excluded before sampling.

Original source copies in `sources/` are unchanged. Their corresponding files
in `C:/Users/bondl/OneDrive/Pictures/Screenshots/` are:

| Expression | Screenshot, 2026-10-10 | Source size | Fitted size / x offset | Sampling phase |
| --- | --- | --- | --- | --- |
| Serious | `193112.png` | 302 × 441; crop left 2 px | 61 × 89 / 3 px | 0.75 |
| Surprised | `193213.png` | 305 × 450 | 60 × 89 / 4 px | 0.25 |
| Blushing | `193224.png` | 297 × 456 | 58 × 89 / 5 px | 0 |
| Happy | `193245.png` | 302 × 447 | 60 × 89 / 4 px | 0.25 |

## Verification

The native contact sheet and enlarged light/dark previews were visually
inspected. `qa/verify_editable.lua` checks saved dimensions, RGB mode, one
normal editable layer, empty selection, active-layer routing, binary alpha,
PNG/render equality, and exact nearest-neighbour enlargement.

It also invokes Aseprite's actual Pencil and Eraser tools on opaque hair,
face, and clothing pixels, saves a separate probe, and reopens it to check
that all six edits persisted. It verifies that the delivered files remain
byte-for-byte unchanged. Results are recorded in `qa/verification.txt`.
This is a drawing-tool API test, not a mouse-click UI test. Probe files in the
working directory contain deliberate test marks and are excluded from the
delivery ZIP.

## Lua source

`convert_expressions.lua` contains the full conversion, matte cleanup, and
exports. It uses paths relative to the repository root and refuses to
overwrite existing Aseprite deliveries. To regenerate into a new version,
copy the directory and adjust `ROOT` in the script before running:

```powershell
Start-Process -FilePath 'C:\Users\bondl\aseprite\build-v1444\bin\aseprite.exe' -ArgumentList @('--batch','--script','art/character/expressions_68x89_v002/convert_expressions.lua') -WindowStyle Hidden -Wait
```

Use an output directory without existing final `.aseprite` files. The original
screenshots, earlier portrait versions, and game assets are preserved.
