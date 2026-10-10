# Qrush verification

- 11 Node mathematical/adapter tests passed.
- Automated desktop and 390px mobile full playthroughs passed in Chrome.
- Unicode invitations (including 140 emoji), leading zeroes, safe HTML-like text, invalid and reversed primes verified.
- Skip/Replay animation, Back, returning to conversation, reduced motion, and restart verified.
- Deliberate reading position preserved. Automatic following survives composer resizing.
- Disconnected live mode remains an error; explicitly switching to samples is required.
- Duplicate submissions blocked; a synthetic late live result after restart is ignored. No remote cancellation is claimed.
- Zero browser page errors in the full suite.
- Full-screen revision: complete desktop (1440×1000) and mobile (390×844) playthroughs passed.
- Mobile assertions verify no outer horizontal or vertical overflow and a composer contained within the viewport.
- Desktop and mobile screenshots visually confirm the shared observatory, transparent dialogue, and removal of the website header, footer and reset button.
- Supplied idle PNG is SHA-256 identical to the original; expression RGB values match their source crops exactly.
- Existing Python files remain empty and unchanged.

Screenshots in this directory document the tested scene, RSA stages, measurements, post-quantum exchange, and endings. Finite animations were completed for screenshots.

These checks do not constitute live Qollab verification. Python-call tests use explicit test fixtures. No quantum hardware, real simulator job, ML-KEM implementation, or authenticated-encryption implementation ran. The game labels those boundaries.
