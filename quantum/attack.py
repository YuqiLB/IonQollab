"""Small, bounded Qiskit order-finding demo for the Qrush story.

This is an educational Shor circuit, not an RSA implementation.  It returns
the measured phase register; the browser derives and verifies the period and
factors from those measurements.
"""

from __future__ import annotations

from math import gcd, pi
from typing import Any


MAX_MODULUS = 63
MAX_PHASE_BITS = 12
MAX_TOTAL_QUBITS = 18
MAX_SHOTS = 4096
BASE = 2


def _is_prime(value: int) -> bool:
    if value < 2:
        return False
    if value % 2 == 0:
        return value == 2
    divisor = 3
    while divisor * divisor <= value:
        if value % divisor == 0:
            return False
        divisor += 2
    return True


def _validate_modulus(modulus: Any, base: Any, shots: Any) -> tuple[int, int, int, int]:
    """Return N, phase width, work width, and shots after enforcing hard caps."""
    if isinstance(modulus, bool) or not isinstance(modulus, int) or modulus < 15:
        raise ValueError("N must be an integer composite modulus of at least 15.")
    if modulus % 2 == 0 or _is_prime(modulus):
        raise ValueError("N must be an odd composite modulus formed from the player's prime choices.")
    work_bits = (modulus - 1).bit_length()
    phase_bits = 2 * work_bits
    total_qubits = work_bits + phase_bits
    if modulus > MAX_MODULUS or phase_bits > MAX_PHASE_BITS or total_qubits > MAX_TOTAL_QUBITS:
        raise ValueError(
            f"This simulator demo is capped at N ≤ {MAX_MODULUS} "
            f"({MAX_TOTAL_QUBITS} total qubits, at most {MAX_PHASE_BITS} measured phase bits)."
        )
    if isinstance(base, bool) or not isinstance(base, int) or not 2 <= base < modulus:
        raise ValueError("a must be an integer from 2 to N−1.")
    if gcd(base, modulus) != 1:
        raise ValueError("a must be coprime to N.")
    if isinstance(shots, bool) or not isinstance(shots, int) or not 1 <= shots <= MAX_SHOTS:
        raise ValueError(f"shots must be an integer from 1 to {MAX_SHOTS}.")
    return modulus, phase_bits, work_bits, shots


def _modular_multiplication_matrix(multiplier: int, modulus: int, work_bits: int):
    """Permutation matrix for |x> -> |multiplier*x mod N> on valid residues.

    Computational basis states x >= N are fixed, which completes the map to a
    permutation over the whole 2**work_bits dimensional space.
    """
    import numpy as np

    dimension = 1 << work_bits
    matrix = np.zeros((dimension, dimension), dtype=complex)
    for value in range(dimension):
        target = (multiplier * value) % modulus if value < modulus else value
        matrix[target, value] = 1.0
    return matrix


