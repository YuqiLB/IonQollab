# Balcony → desk opening

Visual thesis: a quiet, full-screen night balcony gives Alice the frame; after the walk break, a single lavender chat window becomes the focal point against Bob’s desk and wall. The supplied references guide composition, not baked-in UI screenshots.

Content plan: meet Alice outside → choose Bob’s reply → see a matching reaction → agree to keep talking → return to the desk → continue the existing invitation, RSA interception and illustrative post-quantum story.

Interaction thesis: player-paced visual-novel dialogue, one small branching response, then a brief scene cut initiated by “Back to my desk.” No timed reading, typewriter lockout or ambient motion. Keyboard controls are native buttons. Reduced motion removes the entrance and scene fade. A skip control goes straight to texting.

Implementation is grouped in `js/opening.js` (dialogue), `styles/story-scenes.css` (scene composition), and `assets/scenes/` (local, code-native pixel scenery). `main.js` owns the guarded BALCONY → RETURN → INTRO transitions and reset behavior. Original Bitcount Prop Single / Handjet fonts and unmodified character PNGs are reused. No new dependencies or audio.

The balcony choice changes Alice’s immediate reply and expression only. It is not a relationship score or a cryptographic choice. Scenery is SVG artwork; the references are not shipped as flattened interface images. No computation is simulated by the new opening. Existing real toy-RSA behavior and labeled quantum / post-quantum illustrations remain intact.

## In-person ending and puzzle workspace

Visual thesis: keep Alice present while the player works, then return to an intimate full-screen scene for the date. Chat becomes a compact left window (30% of the available window space), alongside the larger puzzle window. Narrow screens use a compact chat row above the puzzle.

Content plan: click anywhere on spoken dialogue to continue → retain real reply choices → keep chat readable during puzzles, with responses locked → follow the final invitation to its actual setting (quiet garden or east dome) → conclude the in-person meeting → show an end screen with replay.

Interaction thesis: the puzzle window enters when needed; a few phase-specific Alice messages arrive without taking focus; the final meeting reuses the player-paced dialogue surface. All motion respects reduced motion. Timers are canceled on phase change/reset and returning to old puzzle steps does not duplicate messages. Final location follows the replacement invitation because the original plan was leaked.

## An invitation opens its own encryption window

Visual thesis: the pending message is the source of the encryption workspace; Zeno interrupts that same workspace with a forceful red modal window over a frosted background.

Content plan: send an invitation → show “Encrypting…” on the actual unsent message → open its encryption window from that bubble → complete the RSA lesson and release the real packet → Zeno’s popup copies and recovers it → close the popup and return to Alice. The actual invitation remains visible above the puzzle steps.

Interaction thesis: short anticipation on Send, a window growing from the message with its text traveling into the window, then a red popup entrance and closing motion. Reduced motion replaces these with immediate state changes. Loading is an indeterminate teaching-workflow status, not a fake cryptographic progress percentage. Alice's X controls preserve progress. Zeno cannot be dismissed with X, Escape or backdrop clicks; his story action closes the window after recovery. Compact puzzle views retain readable results and visible navigation without scrolling; longer explanations are optional in Details.
