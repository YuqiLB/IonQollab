# Qrush

A playable, deterministic quantum love story for the IonQ × Qollab hackathon. Start in a late-night observatory chat with Mira, choose an invitation, watch a rival recover its toy RSA ciphertext, and arrange a protected retry through an **illustrative** post-quantum exchange.

## Download and run

You need **Node.js 22 or newer** and a web browser. No Python setup, API keys, or quantum account is needed to play the illustrative demo.

1. Install [Node.js](https://nodejs.org/en/download), then open a new terminal (PowerShell on Windows). Run `node --version` to confirm it is installed.
2. Download this project from [GitHub](https://github.com/YuqiLB/IonQollab): select **Code → Download ZIP**, then extract the ZIP. Alternatively, if you have Git installed, run:

   ```sh
   git clone https://github.com/YuqiLB/IonQollab.git
   cd IonQollab
   ```

3. Open a terminal in the downloaded project folder—the one containing `index.html`, `main.js`, and `tools/`. For the ZIP download on Windows, open the extracted folder in File Explorer, right-click an empty area, and choose **Open in Terminal**. Use the project root, not the `frontend/` folder.
4. Start the game server:

   ```sh
   node tools/serve.mjs
   ```

5. Open **[http://127.0.0.1:4173](http://127.0.0.1:4173)** in your browser. Keep the terminal open while playing. The game starts in **Illustrative demo** mode, which supports the complete story without executing a quantum job.

To stop the server, press **Ctrl+C** in the terminal. There is no `npm install` or build step. If `node` is not recognized, reopen your terminal after installing Node.js. If `tools/serve.mjs` cannot be found, check that your terminal is in the project root.

Do not open `index.html` directly: the JavaScript modules need an HTTP server. The included server serves local files only; it is not an application backend.

For Qollab, use **one JS / Qiskit project**. Copy the root `index.html`, `main.js`, `main.css`, plus `js/`, `assets/`, and `quantum/`. No JSX, npm build, Vite runtime, separate provider, API key, or hosted backend is required. The fonts load from Google Fonts through the import in `main.css`. The pre-existing `frontend/` Vite scaffold is retained but is not the game entry point.

## What runs

| Part | Execution |
| --- | --- |
| Conversation | Local scripted state machine; no LLM or network service |
| Reply choices | Suggestion chips preview a scripted reply in a read-only text box; the send arrow submits the selected choice |
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

- Reply choices appear above the unchanged composer. Choose one to preview it, then use the send arrow; direct typing is disabled. Choices and send remain keyboard-accessible.
- Direct task headings, larger Back/Next controls, Replay animation, and Skip animation. The story returns to the preserved conversation after each sequence.
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

The browser suite starts its own static test server on port 4175 and records screenshots in `qa/`. It checks the full desktop and mobile loop, choice-only input, preview/send behavior, compact-screen controls, invalid/reversed primes, reading position, motion controls, live errors, duplicate job submissions, and stale results after restart. A test-only live bridge checks lifecycle behavior; no actual quantum job is executed by the test suite.

## Files and provenance

- **New game:** root `index.html`, `main.js`, `main.css`, `js/`, `assets/manifest.js`, new character exports, `assets/fonts/`, `tools/serve.mjs`, `tests/`, `quantum/` contract and documentation.
- **Preserved source work:** editable artwork and its history in `art/`, Python modules, lockfiles, and ignore rules. The old runtime portrait PNGs and screenshot crops were removed from `assets/`; only the five current native portraits ship with the game.
- **Character art:** fresh 68 × 89 transparent PNG renders of the supplied `portrait_68x89_v003.aseprite` and the blushing, happy, serious, and surprised files in `art/character/expressions_68x89_v001/`. The editable files contain newer pixels than their adjacent historical PNG previews, so the game uses fresh Aseprite renders. No resizing, smoothing, recoloring, cropping or face changes are applied. `assets/manifest.js` maps all five expressions to the story. Shared canvas dimensions, `object-fit: contain`, and `image-rendering: pixelated` keep the framing consistent.

To refresh the game PNGs after editing the Aseprite source files, run `powershell -ExecutionPolicy Bypass -File tools/export-portraits.ps1` (or pass `-AsepritePath` for another installation). The helper exports the native canvas and verifies the source files remain unchanged.
- **Fonts:** Bitcount Prop Single for pixel text and Handjet for other text, imported from Google Fonts in `main.css`. The unused local Pixelify Sans font and its [license](assets/fonts/OFL.txt) are retained. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
- All diagrams, observatory scenery and rival avatar are code-native SVG/CSS. No generated equation images or external runtime dependencies.

Scientific references: [IBM's Shor tutorial](https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm) and [NIST FIPS 203, ML-KEM](https://csrc.nist.gov/pubs/fips/203/final). The latter describes key establishment: the shared secret is used with symmetric algorithms; ML-KEM does not encrypt the chat text directly. A real protocol must authenticate the public key. Homomorphic encryption is a separate concept.
