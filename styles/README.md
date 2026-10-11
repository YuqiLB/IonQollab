# Production pixel UI

`pixel-ui.css` is the active reference-inspired visual layer, loaded after the existing structural `main.css`. It does not import any rejected concept code. The only new game markup is an inert decorative channel title bar. The theme-color metadata matches the new lilac palette.

Visual thesis: a lilac pixel desktop with cream speech balloons, stepped ink outlines, green primary keys and pink send/reply accents, matching the user's supplied pixel-window reference.

Content plan: preserve the current portrait and conversation → give every text message a real speech balloon → distinguish selected replies and the send button → carry the same window/balloon/control vocabulary through mathematics, interception, the protected retry, and dialogs.

Interaction thesis: short stepped message arrivals, a two-pixel button press, and existing story/diagram transitions. No new story states or mechanics. Reduced-motion preferences and the existing animation skip control remain effective.

The stylesheet groups base palette/controls, scene windows, texting, education/attack screens, introduction/dialogs, and responsive behavior. Typography uses the original Bitcount Prop Single and Handjet fonts, imported by `main.css`. Pixelify Sans was tried and then rejected because its digit 5 was difficult to read. The tiny speech-balloon SVGs are code-native borders/tails, not rasterized character art. All supplied sprites and their proportions remain intact.

`main.js`, RSA, quantum adapter, Python interfaces, educational caveats and story progression are unchanged. Browser QA uses the existing full game suite, with captures in `qa/`. The rejected concepts and their old tests/captures are under `design-archive/three-concepts/` and can be deleted independently.
