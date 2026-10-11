import { factorsFromPeriod, periodFromDistribution, gcd, modPow, isPrime } from './rsa.js';

let bridge = null;
const lessonBases = new Map([[15, 2], [33, 5], [51, 2], [55, 2]]);
export function lessonBase(modulus) { return lessonBases.get(modulus) || 2; }
// Qollab glue calls this with the supplied backend and actual Python proxy.
export function configureQollab({ runAttack, backend }) {
  if (!runAttack || typeof runAttack.callPromising !== 'function' || backend == null) throw new Error('Pass the Python run_attack proxy and Qollab-supplied backend.');
  bridge = { runAttack, backend };
}
export function liveAvailable() { return bridge !== null; }
export function normalize(value, depth = 0) {
  if (depth > 16) throw new Error('Quantum result is nested too deeply.');
  if (value && typeof value.toJs === 'function') return normalize(value.toJs(), depth + 1);
  if (value instanceof Map) return Object.fromEntries([...value].map(([k, v]) => [String(k), normalize(v, depth + 1)]));
  if (Array.isArray(value)) return value.map(v => normalize(v, depth + 1));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(v, depth + 1)]));
  return value;
}
export function validateResult(raw, { modulus = 15, base = lessonBase(modulus) } = {}) {
  if (!Number.isSafeInteger(modulus) || modulus < 15 || modulus > 63 || modulus % 2 === 0 || isPrime(modulus)) throw new Error('The public modulus exceeds the simulator lesson limits.');
  if (!Number.isSafeInteger(base) || base < 2 || base >= modulus || gcd(base, modulus) !== 1) throw new Error('The order-finding base is invalid for the selected modulus.');
  const result = normalize(raw);
  if (!result || !['success', 'inconclusive', 'error'].includes(result.status)) throw new Error('Python result needs status: success, inconclusive, or error.');
  if (result.status === 'error') throw new Error(String(result.explanation || 'The quantum job returned an error.'));
  if (!['counts', 'probabilities'].includes(result.distribution_kind)) throw new Error('Python must label distribution_kind as counts or probabilities.');
  const dist = result.distribution;
  if (!dist || Array.isArray(dist) || typeof dist !== 'object' || !Object.keys(dist).length) throw new Error('Python returned no measurement distribution.');
  const keys = Object.keys(dist), bits = keys[0].length;
  if (bits < 2 || bits > 12 || keys.some(k => !/^[01]+$/.test(k) || k.length !== bits)) throw new Error('Return equal-width binary phase-register keys in most-significant-bit-first order (2–12 bits).');
  const values = Object.values(dist);
  if (values.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 0 || (result.distribution_kind === 'counts' && !Number.isInteger(v)))) throw new Error('The measurement values do not match their declared kind.');
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0 || (result.distribution_kind === 'probabilities' && Math.abs(total - 1) > 0.02)) throw new Error('Invalid measurement total. Probabilities must sum to approximately one.');
  if (result.phase_bits != null && result.phase_bits !== bits) throw new Error('phase_bits does not match the measurement keys.');
  const period = periodFromDistribution(dist, bits, modulus, base);
  if (result.period != null && (!Number.isInteger(result.period) || !factorsFromPeriod(result.period, modulus, base))) throw new Error('The returned period fails classical verification.');
  if (result.period != null && period != null && result.period !== period) throw new Error('The returned period conflicts with the measurements.');
  const factors = period ? factorsFromPeriod(period, modulus, base) : null;
  if (result.factors != null && (!Array.isArray(result.factors) || result.factors.length !== 2 || !result.factors.every(isPrime) || result.factors[0] * result.factors[1] !== modulus)) throw new Error('The returned factors do not factor the public modulus.');
  return { ...result, distribution: dist, phase_bits: bits, total, base, modulus,
    status: result.status === 'inconclusive' || !factors ? 'inconclusive' : 'success', period, factors };
}
function illustrativeCounts(modulus, base, shots = 1024) {
  let period = 1;
  while (period <= modulus && modPow(base, period, modulus) !== 1) period++;
  if (period > modulus) throw new Error('Could not find the illustrative modular period.');
  const bits = 2 * Math.ceil(Math.log2(modulus));
  const scale = 2 ** bits;
  const useful = Array.from({ length: period - 1 }, (_, i) => i + 1).filter(k => gcd(k, period) === 1);
  if (!useful.length) throw new Error('Could not create an illustrative phase sample.');
  const distribution = {};
  useful.forEach((k, index) => {
    const y = Math.round(k * scale / period) % scale;
    const key = y.toString(2).padStart(bits, '0');
    distribution[key] = Math.floor(shots / useful.length) + (index < shots % useful.length ? 1 : 0);
  });
  return { status: 'success', distribution, distribution_kind: 'counts', phase_bits: bits,
    explanation: 'Deterministic representative phase peaks; no quantum job executed.' };
}
export async function runAttack({ mode, modulus = 15, base = lessonBase(modulus), onStatus = () => {} }) {
  onStatus('submitting');
  if (mode === 'demo') {
    onStatus('waiting');
    await new Promise(resolve => setTimeout(resolve, 800));
    return { ...validateResult(illustrativeCounts(modulus, base), { modulus, base }), source: 'sample' };
  }
  if (!bridge) throw new Error('Live Qollab is not connected. The Python team must supply quantum.attack.run_attack and configure the adapter. Select a simulator in Qollab’s Select QPU dialog after connecting it.');
  const { runAttack: fn, backend } = bridge;
  const promise = modulus === 15 && base === 2 ? fn.callPromising(backend, 1024) : fn.callPromising(backend, 1024, modulus, base);
  onStatus('waiting');
  const raw = await promise;
  try { return { ...validateResult(raw, { modulus, base }), source: 'live' }; }
  finally { if (raw && typeof raw.destroy === 'function') raw.destroy(); }
}
