# Qrush verification

## Pending invitation and Zeno popup — 2026-10-11

- Both invitation choices open their encryption window from the actual message. The bubble remains “Encrypting…” until the RSA lesson releases its computed packet. The invitation remains visible above the steps. Reduced motion skips the flight and window movement.
- X buttons close chat, puzzle and Zeno views while preserving progress. The restore bar reopens them. Zeno uses a native modal with a red frame, frosted backdrop (`backdrop-filter: blur(9px)`), keyboard focus containment, Escape dismissal and an exit animation. Completing recovery closes the popup and resumes the story.
- The complete desktop/mobile browser suite passes, including both date endings, disconnected live failure, explicit demo selection, duplicate live submission and stale-result rejection. Its obsolete prime-error expectations were updated to the current bounded-prime validation wording.
- `tests/message-windows.cjs` exercises 1440×900, 390×844, 320×480 and 844×390: exact text in the flight, pending/sent status, form values surviving close, all three restore controls, early dismissal without advancing the story, completed jobs surviving a closed popup, and actual decryption. N=33 (3×11) is exercised alongside N=15. Captures/results live in [windows/](windows/README.md).
- **Pre-existing math-test failure:** before UI edits, `node --test tests/math.test.mjs` passed 10/11. The malformed/contradictory-result test at `tests/math.test.mjs:50` reports “Missing expected exception”; its extra `recovered_toy_secret` field is accepted by the current adapter. This turn does not change `js/rsa.js`, `js/quantum-adapter.js`, or the math tests. Do not interpret the historical all-pass notes below as the current baseline.
- Native character PNGs, original fonts, current bounded RSA lesson, Python contracts and post-quantum caveats are preserved. No real quantum job was run. QA uses headless Chrome; physical devices, other engines and screen-reader announcements remain unverified.

## Click-through dialogue, puzzle windows and dates — 2026-10-11

- The full in-person dialogue box is a native keyboard-accessible button surface. Namebar/body clicks, Enter and Space advance; double-clicks advance one line; a required reply choice cannot be bypassed. The opening suite passes at 1440×900, 390×844, 320×480 and 844×390.
- Mathematics lives in an independent window beside the retained chat. Full-story layout checks verify a 30/70 width split on desktop and landscape, stacked windows on phones, no panel overlap, and disabled replies during every puzzle phase. Tested widths/heights include 1440×1000, 1366×768, 390×844, 320×480 and 844×390.
- Alice’s occasional scripted messages arrive while puzzles are active. They preserve reading position, do not take focus, do not repeat on Back, and are canceled on phase changes/restart. They make no claims about computed results.
- Complete desktop and mobile playthroughs now continue to the selected replacement invitation’s location. Garden and east-dome artwork/dialogue are verified, followed by the end screen. Replay resets the scene and the ending explanation dialog remains available.
- All 11 math/adapter tests pass. Real toy-RSA decryption, live-error behavior, explicit sample selection and stale live-result rejection are retained. No actual Qollab job or post-quantum computation was run.
- Visually inspected [desktop puzzle](desktop-primes.png), [phone puzzle](mobile-primes.png), [garden meeting](desktop-date-garden.png), [dome meeting](mobile-date-dome.png), and [end screen](desktop-ending.png).

QA used headless Chrome through Playwright. Physical touch devices, other browser engines and screen-reader announcement behavior remain unverified. Earlier scene-history notes follow.

## Balcony and desk — 2026-10-11

The active game now starts with a player-paced balcony conversation. Both Bob replies have distinct Alice reactions; returning to the desk opens one centered chat window. Original Bitcount Prop Single / Handjet fonts and native character exports are retained. Scenery is local SVG pixel artwork; source character images and cryptographic modules are unchanged.

- `tests/opening-smoke.cjs` passes in headless Chrome at 1440×900, 390×844, 320×480, and 844×390. It exercises both branches, keyboard progression, expression changes, skip, duplicate clicks, restart during the return transition, and reduced motion. No page errors. New captures and machine-readable results are in [scenes/](scenes/README.md).
- The complete desktop/mobile `tests/ui-smoke.cjs` suite passes: invitations, actual toy-RSA recovery, disconnected live failure, explicit sample selection, duplicate submissions, replay and stale live results. Existing stage layout assertions also pass at 1366×768 and the other tested sizes.
- All 11 mathematical / adapter tests pass. No live quantum job was executed.
- Desktop and narrow balcony/desk captures were visually inspected, along with the existing interception scene. Choices, dialogue, and composer remain reachable. Message history and mathematics retain internal scrolling. Alice keeps her native proportions.
- Native browser automation was unavailable because the Windows sandbox helper could not start; QA used headless Chrome through Playwright. Physical devices, other browser engines, and screen-reader announcement behavior remain unverified.

The sections below record earlier iterations. Current scene captures are in `qa/scenes/`; the full-story screenshots in this directory were also refreshed with the restored fonts and desk layout.

