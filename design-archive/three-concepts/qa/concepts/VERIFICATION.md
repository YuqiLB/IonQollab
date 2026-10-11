# Concept preview verification — 2026-10-11

All three concepts were exercised in headless Chrome 155.0.8059.39 against the running local root server. The interactive browser tool could not start because the Windows sandbox helper reported `setup refresh had errors`; headless Chrome was run with explicit tool approval instead.

## Passed

- Desktop 1440×900, phone 390×844, compact phone 320×568, short landscape 844×390.
- Every concept: ready invitation → real local encryption → player-paced send → anticipation → intrusion → settled recovery → replay.
- The full computed and intercepted packets equal the existing RSA module's result, including the UTF-8 heart: 51 bytes, 153 ciphertext blocks.
- Skip finishes only the active transition. Replay during encryption or sending cancels old callbacks. Switching concepts during either transition leaves the new scene intact.
- Enter/Space activation, visible keyboard focus, dialog dismissal with Escape, and reduced-motion mode. Reduced motion reaches the same states without animation.
- Asset loading, native aspect ratios, pixelated rendering, no horizontal page overflow, no clipped message text, and primary controls clear of the footer at all four sizes.
- No browser JavaScript errors or failed asset requests.
- All 11 existing mathematical/quantum-adapter tests pass.
- `git diff --check` passes. The existing modified fallen-Zeno Aseprite file remains untouched. Production JS, CSS, HTML, cryptographic modules, and backend files have no changes.

Desktop and 390px screenshots were visually inspected in ready and intercepted states. Corrections made after inspection: move handheld Zeno clear of dialogue, separate the moon from the wordmark, prevent entrance animation from restarting after an intrusion, give the copied-packet label visible room, retain machine framing, and separate the terminal ciphertext from Zeno on mobile. Narrow layouts intentionally scroll vertically to preserve readable text and artwork proportions; there is no fixed-height clipping.

## Reproduce

Start `node tools/serve.mjs`, then run:

```sh
node tests/concepts-smoke.cjs /path/to/node_modules
node --test tests/math.test.mjs
```

The first command needs an existing developer Playwright installation and Chrome. On this Windows machine, the supplied module path was `C:/Users/bondl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`. No dependency is added to the game. An optional third argument selects another base URL. Structured results are in `browser-results.json`.

## Captures

Each direction has `*-desktop-ready.png`, `*-desktop-intercepted.png`, `*-mobile-ready.png`, and `*-mobile-intercepted.png`. `before-*` captures show the production UI before this work. All captures are actual browser output, not mockups.

## Limits

No physical touch device, Safari, Firefox, screen reader, live Qollab job, quantum hardware, ML-KEM implementation, or authenticated-encryption implementation was tested. The preview intentionally stops at packet copying. The existing complete production story was inspected through its first interception; its full browser regression suite was not rerun because production files were unchanged.
