# Quantum team integration contract — not an implemented quantum module

No quantum Python implementation existed at inspection time. Existing `backend/main.py` and `backend/requirements.txt` were empty and are untouched. This directory reserves the correct location for Qollab Python modules; no stub is disguised as working quantum code.

## Required callable

Implement `quantum/attack.py` with:

```python
def run_attack(backend, shots):
    # Real implementation belongs here, supplied by the quantum team.
    # N=15, a=2; run the order-finding circuit on the supplied simulator.
    # Return the dictionary described below, built from actual measurements.
```

This is a signature example, **not executable code shipped as the integration**. If the team's function has another name/signature, adapt the JavaScript call in `js/quantum-adapter.js` to match the real implementation. The current proposed call is exactly:

```javascript
const raw = await runAttack.callPromising(backend, 1024);
```

Qollab supplies `backend`; use **Select QPU** to choose a simulator. Do not instantiate another provider, request API keys, or create a web server.

## Return value

Return a Python dictionary / `.toJs()`-convertible proxy with:

| Field | Meaning |
| --- | --- |
| `status` | `success`, `inconclusive`, or `error` |
| `distribution` | Actual phase-register distribution, binary keys in **most-significant-bit-first** order, all the same width, between 2 and 12 bits |
| `distribution_kind` | Exactly `counts` (nonnegative integer shots) or `probabilities` (nonnegative floats summing to approximately 1) |
| `phase_bits` | Optional integer matching the key width |
| `period` | Optional candidate period; it must pass verification |
| `factors` | Optional list `[3, 5]` or `[5, 3]`; verified if provided |
| `recovered_toy_secret` | Optional integer `d=3`; verified if provided |
| `explanation` | Human-readable status, especially for errors |

Return **only the measured phase register**, with any auxiliary-register bits removed. Preserve leading zeros and document bit ordering in the implementation. Do not send decimal outcome strings, mixed widths, quasiprobabilities with negative entries, or unexplained unlabeled values. For an error, `status='error'` and an explanation suffice. For an inconclusive measurement result, include the actual distribution.

The frontend derives a candidate from continued-fraction convergents of `y/2^t`, checks that `2^r mod 15 = 1`, checks no smaller positive period works, requires an even useful period, and verifies both gcd factors. Zero/half-phase-only outcomes can be inconclusive; the frontend deliberately does not brute-force a missing period into success. A reported `period=4` without supporting phase data does not unlock the story.

Map/dictionary conversion is recursive. Unknown status/kind, malformed distributions, invalid periods or contradictory factors become visible errors. The frontend never replaces live errors with samples. Retries submit a new call; restart only invalidates old frontend results and does not cancel remote work.

The frontend's compact circuit is explicitly labeled an **order-finding schematic**. It abbreviates control wires and the work register and is not a rendering of your actual transpiled circuit. The deterministic four-bit demo distribution (`0000`, `0100`, `1000`, `1100`, 256 each) is marked as sample data; it is never claimed to have come from Python.

## Connect it

After the real function exists, add the lines from `connect.example.js.txt` to root `main.js` in the same Qollab JS / Qiskit project. A native browser cannot resolve Qollab's Python import; therefore that static import is intentionally absent from the standalone build until connection.

Verify one real job inside Qollab, inspecting `raw.toJs()` to confirm the exact shape and phase register order before presenting the integration as live. The JS tests use mock proxies to validate conversions and UI lifecycle, **not** to certify a Qollab job.

No ML-KEM implementation is required for the current complete story: the protected retry is explicitly illustrative. Replacing it with real cryptography is separate work requiring a verified implementation and authenticated key exchange, not a homemade cipher or a factoring-job timeout.
