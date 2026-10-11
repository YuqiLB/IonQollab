# Standing character — editable 136 × 178 pixels

Open **`redcoat-standing_136x178.aseprite`** directly in Aseprite. It has one
ordinary unlocked RGB pixel layer named **Sprite - EDIT HERE**. Pencil and
Eraser can edit the character itself; there is no covering reference layer,
locked background, or active selection.

The canvas is **136 × 178**, twice the previous width and height (four times
the total pixel count). The character was freshly sampled from the original
1097 × 1434 attachment to retain additional detail. The previous 68 × 89
output was not used as the source for the new sprite.

## Files

- `redcoat-standing_136x178.aseprite`: editable native file.
- `redcoat-standing_136x178.png`: transparent native PNG.
- `redcoat-standing_136x178_4x.png`: exact 544 × 712 nearest-neighbour preview.
- `comparison_4x.png`: old 68 × 89 enlarged to the same display size on the
  left; new 136 × 178 source conversion on the right.
- `convert_standing.lua`: full source conversion and export workflow.
- `sources/redcoat-standing.png`: unchanged original attachment.
- `conversion.txt` and `qa/verification.txt`: conversion and editability checks.

## Conversion

The same direct nearest-neighbour workflow is used. The source's almost
invisible alpha speckles are removed at a cutoff of 128; retained pixels become
fully opaque and preserve their original RGB values. No color-based matte
removal, smoothing, redraw, or palette reduction is applied.

The visible source crop `(257,12,610,1419)` is fitted proportionally into a
77 × 178 region at `(29,0)` on the 136 × 178 canvas. Four sampling alignments
were visually compared; the selected phase is recorded in `conversion.txt`.
The original pose and proportions are preserved. Fine detail still simplifies
at native size, but the larger canvas retains more source information.

## Verification and regeneration

The native and enlarged outputs were visually inspected. The saved file is
checked for dimensions, RGB mode, one visible unlocked normal layer, empty
selection, binary transparency, PNG/render equality, and exact 4× enlargement.
Actual Aseprite Pencil and Eraser commands are used inside the hair, face, and
coat; a separate test copy is saved and reopened to verify that the six edits
persist. The delivery remains unchanged. This is a drawing-tool API check,
not a GUI mouse-click test. Marked QA copies are excluded from the ZIP.

The independent `qa/verify_sampling.ps1` check verifies all 24,208 native
pixels against the original source samples and alpha cutoff. Its report is
`qa/source_sampling.txt`.

`convert_standing.lua` runs from the repository root with Aseprite's
`--batch --script` flags and refuses to overwrite final Aseprite files. To
regenerate, use a new version directory and update `ROOT` in the script.
The comparison export additionally reads `sources/previous_68x89.png`.

The previous sprites and game assets are preserved.
