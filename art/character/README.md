# Mira — neutral portrait

Original adult quantum-computing researcher character, drawn with integer
pixel primitives directly on a 128 × 192 indexed Aseprite canvas. Six editable
layers, 24 opaque palette colors plus transparency, and one neutral frame.
The turquoise hair clip depicts a Bloch sphere and state vector. The shirt
has a small ket motif. No generated images or external artwork are used.

The delivered canonical files contain revision v002. Both v001 and v002,
including their generating Lua sources, are retained. Native and exact 4×
exports were visually inspected before and after refinement.

Run from the repository root in PowerShell:

```powershell
& "C:\Users\bondl\aseprite\build-v1444\bin\aseprite.exe" --batch --script "art/character/create_character.lua"
```

Every run writes the next unused `-vNNN` source, sprite, PNG, preview, and
validation report. Existing canonical files are left untouched to preserve
manual edits. Edit the canonical `.aseprite` freely; subsequent scripted
revisions are separate files. Drawing parameters are integer coordinates
in the six named layer sections of `create_character.lua`.

`test_lua.lua` and its 4×4 outputs record the executable/Lua smoke test.
`verify_character.lua` checks saved v002 layers, palette, render equality,
binary alpha, and nearest-neighbour preview pixels. Results: `qa-v002.txt`.
No expression variants have been made; awaiting visual feedback.

API references: [Sprite](https://aseprite.org/api/sprite),
[Image](https://aseprite.org/api/image), [Palette](https://aseprite.org/api/palette).
