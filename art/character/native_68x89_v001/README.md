# Native 68 × 89 editable portrait

Open **`portrait_68x89_v003.aseprite`** directly in Aseprite.

The canvas is actually 68 × 89 pixels. All character pixels are on one ordinary,
unlocked RGB pixel layer named **Character - EDIT HERE**, selected when the file
is created. Use the Pencil tool to paint existing pixels and the Eraser tool to
remove them. Use the eyedropper to pick existing colors. The layer supports
transparency and there is no selection restricting edits.

## Why the previous file was confusing

The previous exact import had a gray layer underneath a separate character
layer. Both were editable, but painting on the lower layer appears only outside
the opaque character. That script did not explicitly activate the character
layer. This version has a single normal pixel layer, so every visible pixel is
on the same editable cel.

## Files

- `portrait_68x89_v003.aseprite`: final native editable file.
- `portrait_68x89_v003.png`: native transparent 68 × 89 PNG.
- `portrait_68x89_v003_8x.png`: 544 × 712 nearest-neighbour preview, for viewing.
- `portrait_68x89_v003.lua`: exact conversion source snapshot.
- `portrait_68x89_v003_light.png` / `_dark.png`: visual review backgrounds.
- `verify_editable.lua` / `qa_editable.txt`: saved-file and actual tool checks.
- `qa_edit_probe.aseprite`: separate test copy containing deliberate test edits;
  use the final file above for your artwork.

The exact 683 × 891 portrait was rendered from its saved Aseprite file and
reduced with nearest-neighbour sampling. Sampling alignment was visually
compared to retain the glasses and expression. Exterior-connected gray
background and the confirmed hair openings were made transparent; retained
colors were not averaged or palette-reduced. The character was not redrawn.
Some fine details necessarily become simpler at this resolution.

The final file has one frame and one normal, visible, editable layer; no
reference image, special background layer, group, tilemap or covering layer.
Earlier artwork is unchanged. Earlier native conversion passes are retained
as v001 and v002 for review history.

## Editability verification

The meaningful test uses Aseprite's own Pencil and Eraser tool commands on
originally opaque pixels in the hair, face and torso, relying on the active
layer rather than explicitly targeting a layer. It saves a separate test copy,
reopens it and verifies that the visible paint and transparency edits persist.
The delivered file remains untouched by these tests.

Windows UI automation could not initialize in this session; no mouse-click UI
test is claimed. The tool checks run through Aseprite's documented
[`app.useTool`](https://aseprite.org/api/app#appusetool) API, which invokes its
drawing tools, and are recorded in `qa_editable.txt`.

To regenerate, run from the repository root with an unused revision:

```powershell
Start-Process -FilePath 'C:\Users\bondl\aseprite\build-v1444\bin\aseprite.exe' -ArgumentList @('--batch','--script-param','revision=004','--script-param','phase=0','--script','art/character/native_68x89_v001/make_native.lua') -WindowStyle Hidden -Wait
```
