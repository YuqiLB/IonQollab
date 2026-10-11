# Shor demo and Qollab integration

`attack.py` contains the bounded Qiskit order-finding circuit used for the live Shor lesson. It accepts the **public modulus** and returns actual measured phase-register counts. The browser derives the candidate period and verifies the factors from those measurements.

The player's prime fields are validated in the game. The Python function receives `N = p × q`, not `p` and `q`; sending the factors to the attacker would give away the answer. The supported teaching pairs are `(3, 5)`, `(3, 11)`, `(3, 17)`, and `(5, 11)`. They keep the existing `e = 3` lesson arithmetic valid.

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

Add the lines in [`connect.example.js.txt`](connect.example.js.txt) to the top of the root `main.js` inside the same JS / Qiskit project. The browser's illustrative mode remains separate from live execution. Verify an actual Qollab simulator run and inspect the returned `.toJs()` value before presenting a live run as successful.

The circuit teaches Shor's order-finding idea on tiny inputs. It does not demonstrate breaking modern RSA. The toy RSA stage remains deliberately insecure and is explained by the game's disclaimer.
