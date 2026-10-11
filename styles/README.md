# Production pixel UI

`pixel-ui.css` is the shared reference-inspired visual skin, loaded after the structural `main.css`. `story-scenes.css` follows it and owns the in-person scenes, centered desk and end screen. `puzzle-window.css` owns the independent 30/70 chat/puzzle composition and its stacked phone layout. None imports rejected concept code.

`message-windows.css` is the final interaction layer: X buttons, the pending-message status, invitation context inside the puzzle, restore controls, and Zeno’s red modal with backdrop blur. `js/window-motion.js` handles short message/window motions and cancels them on reset. The animation does not decide cryptographic success or message delivery.

Visual thesis: a lilac pixel desktop with cream speech balloons, stepped ink outlines, green primary keys and pink send/reply accents, matching the user's supplied pixel-window reference.

Content plan: meet Alice in person on the balcony → return to Bob’s desk → give every text message a speech balloon → distinguish selected replies and the send button → carry the same window/balloon/control vocabulary through mathematics, interception, the protected retry, and dialogs.

Interaction thesis: player-paced balcony dialogue with two immediate reactions, a brief return to the desk, short stepped message arrivals, and a two-pixel button press. Reduced-motion preferences and existing diagram skip controls remain effective. Scene details and boundaries are documented in [balcony-and-desk.md](../docs/balcony-and-desk.md).

The stylesheet groups base palette/controls, scene windows, texting, education/attack screens, introduction/dialogs, and responsive behavior. Typography uses the original Bitcount Prop Single and Handjet fonts, imported by `main.css`. Pixelify Sans was tried and then rejected because its digit 5 was difficult to read. The tiny speech-balloon SVGs are code-native borders/tails, not rasterized character art. All supplied sprites and their proportions remain intact.

`main.js` adds BALCONY and RETURN before the texting state, then DELIVERED → MEET → END after the protected retry. Puzzle chatter is tied to phase/step and canceled on reset or phase change. RSA, quantum adapter, Python interfaces and educational caveats are unchanged. Browser QA uses the full game suite plus the opening suite, with captures in `qa/` and `qa/scenes/`. The rejected concepts and their old tests/captures are under `design-archive/three-concepts/` and can be deleted independently.
