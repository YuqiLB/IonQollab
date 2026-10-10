# Dark-academia Mira — reviewed base portrait

The polished delivery is **v2**:

- `art/character/create_character_dark_v2.lua`
- `art/character/character_dark_v2.aseprite`
- `assets/character/neutral_dark_v2.png`
- `art/character/preview_dark_v2_4x.png`

The requested v1 paths contain the first design pass. Both passes and exact
generator snapshots are retained. The existing `character.aseprite`, its
original Lua generator, and `neutral.png` remain unchanged. Original layered
source snapshots are `character_before_dark_v1.aseprite` and
`character_before_dark_v2.aseprite`.

The supplied reference was interpreted manually as native-resolution pixel
clusters, without image import, tracing, downsampling, blur, or antialiasing.
The 128 × 192 canvas and face placement are preserved. The script opens the
actual existing `.aseprite`, reuses its six layer objects, retains 2,516
opaque source-face pixels, and adds separate blazer, glasses, and feature
layers. The nine resulting layers remain editable. The palette has 24 opaque
colors plus transparency; the background has no glow.

Run the refined generator from the repository root:

```powershell
& "C:\Users\bondl\aseprite\build-v1444\bin\aseprite.exe" --batch --script "art/character/create_character_dark_v2.lua"
```

Reruns use the next unused `dark_vN` output names and preserve the input and
previous portraits. Each rerun also saves the exact generating script in
`generator_dark_vN.lua`. Avoid renaming the generator before running it:
the snapshot source path is explicit near the end of the script.

Both native and 4× exports were visually reviewed against the reference.
The second pass reduces the nose to a compact three-pixel-high shadow below
the bridge, tones down the smile, and reduces large black-top highlights.
The glasses bridge, nose, mouth and chin anchors are documented in the Lua
script for later expression work. The hairstyle, plum lapels, turquoise eyes,
silver jewelry, and orbit accessories carry the reference design at this scale.

Run `verify_character_dark_v2.lua` through the same Aseprite command to check
the saved file's dimensions, layers, palette, alpha, PNG render equality,
and exact nearest-neighbour preview. Results are in `qa_dark_v2.txt`.

Only one neutral base expression has been produced. Expression variants and
animation await visual feedback.
