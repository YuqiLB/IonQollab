# Exact supplied portrait

`portrait_exact_v001.png` reproduces the supplied 683 × 891 bitmap pixel for
pixel. The exact matching bitmap was recovered from the current clipboard and
visually compared with the user's inline attachment before import.

`portrait_exact_v001.aseprite` contains two editable RGB layers: the reference
background and the original character pixels. Its visible composite matches
the input exactly. No pixels were redrawn, resized, rotated, quantized, or
filtered. The user's latest request for a 1:1 copy supersedes the previous
192 × 256 canvas and limited-palette interpretation.

Files:

- `clipboard_reference.png`: preserved input bitmap.
- `portrait_exact_v001.png`: exact visible reproduction.
- `portrait_exact_v001.aseprite`: editable character/background layers.
- `portrait_exact_v001.lua`: exact import script snapshot.
- `portrait_exact_v001_transparent.png`: optional working cutout; only flat
  connected background pixels are removed, with original edge colors retained.
- `import_report.txt`, `verify_exact.lua`, `qa_exact.txt`: pixel verification.

Earlier character assets and the frontend are unchanged. The default Aseprite
view retains the reference's gray background; hide its background layer to work
with the cutout. This is a direct pixel import, not a newly hand-drawn portrait.
