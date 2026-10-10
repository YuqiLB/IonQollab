# Mira — 192 × 256 base portrait

The delivery is `portrait_v002`. This is one base design with one frame;
`portrait_v001` is the retained review pass of the same design. All earlier
character artwork elsewhere in the repository remains untouched.

## Deliverables

- `portrait_v002.aseprite` — editable indexed source.
- `portrait_v002.lua` — exact Lua source snapshot used to create the delivery.
- `portrait_v002.png` — native transparent 192 × 256 PNG.
- `portrait_v002_4x.png` — exact 768 × 1024 nearest-neighbour preview.
- `portrait_v002_face_8x.png` — 768 × 736 nearest-neighbour face crop.
- `portrait_v002_light.png` / `portrait_v002_dark.png` — background review views.
- `verify_portrait.lua` / `qa_portrait_v002.txt` — saved-file verification.

The art uses 32 opaque palette entries plus fully transparent index 0.
There are ten visible editable layers and one hidden editable construction
guide layer. The separate layers contain back hair, black knit, plum blazer,
neck, face/ear, eyes/brows, nose/mouth, glasses, front hair, and accessories.

## Construction and review

The character was drawn from integer pixel primitives through Aseprite's Lua
API. The supplied reference was visually consulted; no reference pixels were
loaded, traced, sampled, or downsampled. No image-generation tool, blur,
antialiasing, or semitransparent edge pixels were used.

The retained stages document sequential review:

1. `stage01`: inspected the full silhouette at 4×. Rebuilt head, jaw, neck,
   shoulders and hair masses at 192 × 256, without the old face geometry.
2. `stage02`: inspected the face construction crop with the curved centerline,
   tilted eye line, nose base, mouth line and chin guides visible.
3. `stage03` and `stage03_b`: inspected enlarged faces and full portraits.
   The three main issues were fringe crowding the near eye, oversized/open
   irises, and a broad lip shape. Opened the fringe, reduced the iris/lid
   shapes, and made the closed smile more compact. Also reduced the nose.
4. `stage04`: inspected hair flow, tailored lapels, shoulder connections,
   collar and restrained cloth shading before adding jewellery.
5. `portrait_v001`: inspected native size, 4×, face crop and both backgrounds.
   Simplified the far-cheek and chin highlights and the near frame corner.
   Added the orbit clip, earrings, pendant and small lapel pin.
6. `portrait_v002`: opened the far eye slightly and restored its distinct
   pupil/iris separation. Inspected the final native, 4×, face, light and dark
   exports. The source snapshot matches `construct.lua` byte-for-byte.

Remaining visual limitation: the face and smile read softer and more simplified
than the approved reference, and the hair uses broader graphic highlight bands.
The design has not been approved by the user. No expressions or animation
have been created and the game interface has not been changed.

## Rebuild

Run from `C:\Users\bondl\IonQollab`. Select an unused revision; existing artwork
is protected by an assertion. For example, the next full pass can be generated
with:

```powershell
Start-Process -FilePath 'C:\Users\bondl\aseprite\build-v1444\bin\aseprite.exe' -ArgumentList @('--batch','--script-param','stage=5','--script-param','revision=003','--script','art/character/mira_192_v001/construct.lua') -WindowStyle Hidden -Wait
```

`construct.lua` defines palette constants, integer drawing helpers, the shared
face coordinate frame `F`, and local feature anchors. Eyes, nose, mouth, frames
and construction guides use the same tilted coordinates. Stage 2 exposes the
guides; all final exports keep them hidden. The exported face crop is the native
rectangle `(56, 38, 96, 92)` enlarged eight times through direct pixel replication.

The API references used for the drawing/export implementation are Aseprite's
[Sprite](https://aseprite.org/api/sprite), [Image](https://aseprite.org/api/image)
and [Layer](https://aseprite.org/api/layer) documentation.
