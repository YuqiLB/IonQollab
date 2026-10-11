# Qrush

The game uses the reference-inspired [pixel UI skin](styles/README.md). The three rejected design studies, including their screenshots and tooling, are isolated in [design-archive/three-concepts](design-archive/three-concepts/README.md). That archive is not loaded by the game and can be removed as one folder.

A playable, deterministic quantum love story for the IonQ × Qollab hackathon. Play as Bob on a late shift at the Quantum Laboratory. Meet Alice on the balcony during a walk break, then return to your desk to text her. Choose an invitation, watch Zeno recover its toy RSA ciphertext, and arrange a protected retry through an **illustrative** post-quantum exchange.

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

5. Open **[http://127.0.0.1:4173](http://127.0.0.1:4173)** in your browser. Keep the terminal open while playing. Click anywhere on the intro (or press Enter/Space) to start. The game uses **Illustrative demo** mode, which supports the complete story without executing a quantum job.

To stop the server, press **Ctrl+C** in the terminal. There is no `npm install` or build step. If `node` is not recognized, reopen your terminal after installing Node.js. If `tools/serve.mjs` cannot be found, check that your terminal is in the project root.

Do not open `index.html` directly: the JavaScript modules need an HTTP server. The included server serves local files only; it is not an application backend.

For Qollab, use **one JS / Qiskit project**. Copy the root `index.html`, `main.js`, `main.css`, plus `styles/`, `js/`, `assets/`, and `quantum/`. No JSX, npm build, Vite runtime, separate provider, API key, or hosted backend is required. Bitcount Prop Single and Handjet load from Google Fonts through `main.css`. The pre-existing `frontend/` Vite scaffold is retained but is not the game entry point. Do not include `design-archive/` in the game handoff.

## What runs

| Part | Execution |
| --- | --- |
| Conversation | Local scripted state machine; no LLM or network service |
| Typed text | Safely rendered with `textContent`; 280 UTF-16 code units; Enter sends, Shift+Enter adds a newline |
| Toy RSA | Real local UTF-8/base-N encoding, modular exponentiation, ciphertext packet, and decryption |
| Reply choices | Suggestion chips preview a scripted reply in a read-only text box; the send arrow submits the selected choice |
| Toy RSA | Real local UTF-8/base-15 encoding, modular exponentiation, ciphertext packet, and decryption |
| Illustrative quantum mode | Explicitly labeled deterministic sample measurements; **no quantum job** |
| Live Qollab mode | Runs the bounded Qiskit order-finding circuit on the simulator selected in Qollab |
| Period/factor recovery | Continued fractions from measurement phases, minimal-period verification, gcd calculations, inverse, actual packet decryption |
| Post-quantum retry | **Illustrative post-quantum exchange**; ML-KEM, KDF and authenticated encryption are diagrams, not cryptographic implementations |

Everything stays in memory. There is no persistence, account, database or real encrypted chat service. The story's machine is fictional and sufficiently powerful; today's tiny simulator demo is not a real-world RSA attack. It does not demonstrate breaking AES, a production messaging service, or every end-to-end encryption scheme.

The player can enter any distinct odd prime pair with `N=pq≤63`. The lesson chooses the smallest odd `e>1` coprime to `φ(n)=(p−1)(q−1)`; for example, `(3, 7)` gives `φ(n)=12`, so it selects `e=5` instead of incompatible `e=3`. The Shor circuit has a hard ceiling of `N≤63`, 12 measured phase bits, and 18 total qubits. The frontend sends only public `N` and the selected base to Python, never the player's `p` or `q`.

This tiny, unpadded textbook example is deliberately insecure and is trivial to attack classically. For `(3, 5)`, `φ(n)=8` and `d=e=3`, so even the public exponent decrypts. The in-game disclaimer explains that factoring is used to teach the recovery chain, not because quantum computation is needed for the toy case.

Each UTF-8 byte uses a fixed-width base-`N` encoding, including leading zeroes; the width is computed from the selected modulus. Ciphertext includes modulus, public exponent, encoding, digit width and byte count. Decryption uses only the copied packet and a private exponent derived from verified factors. No animation timer unlocks the leaked message.

## Python handoff

`backend/main.py` remains empty because Qollab injects the selected Qiskit backend directly; the game does not need a separate web server. No verified ML-KEM implementation is included.

**`quantum/attack.py` → `run_attack(backend, shots=1024, modulus=15, base=2)`** builds an order-finding circuit, submits it to the Qollab-selected simulator, and returns only measured phase-register counts. The defaults preserve the original two-argument call. The browser validates the measurements and computes the period and factors. Read [quantum/README.md](quantum/README.md) for the resource limits and integration steps.

The adapter in `js/quantum-adapter.js` converts `.toJs()` proxies and nested Maps, validates the declared counts/probabilities, and verifies the recovered period. Live failure or inconclusive measurements never silently become illustrative success. The player may explicitly switch modes after failure. Tests use synthetic bridge objects only to test the contract; they are not evidence of Qollab execution.

## Controls and accessibility

The opening balcony fills the visible viewport, with Alice in the foreground and a lavender visual-novel dialogue box along the bottom. After the walk, a centered chat window sits over Bob’s desk and wall. Puzzles open in a separate window: chat takes the left 30% of the available window space and the puzzle takes the remaining 70%. On narrow screens, compact chat sits above the puzzle. Chat history scrolls independently; every puzzle step keeps its result and navigation in view. Short screens use concise mathematical views and a smaller chat area. Longer reference explanations and raw measurements live in Details.

- Click anywhere on the introduction or press Enter/Space to start. Bob has two in-person replies; each gives Alice a different immediate response and expression. Continue at your own pace, then choose “Back to my desk.” “Skip to texting” is available throughout the balcony scene.
- The scene change lasts half a second, or is immediate with reduced motion. No dialogue advances on a timer. Alice’s supplied sprite becomes the chat contact avatar once Bob returns to his desk.
- Click anywhere in an in-person dialogue box, or press Enter/Space while it is focused, to continue. Required choices cannot be skipped by clicking the box. Double-clicks advance only one line.
- During puzzles, Alice sends a few scripted texts tied to the current phase. They do not steal focus, duplicate when going Back, or imply a computed result. Replies stay disabled until the story returns to conversation. Reading old messages still preserves your position.
- Sending an invitation leaves its bubble marked “Encrypting…” and opens the encryption window from that message. The actual text travels into the window and remains visible above the lesson. The status stays pending until the player completes the RSA sequence and releases the real packet; it is an indeterminate teaching-workflow status, not a cryptographic progress percentage.
- Zeno’s interception/recovery runs in a red modal popup. Gaussian backdrop blur gives the existing chat and encryption windows a frosted-glass appearance. Finishing recovery closes the popup with a short exit animation and returns to Alice. Reduced motion removes the movement.
- Alice's window X controls preserve progress. Reopen chat or a puzzle from the restore bar, a task attachment, or the pending invitation. Zeno has no X button and ignores Escape/backdrop dismissal; completing recovery closes his popup through the story action.
- After the final replacement invitation, select “Meet Alice.” The meeting takes place in the chosen quiet garden or east dome, with its own background and dialogue. Finish the date to reach the end screen, replay, or inspect what actually ran. The original leaked location is not reused for the new plan.
- Artwork stays crisp during the mathematics. All expressions share the same proportions; reduced-motion mode disables entrance and animated transitions.
- Prime entry explains how the two primes build the RSA key for the waiting invitation. “Toy RSA” is explicitly defined as an insecure small-number teaching example.
- Reply choices appear above the unchanged composer. Choose one to preview it, then use the send arrow; direct typing is disabled. Choices and send remain keyboard-accessible.
- Direct task headings, larger Back/Next controls, Replay animation, and Skip animation. The story returns to the preserved conversation after each sequence.
- Attack content fits without scrolling. Zeno's entrance and the circuit occupy separate beats; later steps show one result and a concise caption. Compact screens use the same computed values in readable formulas. The supplied standing, machine and fallen sprites remain unchanged.
- All in-game heart artwork uses the website favicon, `assets/heart.svg`. Rendered text hearts keep their original text content and encrypted bytes.
- Reduced-motion support reveals the same mathematical states without movement.
- Reading old messages disables automatic following; a New messages button returns to the latest.
- Job states are separate from story state: `idle`, `submitting`, `waiting`, `success`, `inconclusive`, `error`.
- Restart invalidates asynchronous callbacks and ignores old results. It does **not** cancel remote jobs.
- Keyboard focus styles, labeled inputs, live dialogue/status messages, semantic message log, accessible mathematical SVG descriptions, and layouts for narrow and short screens.

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

The browser suite starts its own static test server on port 4175 and records screenshots in `qa/`. It checks the full desktop and mobile loop, separate 30/70 puzzle windows, locked replies, Alice’s puzzle texts, both final meeting locations and end screens, choice-only input, preview/send behavior, compact-screen controls, invalid/reversed primes, reading position, motion controls, live errors, duplicate job submissions, and stale results after restart. A test-only live bridge checks lifecycle behavior; no actual quantum job is executed by the test suite.

`node tests/opening-smoke.cjs /path/to/node_modules /path/to/chrome` additionally exercises both balcony replies, keyboard progression, reduced motion, skip, reset during the scene change, and centered desk layouts at four viewport sizes. It uses port 4176 and writes captures to `qa/scenes/`. See [scene design notes](docs/balcony-and-desk.md).

`node tests/message-windows.cjs /path/to/node_modules /path/to/chrome` checks actual invitation text in the animation, pending/sent status, Alice's close/restore controls, every RSA/attack/recovery/PQ step without scrolling, Zeno's non-dismissible modal, exact recovery for N=15 and N=33, shared heart artwork, and reset during the opening animation. It uses port 4177 and writes to `qa/windows/`. See [current verification notes](qa/VERIFICATION.md) for test results and any pre-existing failures.

## Files and provenance

- **New game:** root `index.html`, `main.js`, `main.css`, `js/`, `assets/manifest.js`, new character exports, `assets/fonts/`, `tools/serve.mjs`, `tests/`, `quantum/` contract and documentation.
- **Preserved source work:** editable artwork and its history in `art/`, Python modules, lockfiles, and ignore rules. The old runtime portrait PNGs and screenshot crops were removed from `assets/`; only the five current native portraits ship with the game.
- **Character art:** fresh 68 × 89 transparent PNG renders of the supplied `portrait_68x89_v003.aseprite` and the blushing, happy, serious, and surprised files in `art/character/expressions_68x89_v001/`. The editable files contain newer pixels than their adjacent historical PNG previews, so the game uses fresh Aseprite renders. No resizing, smoothing, recoloring, cropping or face changes are applied. `assets/manifest.js` maps all five expressions to the story. Shared canvas dimensions, `object-fit: contain`, and `image-rendering: pixelated` keep the framing consistent.

To refresh the game PNGs after editing the Aseprite source files, run `powershell -ExecutionPolicy Bypass -File tools/export-portraits.ps1` (or pass `-AsepritePath` for another installation). The helper exports the native canvas and verifies the source files remain unchanged.
- **Zeno and his machine:** native PNG exports of `art/sprites/redcoat_standing_136x178_v001/redcoat-standing_136x178.aseprite` (136 × 178), plus `machine_68x89.aseprite` and `redcoat-fallen_68x89.aseprite` in `art/sprites/redcoat_and_machine_68x89_v001/` (68 × 89). Refresh with `powershell -ExecutionPolicy Bypass -File tools/export-rival-sprites.ps1`; the helper checks PNG dimensions and verifies the editable sources remain unchanged.
- **Fonts:** the original Bitcount Prop Single and Handjet pairing is restored, imported from Google Fonts in `main.css`. The unused local Pixelify Sans font and its [license](assets/fonts/OFL.txt) are retained. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
- The balcony, desk, garden and dome backgrounds in `assets/scenes/` are local code-native SVG pixel artwork. Opening dialogue lives in `js/opening.js`; date locations, ending dialogue and puzzle texts in `js/story-scenes.js`. Scene layout is grouped in `styles/story-scenes.css`, with the split puzzle workspace in `styles/puzzle-window.css`. Character sprites use the supplied artwork. No generated equation images, new runtime packages, or flattened UI screenshots.

Scientific references: [IBM's Shor tutorial](https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm) and [NIST FIPS 203, ML-KEM](https://csrc.nist.gov/pubs/fips/203/final). The latter describes key establishment: the shared secret is used with symmetric algorithms; ML-KEM does not encrypt the chat text directly. A real protocol must authenticate the public key. Homomorphic encryption is a separate concept.