def _append_inverse_qft(circuit, register) -> None:
    """Append an inverse QFT with swaps so the measured bits are MSB first."""
    count = len(register)
    for index in range(count // 2):
        circuit.swap(register[index], register[count - index - 1])
    for target in reversed(range(count)):
        for control in reversed(range(target + 1, count)):
            circuit.cp(-pi / (2 ** (control - target)), register[control], register[target])
        circuit.h(register[target])


def build_order_finding_circuit(modulus: int, base: int = BASE):
    """Build a Qiskit order-finding circuit for public N and selected base a.

    The hard limits are checked before allocating any matrix or circuit.
    """
    _, phase_bits, work_bits, _ = _validate_modulus(modulus, base, 1)

    from qiskit import ClassicalRegister, QuantumCircuit, QuantumRegister
    from qiskit.circuit.library import UnitaryGate

    phase = QuantumRegister(phase_bits, "phase")
    work = QuantumRegister(work_bits, "work")
    measured_phase = ClassicalRegister(phase_bits, "measured_phase")
    circuit = QuantumCircuit(phase, work, measured_phase)

    # Put the phase register in superposition and the work register in |1>.
    circuit.h(phase)
    circuit.x(work[0])

    # Controlled modular multipliers implement |x>|1> -> |x>|a**x mod N>.
    for bit in range(phase_bits):
        multiplier = pow(base, 1 << bit, modulus)
        matrix = _modular_multiplication_matrix(multiplier, modulus, work_bits)
        gate = UnitaryGate(matrix, label=f"×{multiplier} mod {modulus}").control(1)
        circuit.append(gate, [phase[bit], *work])

    _append_inverse_qft(circuit, phase)
    circuit.measure(phase, measured_phase)
    return circuit


def _backend_qubit_limit(backend) -> int | None:
    """Read a backend's advertised qubit count when it exposes one."""
    count = getattr(backend, "num_qubits", None)
    if isinstance(count, int):
        return count
    target = getattr(backend, "target", None)
    count = getattr(target, "num_qubits", None)
    if isinstance(count, int):
        return count
    configuration = getattr(backend, "configuration", None)
    try:
        config = configuration() if callable(configuration) else configuration
        count = getattr(config, "n_qubits", None)
        if isinstance(count, int):
            return count
    except Exception:
        pass
    return None


def _phase_counts(result, circuit, phase_bits: int) -> dict[str, int]:
    get_counts = getattr(result, "get_counts", None)
    if not callable(get_counts):
        raise TypeError("The selected backend result does not expose Qiskit get_counts().")
    try:
        counts = get_counts(circuit)
    except TypeError:
        counts = get_counts()
    if not isinstance(counts, dict) or not counts:
        raise ValueError("The simulator returned no phase-register counts.")

    normalized: dict[str, int] = {}
    for raw_key, raw_count in counts.items():
        key = str(raw_key).replace(" ", "")
        if key.startswith("0b"):
            key = key[2:]
        elif key.startswith("0x"):
            key = format(int(key, 16), f"0{phase_bits}b")
        if not key or any(bit not in "01" for bit in key) or len(key) > phase_bits:
            raise ValueError("The simulator returned a phase outcome that is not a phase-register bitstring.")
        key = key.zfill(phase_bits)
        if isinstance(raw_count, bool) or not isinstance(raw_count, int) or raw_count < 0:
            raise ValueError("The simulator returned an invalid shot count.")
        normalized[key] = normalized.get(key, 0) + raw_count
    if sum(normalized.values()) <= 0:
        raise ValueError("The simulator returned zero measured shots.")
    return normalized


def run_attack(backend, shots=1024, modulus=15, base=BASE):
    """Run Shor order finding using the Qollab-supplied Qiskit simulator.

    The game sends only the public modulus N=p*q, never the selected factors.
    ``modulus`` and ``base`` are optional to preserve the earlier
    ``run_attack(backend, shots)`` call. Inputs are validated before a circuit is built; the
    maximum circuit is 18 qubits and 12 phase bits. This function never creates
    a provider or submits an unbounded job.
    """
    try:
        modulus, phase_bits, work_bits, shots = _validate_modulus(modulus, base, shots)
        required_qubits = phase_bits + work_bits
        available_qubits = _backend_qubit_limit(backend)
        if available_qubits is not None and available_qubits < required_qubits:
            raise ValueError(
                f"This prime pair needs {required_qubits} qubits; the selected simulator advertises "
                f"only {available_qubits}. Choose a smaller pair or a larger simulator."
            )

        from qiskit import transpile

        circuit = build_order_finding_circuit(modulus, base)
        compiled = transpile(circuit, backend=backend)
        job = backend.run(compiled, shots=shots)
        result = job.result() if callable(getattr(job, "result", None)) else job
        distribution = _phase_counts(result, compiled, phase_bits)
        return {
            "status": "success",
            "distribution": distribution,
            "distribution_kind": "counts",
            "phase_bits": phase_bits,
            "explanation": (
                f"Measured the {phase_bits}-bit phase register for a={base}, N={modulus}, "
                f"using {shots} shots. The browser will infer and verify the period and factors."
            ),
        }
    except Exception as exc:
        return {"status": "error", "explanation": str(exc) or exc.__class__.__name__}