## Earlier pixel UI — 2026-10-11

The active game now uses `styles/pixel-ui.css`: local Pixelify Sans throughout, lilac window frames, stepped cream/pink speech balloons, ink outlines, and green/pink controls. The same treatment covers prime inputs, diagrams, attack status, protected retry, and the explanation dialog. All sprites remain unchanged; mathematics no longer blurs the pixel art. No story, RSA, quantum-adapter, or backend code was modified.

- Existing 11 mathematical/adapter tests pass.
- Full Chrome desktop and mobile game loops pass, including both invitations, prime validation, actual recovered text, sample/live distinction, disconnected live failure, duplicate-submission protection, and stale-result rejection.
- Existing layout checks cover 1440×1000, 1366×768, 390×844, 320×480, and 844×390. Conversation history and long mathematics scroll inside their windows; controls stay reachable without outer overflow.
- Keyboard controls, visible focus, reduced motion, replay, and animation skip pass.
- The history-preservation check now explicitly creates scrollable history before testing a reader's position; the wider desktop layout can fit all three opening messages. The New messages control has its own row so it cannot cover the reply choices.
- Desktop intro, texting, prime entry, interception, and mobile texting screenshots were visually inspected. Speech-balloon border slicing was corrected after the first render.
- The user-edited fallen-Zeno Aseprite SHA-256 remains `558EA3306877F2B3B5E53FBE54FFDCE1A56FC14C15B36CA18AAA0AAC67AE29CD`.
- Rejected A/B/C concepts, their scripts and captures are entirely under `design-archive/three-concepts/`. Production does not import that folder.

The browser checks use headless Chrome because the interactive browser and sandbox process helper could not start. Physical devices, other browser engines, screen-reader behavior, and live quantum execution remain unverified. The screenshot files regenerated by the suite below show the current skin; historical notes below describe earlier revisions.

## Earlier verification history

- 11 Node mathematical/adapter tests passed.
- Automated desktop and 390px mobile full playthroughs passed in Chrome.
- Earlier typed-input verification covered Unicode invitations (including 140 emoji), leading zeroes, and safe HTML-like text. The current game uses scripted reply choices; the reversible encoding is unchanged.
- Current browser checks cover read-only preview behavior, keyboard selection, duplicate-send prevention, both invitation choices, and invalid/reversed primes.
- Skip/Replay animation, Back, returning to conversation, reduced motion, and restart verified.
- Deliberate reading position preserved. Automatic following survives composer resizing.
- Disconnected live mode remains an error; explicitly switching to samples is required.
- Duplicate submissions blocked; a synthetic late live result after restart is ignored. No remote cancellation is claimed.
- Zero browser page errors in the full suite.
- Full-screen revision: complete desktop (1440×1000) and mobile (390×844) playthroughs passed.
- Mobile assertions verify no outer horizontal or vertical overflow and a composer contained within the viewport.
- Desktop and mobile screenshots visually confirm the shared observatory, transparent dialogue, and removal of the website header, footer and reset button.
- Portrait update: all five runtime PNGs are fresh 68 × 89 renders of the current editable Aseprite files. The adjacent historical PNGs are older artwork.
- Source/export SHA-256 values are recorded in portrait-exports.json; the current set is shown in current-portraits.png.
- Superseded runtime portraits and screenshot crops were removed; the editable art archive is retained.
- Opening revision: desktop click-anywhere and mobile keyboard start, duplicate-start guard, replay back to the menu, and delayed live-job isolation all pass.
- The intro shows only blurred scenery. Alice’s supplied portrait enters with a bounce, appears in the contact header, and recedes with blur during mathematics. Reduced motion disables entrance/idle animation.
- Intro screenshots include desktop, 390px mobile, and 320×480 compact layouts; all remain within the viewport.
- Story and diagram labels consistently use Bob, Alice, and Zeno. Original artwork filenames remain unchanged for provenance.
- Existing Python files remain empty and unchanged.
- Zeno intrusion update: all 11 mathematical/adapter tests and the full desktop/mobile browser suite pass. Layout checks cover 1440×1000, 1366×768, 390×844, 320×480, and 844×390 across the entrance, circuit, error/success states, measurements (including expanded details), and every recovery step. Stage sections and body blocks do not overlap or overflow horizontally; the tilted speech remains inside the panel and clear of the sprites.
- The supplied standing (136×178), quantum computer (68×89), and fallen (68×89) PNGs load successfully. The native export helper verifies unchanged editable sources. The fallen pose appears after the protection upgrade and clears on replay. Desktop entrance, measurements, and desktop/mobile defeat screenshots were visually inspected.

Screenshots in this directory document the tested scene, RSA stages, measurements, post-quantum exchange, and endings. Finite animations were completed for screenshots.

These checks do not constitute live Qollab verification. Python-call tests use explicit test fixtures. No quantum hardware, real simulator job, ML-KEM implementation, or authenticated-encryption implementation ran. The game labels those boundaries.
