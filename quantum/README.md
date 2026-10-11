# Shor demo and Qollab integration

`attack.py` contains the bounded Qiskit order-finding circuit used for the live Shor lesson. It accepts the **public modulus** and returns actual measured phase-register counts. The browser derives the candidate period and verifies the factors from those measurements.

The player's prime fields are validated in the game. Any distinct odd prime pair with `N = p × q ≤ 63` is supported. The game selects the smallest odd `e > 1` coprime to `φ(n) = (p−1)(q−1)`, so the exponent is compatible with the selected primes. The Python function receives the public modulus `N`, not `p` and `q`; sending the factors to the attacker would give away the answer.

## Qiskit function

```python
def run_attack(backend, shots=1024, modulus=15, base=2):
    ...
```

The two optional inputs preserve the original Qollab call `run_attack(backend, 1024)` for the `N=15, a=2` case. The JavaScript adapter passes `modulus` and `base` for other presets. `backend` is the simulator selected in Qollab's **Select QPU** dialog; this module does not create a provider, ask for credentials, or start an HTTP service.

### Resource bounds

- `N` must be an odd composite from 15 through 63.
- `a` must be an integer in `[2, N−1]` and coprime to `N`.
- `shots` must be from 1 through 4,096.
- The phase register uses `2 × ceil(log₂ N)` bits; the work register uses `ceil(log₂ N)` bits. The maximum is 12 phase bits and 18 total qubits.
- If the selected simulator advertises fewer qubits than the circuit needs, the function returns an error before submitting a job.
- For the default `p=3, q=5` lesson (`N=15`), choose a shot-based Qiskit backend with at least 12 qubits. The largest supported inputs need up to 18 qubits. The backend must support `transpile(circuit, backend=backend)`, `backend.run(..., shots=...)`, and result `get_counts()`; a Qiskit Aer `AerSimulator`/QASM simulator is the recommended match.

These limits protect the demo from unexpectedly large inputs. The actual Qollab simulator still determines whether a particular circuit can run; test the live connection in Qollab before describing it as live.

The circuit uses controlled modular multipliers for `a^(2^j) mod N`, applies the inverse QFT, and measures only the phase register. Counts are returned as equal-width, most-significant-bit-first binary strings. The frontend checks the continued-fraction candidate, verifies the order, then checks both gcd factors. Inconclusive measurements remain inconclusive; there is no sample fallback in live mode.

Example result:

```python
{
    "status": "success",
    "distribution": {"01000000": 512, "11000000": 512},
    "distribution_kind": "counts",
    "phase_bits": 8,
    "explanation": "Measured the phase register; the browser verifies the order and factors."
}
```

This N=15, a=2 result illustrates exact ideal-simulator peaks. Live results must come from the selected simulator; they may be noisy or inconclusive.

## Connect in Qollab

Use the Qollab entry page `index.qollab.html`, which loads the root `qollab-main.js`. That bootstrap imports `quantum.attack`, connects its `run_attack` proxy to the Qollab-injected `backend`, then loads `main.js`. Select a compatible shot-based simulator in Qollab before starting the project, then choose **Live Qollab** in the game. The normal `index.html` remains the local illustrative preview and does not import Qollab's Python module. The browser's illustrative mode remains separate from live execution. Verify an actual Qollab simulator run and inspect the returned `.toJs()` value before presenting a live run as successful.

The circuit teaches Shor's order-finding idea on tiny inputs. It does not demonstrate breaking modern RSA. The toy RSA stage remains deliberately insecure and is explained by the game's disclaimer.
