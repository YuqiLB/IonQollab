# Assets and existing work

- **Current Mira portraits:** user-supplied editable artwork. Neutral uses `art/character/native_68x89_v001/portrait_68x89_v003.aseprite`; blushing, happy, serious, and surprised use the named files in `art/character/expressions_68x89_v001/`. All game PNGs are freshly rendered at the native **68 × 89** resolution into `assets/characters/`. No resizing, smoothing, face edits, recoloring or background manipulation is performed during this export.
- The editable files contain newer artwork than adjacent historical PNG previews. Fresh source renders are authoritative. Source and export hashes are recorded in `qa/portrait-exports.json`.
- The previous game portraits, screenshot crops and unused neutral exports have been removed from the runtime assets. Original creative sources and their history remain under `art/`; see the source folders' README files for their original screenshot and conversion provenance. Artwork retains its existing ownership; this project does not assert an additional artwork license.
- Pixelify Sans: Copyright 2021 The Pixelify Sans Project Authors. Distributed under the SIL Open Font License, Version 1.1, reproduced in `assets/fonts/OFL.txt`. Original source: https://github.com/google/fonts/tree/main/ofl/pixelifysans . The font is hosted locally; no Google Fonts runtime connection.
- Existing Python modules, package lockfiles and ignore rules are unchanged by this portrait update. No changes to teammates' frontend work are part of this asset replacement.
- Observatory scene, heart icon, quantum/RSA diagrams, and rival avatar are code-native SVG/CSS artwork made for Qrush.

No repository-wide license file was present during the initial game implementation. This change does not invent a license for pre-existing work or supersede upstream obligations.
