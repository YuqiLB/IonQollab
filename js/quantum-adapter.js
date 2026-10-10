import { factorsFromPeriod, periodFromDistribution } from './rsa.js';

let bridge = null;
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
export function validateResult(raw) {
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
  const period = periodFromDistribution(dist, bits);
  if (result.period != null && (!Number.isInteger(result.period) || !factorsFromPeriod(result.period))) throw new Error('The returned period fails classical verification.');
  if (result.period != null && period != null && result.period !== period) throw new Error('The returned period conflicts with the measurements.');
  const factors = period ? factorsFromPeriod(period) : null;
  if (result.factors != null && (!Array.isArray(result.factors) || result.factors.length !== 2 || [...result.factors].sort().join(',') !== '3,5')) throw new Error('The returned factors do not factor 15.');
  if (result.recovered_toy_secret != null && result.recovered_toy_secret !== 3) throw new Error('The returned toy private exponent is incorrect.');
  return { ...result, distribution: dist, phase_bits: bits, total,
    status: result.status === 'inconclusive' || !factors ? 'inconclusive' : 'success', period, factors };
}
export async function runAttack({ mode, onStatus = () => {} }) {
  onStatus('submitting');
  if (mode === 'demo') {
    onStatus('waiting');
    await new Promise(resolve => setTimeout(resolve, 800));
    return { ...validateResult({ status: 'success', distribution: { '0000': 256, '0100': 256, '1000': 256, '1100': 256 },
      distribution_kind: 'counts', phase_bits: 4, explanation: 'Deterministic sample measurements; no quantum job executed.' }), source: 'sample' };
  }
  if (!bridge) throw new Error('Live Qollab is not connected. The Python team must supply quantum.attack.run_attack and configure the adapter. Select a simulator in Qollab’s Select QPU dialog after connecting it.');
  const { runAttack: fn, backend } = bridge;
  const promise = fn.callPromising(backend, 1024);
  onStatus('waiting');
  const raw = await promise;
  try { return { ...validateResult(raw), source: 'live' }; }
  finally { if (raw && typeof raw.destroy === 'function') raw.destroy(); }
}
