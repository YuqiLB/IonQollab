# Qrush: three playable design studies

Open `http://127.0.0.1:4173/design-preview.html` after running `node tools/serve.mjs` from the repository root. Direct links: `#a`, `#b`, `#c`. The review navigation is outside the fictional game world. No dependencies or build step are added.

## Inspection and scope

The root vanilla HTML/CSS/ES-module application is the active game. The retained React/Vite scaffold is not its entry point. No AGENTS.md was found in the repository or ancestor directories. Before work, the only modified tracked file was `art/sprites/redcoat_and_machine_68x89_v001/redcoat-fallen_68x89.aseprite`; it is preserved untouched.

Current progression: opening → scripted flirting/choice preview → invitation → seven RSA teaching steps → interception/order finding → sample or live attack → five recovery steps → leaked invitation/consequence → illustrative post-quantum key exchange → fresh invitation → ending/replay. Existing agency includes reply selection, prime entry, mathematics navigation, execution-mode selection, attack retries, and replay/skip animation.

Runtime art includes Alice's idle, blushing, happy, serious, and surprised expressions on matching 68×89 transparent canvases; Zeno standing at 136×178, his machine and fallen pose at 68×89. Editable sources and older art iterations are retained. There are no supplied audio assets. These studies reuse the runtime exports without resampling, recoloring, stretching, or modifying source art. The room in A is new code-native pixel scenery.

Viewed the running current game at 1440×900 and captured chat, prime entry, and interception in `qa/concepts/before-*.png`. Three observed issues:

1. The large left portrait and small stylized text on the right overwhelm the invitation and its next action; the emotional focus is split.
2. The message disappears into a sequence of separately replaced mathematical screens. It has little visual continuity from draft to packet.
3. Zeno is contained in an explanatory box above a diagram. His arrival does not visibly take space or ownership from the private conversation.

## Art direction written before implementation

### A — Intimate handheld

Visual thesis: a warm, worn personal communicator is the intimate focal object against a quiet, pixel-built midnight room.

Content plan: device and Alice → her last line → your waiting invitation → tactile encrypt/send key; packet detail stays behind an explicit disclosure.

Interaction thesis: the text folds into its actual numeric envelope; the player chooses when to release it; Zeno steps through the device boundary and knocks its framing off balance once before it settles.

### B — Graphic confrontation

Visual thesis: an oversized Alice portrait and editorial typography form a high-contrast visual-novel poster that Zeno cuts into.

Content plan: Qrush masthead → intimate character/line → oversized invitation → compact action rail.

Interaction thesis: typography compresses into a packet; sending sweeps the packet across the composition; a hard diagonal red plane displaces Alice and Zeno occupies her space. One finite entrance and one finite impact, no idle animation.

### C — Hijacked interface

Visual thesis: a credible, quiet cream-and-ink communications desktop becomes hostile by changing the ownership of the very window you were using.

Content plan: communications title bar → Alice recipient and profile → message workspace → attached send action.

Interaction thesis: text becomes the packet in place; an observer joins the existing route; Zeno takes the conversation title and displaces the same packet into a copied-packet tray. Alice remains visibly pending, so interception is not confused with delivery.

## Shared playable slice / scientific boundary

All three use the exact existing invitation: “Meet me on the observatory rooftop at midnight? ♥”, Alice's existing line “Let’s make a plan. Where should we meet?”, and Zeno's existing line “A private invitation? Cute. Let’s see how private.” The same character exports, states, labels, and controls are used in every direction.

`Encrypt message` invokes `makeKeys(3, 5)` and `encrypt(message, keys)` from `js/rsa.js`. During the animation, each Unicode character becomes its actual per-byte RSA blocks. The heart's three UTF-8 bytes produce nine blocks. The full computed packet is inspectable. `Send to Alice` is a local scripted story trigger. It clones that packet for the fictional observer; no decrypted result is displayed and no attack result is fabricated. `Skip animation` finishes only the current transition. `Replay` resets state and invalidates all pending animation callbacks, including when switching concepts. The pause between encrypting and sending is deliberate player-controlled pacing.

There is no simulated cryptographic success, network transmission, live Qollab request, audio, persistence, or production state mutation. Only the intrusion/timing are scripted. The visible “Toy RSA · scripted interception” disclosure and “What actually runs?” dialog explain this at review time.

The production RSA implementation, `runAttack`/`configureQollab` contract, and story state machine remain untouched. Live results still require validated phase distributions and verified factors; errors do not become illustrative success. `backend/main.py` and `backend/requirements.txt` remain empty. Existing post-quantum delivery is illustrative, not implemented ML-KEM or authenticated encryption.

## Educational observations, separate from the redesign

No new scientific correction is needed for the inspected disclosures: the existing game already distinguishes homomorphic encryption from quantum resistance, labels the quantum sample data and post-quantum exchange, and places the powerful antagonist machine in a fictional future. Preserve those distinctions in any later production redesign. The toy's e = d = 3 permits public-exponent decryption and n = 15 is trivially factored classically; its factoring sequence teaches a chain of reasoning, not a need for quantum hardware. The preview stops at ciphertext copying so it does not imply a timed animation is a successful attack.

## Recommendation

Choose C for the production direction: taking over the same conversation window most directly supports private messaging → invasion → taking back control. The current state machine and shared message packet map naturally to it, with moderate layout work and little new artwork. A has the strongest tenderness, but its device frame gives long mathematical material less room. B has the strongest trailer/poster impact, but adapting every educational state to its dramatic composition requires more bespoke layout work.

Browser verification and screenshots are recorded in `qa/concepts/VERIFICATION.md` after implementation.
