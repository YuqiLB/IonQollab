# Qrush

A playable, deterministic quantum love story for the IonQ × Qollab hackathon. Start in a late-night observatory chat with Mira, write a real invitation, watch a rival recover its toy RSA ciphertext, and arrange a protected retry through an **illustrative** post-quantum exchange.

## Run the game

From the repository root, with Node 22 or newer:

```sh
node tools/serve.mjs
```

Open **http://127.0.0.1:4173**. There is no install or build step. This is a development-only static file server, not an application backend. Any static HTTP server works. ES modules require HTTP; do not double-click `index.html` as a `file://` URL.

For Qollab, use **one JS / Qiskit project**. Copy the root `index.html`, `main.js`, `main.css`, plus `js/`, `assets/`, and `quantum/`. No JSX, npm build, Vite runtime, external font request, separate provider, API key, or hosted backend is required. The pre-existing `frontend/` Vite scaffold is retained but is not the game entry point.

## What runs

| Part | Execution |
| --- | --- |
| Conversation | Local scripted state machine; no LLM or network service |
| Typed text | Safely rendered with `textContent`; 280 UTF-16 code units; Enter sends, Shift+Enter adds a newline |
| Toy RSA | Real local UTF-8/base-15 encoding, modular exponentiation, ciphertext packet, and decryption |
| Illustrative quantum mode | Explicitly labeled deterministic sample measurements; **no quantum job** |
| Live Qollab mode | Calls a configured Python proxy with Qollab's supplied backend; disconnected until teammates connect it |
| Period/factor recovery | Continued fractions from measurement phases, minimal-period verification, gcd calculations, inverse, actual packet decryption |
| Post-quantum retry | **Illustrative post-quantum exchange**; ML-KEM, KDF and authenticated encryption are diagrams, not cryptographic implementations |

Everything stays in memory. There is no persistence, account, database or real encrypted chat service. The story's machine is fictional and sufficiently powerful; today's tiny simulator demo is not a real-world RSA attack. It does not demonstrate breaking AES, a production messaging service, or every end-to-end encryption scheme.

Toy parameters are restricted to `p=3, q=5` or the reverse, `n=15`, `φ(n)=8`, `e=3`, `d=3`. This tiny, unpadded textbook example is trivial to attack classically. In particular, **e=d** means its public exponent also decrypts; we use factoring to teach the recovery chain, not because quantum computation is needed for 15.

Every UTF-8 byte uses exactly **three** base-15 digits, including leading zeroes: `byte = a×225 + b×15 + c`. Ciphertext includes modulus, public exponent, encoding, digit width and byte count. Decryption uses only the copied packet and a private exponent derived from verified factors. No animation timer unlocks the leaked message.

## Python handoff

The inspected `backend/main.py` and `backend/requirements.txt` were empty and remain unchanged. No pre-existing quantum function or verified ML-KEM implementation was available. This delivery does not claim to include either.

The team should implement **`quantum/attack.py` → `run_attack(backend, shots)`**, or adapt its own existing function to the interface described in [quantum/README.md](quantum/README.md). Add the three Qollab-only connection lines in [quantum/connect.example.js.txt](quantum/connect.example.js.txt) to `main.js` once the real function exists. The user selects a simulator through Qollab's **Select QPU** dialog. Keep that backend; do not add credentials or a provider connection.

The adapter in `js/quantum-adapter.js` converts `.toJs()` proxies and nested Maps, validates the declared counts/probabilities, and verifies the recovered period. Live failure or inconclusive measurements never silently become illustrative success. The player may explicitly switch modes after failure. Tests use synthetic bridge objects only to test the contract; they are not evidence of Qollab execution.

## Controls and accessibility

The observatory fills the visible viewport, including on mobile. Mira and the transparent dialogue share a single panoramic background. There is no outer header, footer, reset button or page scrolling; conversation history and long mathematics remain scrollable inside the scene. Execution settings appear within the attack sequence, and replay remains available at the ending.

- Editable suggested replies, typed messages, clear validation, and a visible character count.
- Back, Next, Replay animation, Skip animation, and return to the full conversation.
- Reduced-motion support reveals the same mathematical states without movement.
- Reading old messages disables automatic following; a New messages button returns to the latest.
- Job states are separate from story state: `idle`, `submitting`, `waiting`, `success`, `inconclusive`, `error`.
- Restart invalidates asynchronous callbacks and ignores old results. It does **not** cancel remote jobs.
- Keyboard focus styles, labeled inputs, live status messages, semantic message log, accessible SVG descriptions, and mobile stacking.

## Validation

```sh
node --test tests/math.test.mjs
```

Optional browser suite (requires a developer installation of Playwright and Chrome; neither is needed to play):

```sh
node tests/ui-smoke.cjs
# Or point at an existing node_modules directory containing Playwright:
node tests/ui-smoke.cjs /path/to/node_modules /path/to/chrome
```

The browser suite starts its own static test server on port 4175 and records screenshots in `qa/`. It checks the full desktop and mobile loop, maximum-length Unicode, safe rendering, invalid/reversed primes, reading position, motion controls, live errors, duplicate job submissions, and stale results after restart. A test-only live bridge checks lifecycle behavior; no actual quantum job is executed by the test suite.

## Files and provenance

- **New game:** root `index.html`, `main.js`, `main.css`, `js/`, `assets/manifest.js`, new character exports, `assets/fonts/`, `tools/serve.mjs`, `tests/`, `quantum/` contract and documentation.
- **Preserved existing work:** `frontend/`, `backend/`, original `art/`, earlier `assets/character/`, package lockfiles and ignore rules. No teammate Python module was overwritten.
- **Character art:** the user's extensionless `QRush asset` is copied byte-for-byte as `assets/characters/mira-idle.png`. The user later supplied a screenshot with flustered and happy expressions. Both original rectangular crops are retained as `*-source-crop.png`; display copies remove only the surrounding screenshot background. Character RGB colors are unchanged, with no resampling, regenerated faces or warping. A central manifest maps expressions; the missing thinking expression uses idle. Portraits use `object-fit: contain` and a fixed frame.
- **Font:** locally hosted Pixelify Sans, Google Fonts, SIL Open Font License. See [assets/fonts/OFL.txt](assets/fonts/OFL.txt) and [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
- All diagrams, observatory scenery and rival avatar are code-native SVG/CSS. No generated equation images or external runtime dependencies.

Scientific references: [IBM's Shor tutorial](https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm) and [NIST FIPS 203, ML-KEM](https://csrc.nist.gov/pubs/fips/203/final). The latter describes key establishment: the shared secret is used with symmetric algorithms; ML-KEM does not encrypt the chat text directly. A real protocol must authenticate the public key. Homomorphic encryption is a separate concept.
