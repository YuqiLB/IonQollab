# Mira — focused face cleanup, revision 004

The current delivery is `portrait_v004.aseprite`. It was created by opening
the actual latest editable source, `../portrait_v002.aseprite`, and replacing
only the face-related pixel cels. The original source remains intact.

## Files

- `portrait_v004.aseprite`: revised layered source, with construction guides hidden.
- `portrait_v004.lua`: exact Lua script snapshot used for this revision.
- `portrait_v004.png`: native transparent 192 × 256 portrait.
- `portrait_v004_4x.png`: 768 × 1024 full portrait, exact nearest neighbour.
- `portrait_v004_before_after_native.png`: native face comparison, before left / after right.
- `portrait_v004_before_after_6x.png`: the identical comparison at exact 6× scale.
- `portrait_v004_face_8x.png`: final face at exact 8× scale.
- `portrait_v004_guides_8x.png`: review-only view of the facial landmarks.
- `verify_cleanup.lua` and `qa_portrait_v004.txt`: independent saved-file and preservation checks.

## Changes

The upper face, eye positions, head tilt and three-quarter pose remain fixed.
The lower cheeks taper locally toward a short rounded chin base about two
native pixels higher than the old base. The mouth moves two pixels right to
align with the revised chin, while retaining the closed asymmetric smirk.
The near lens's lower edge is raised by one pixel; the far lens retains its
original depth. The far iris is slightly narrower and its outer lid follows
the near lid's angle more closely. The nose stays on the original bridge axis.

Disconnected cheek and chin highlights were replaced by a quiet central skin
plane, connected warm shading along the side of the jaw, and a compact chin
highlight. The neck edit is restricted to the pre-existing skin directly below
the jaw; the collar is preserved.

All landmarks use one shared tilted coordinate basis in `refine_face.lua`:

| Landmark | Native coordinate |
| --- | --- |
| Forehead center | 121, 51 |
| Glasses bridge | 114, 81 |
| Nose base | 115, 94 |
| Mouth center | 109, 104 |
| Chin | 109, 120 |
| Near / far eye anchors | 94, 77 / 124, 83 |

No sprite, layer, or reference was rescaled, rotated, warped, or regenerated.
Drawing uses native integer pixel clusters and the source's existing palette.
The canvas, frame count, character design, hair, clothing, accessories and pose
are retained. No expressions or animation were added.

## Visual review

No new screenshot was available with the cleanup request. The latest modified
editable file and its actual exported portrait/face were inspected first.
`structure_v001` retains the initial jaw and centerline study, made before
moving the features. Revision 003 is the retained review pass. Its cheek notch,
isolated bright nasal stripe, and shallow far lens were corrected in revision 004.

The final before/after comparison and full portrait were inspected at native
size and with exact nearest-neighbour enlargement. The final guide view was
also inspected for landmark alignment. The cleanup keeps the same recognizable
expression and a rounded chin; further narrowing was deliberately avoided.

Each comparison panel uses the same native crop: `(60, 42, 84, 88)`. The before
panel is at `(0, 0)`, the after panel at `(92, 0)`, with an eight-pixel gap.
The face crop and portrait are never independently resized to align them.

## Re-run

Run from `C:\Users\bondl\IonQollab` and choose an unused output revision:

```powershell
Start-Process -FilePath 'C:\Users\bondl\aseprite\build-v1444\bin\aseprite.exe' -ArgumentList @('--batch','--script-param','stage=final','--script-param','revision=005','--script','art/character/mira_192_v001/face_cleanup_v001/refine_face.lua') -WindowStyle Hidden -Wait
```

This cleanup script intentionally always reads the preserved v002 input. It
does not reconstruct the entire portrait and does not overwrite existing output
versions. To build on later manual edits, update the explicit `INPUT` first.
