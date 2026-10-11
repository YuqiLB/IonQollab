# Qrush verification

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
- Existing Python files remain empty and unchanged.

Screenshots in this directory document the tested scene, RSA stages, measurements, post-quantum exchange, and endings. Finite animations were completed for screenshots.

These checks do not constitute live Qollab verification. Python-call tests use explicit test fixtures. No quantum hardware, real simulator job, ML-KEM implementation, or authenticated-encryption implementation ran. The game labels those boundaries.
