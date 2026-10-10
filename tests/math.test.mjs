import test from 'node:test';
import assert from 'node:assert/strict';
import { makeKeys, modPow, encode, encrypt, decrypt, factorsFromPeriod, periodFromDistribution } from '../js/rsa.js';
import { normalize, validateResult, runAttack, configureQollab } from '../js/quantum-adapter.js';

test('RSA parameters match the lesson, with either prime order', () => {
  assert.deepEqual(makeKeys(3, 5), { p: 3, q: 5, n: 15, phi: 8, e: 3, d: 3 });
  assert.equal(makeKeys(5, 3).d, 3);
  for (const pair of [[3, 3], [5, 7], [1, 5], [2.5, 5], [NaN, 5], [0, 0]]) assert.throws(() => makeKeys(...pair));
});
test('every residue round-trips, including values not coprime to 15', () => {
  for (let m = 0; m < 15; m++) assert.equal(modPow(modPow(m, 3, 15), 3, 15), m);
});
test('real text round-trips losslessly, with fixed-width leading zeroes', () => {
  const keys = makeKeys(3, 5);
  for (const text of ['Meet me at midnight ♥', '你好 🌙 café e\u0301\nمرحبا', '<img src=x onerror=alert(1)>', '\u0000\u0001', '🌙'.repeat(140), '', 'a'.repeat(280)]) {
    assert.equal(decrypt(encrypt(text, keys), keys.d), text);
    const encoded = encode(text, 15);
    assert.equal(encoded.width, 3);
    assert.equal(encoded.digits.length, encoded.byteLength * 3);
    assert(encoded.digits.every(d => d >= 0 && d < 15));
  }
  const text = Array.from({ length: 256 }, (_, i) => String.fromCodePoint(i)).join('');
  assert.equal(decrypt(encrypt(text, keys), keys.d), text);
});
test('corrupt packet metadata and blocks are rejected', () => {
  const packet = encrypt('hello', makeKeys(3, 5));
  assert.throws(() => decrypt({ ...packet, width: 2 }, 3));
  assert.throws(() => decrypt({ ...packet, ciphertext: [15, ...packet.ciphertext.slice(1)] }, 3));
});
test('period candidates come from measurements and must be minimal and useful', () => {
  assert.deepEqual(factorsFromPeriod(4), [3, 5]);
  for (const r of [0, 1, 2, 3, 6, 8, -4, 1.5, Infinity]) assert.equal(factorsFromPeriod(r), null);
  assert.equal(periodFromDistribution({ '0100': 20 }, 4), 4);
  assert.equal(periodFromDistribution({ '1100': 20 }, 4), 4);
  assert.equal(periodFromDistribution({ '0000': 20, '1000': 20 }, 4), null);
});
const sample = { status: 'success', distribution: { '00': 25, '01': 25, '10': 25, '11': 25 }, distribution_kind: 'counts' };
test('nested Python maps normalize, counts and probabilities stay distinct', () => {
  const proxy = { toJs: () => new Map([['status', 'success'], ['distribution', new Map([['00', .25], ['01', .25], ['10', .25], ['11', .25]])], ['distribution_kind', 'probabilities']]) };
  assert.equal(normalize(proxy).distribution['01'], .25);
  assert.equal(validateResult(proxy).distribution_kind, 'probabilities');
  assert.equal(validateResult(proxy).period, 4);
  assert.equal(validateResult(sample).total, 100);
});
test('unhelpful measurements cannot claim success even with a supplied period', () => {
  assert.equal(validateResult({ ...sample, distribution: { '00': 100 }, period: 4 }).status, 'inconclusive');
  assert.equal(validateResult({ ...sample, status: 'inconclusive' }).status, 'inconclusive');
});
test('malformed and contradictory live outputs fail instead of becoming samples', () => {
  for (const changed of [
    { status: 'ready' }, { status: 'error', explanation: 'Backend failed' },
    { distribution_kind: 'unknown' }, { distribution: { '01': -.1 } },
    { distribution: { '01': .5 } }, { distribution: {} },
    { distribution: { '0': 3 } }, { distribution: { '0x1': 3 } },
    { distribution: { '01': NaN } }, { period: 8 }, { factors: [1, 15] },
    { recovered_toy_secret: 5 }, { phase_bits: 4 },
    { distribution_kind: 'probabilities', distribution: { '01': .3 } },
  ]) assert.throws(() => validateResult({ ...sample, ...changed }));
});
test('disconnected live mode rejects and never falls back to sample success', async () => {
  await assert.rejects(runAttack({ mode: 'live' }), /not connected/);
});
test('connected live calls the exact two-argument Python contract and normalizes proxy', async () => {
  const backend = { test: true }; let called = 0, destroyed = false; const statuses = [];
  configureQollab({ backend, runAttack: { callPromising: async (...args) => {
    assert.deepEqual(args, [backend, 1024]); called++;
    return { toJs: () => new Map(Object.entries(sample)), destroy: () => { destroyed = true; } };
  } } });
  const result = await runAttack({ mode: 'live', onStatus: s => statuses.push(s) });
  assert.equal(called, 1); assert.equal(result.source, 'live'); assert.equal(result.status, 'success'); assert(destroyed);
  assert.deepEqual(statuses, ['submitting', 'waiting']);
});
test('Python exceptions propagate honestly', async () => {
  configureQollab({ backend: {}, runAttack: { callPromising: async () => { throw new Error('Device offline'); } } });
  await assert.rejects(runAttack({ mode: 'live' }), /Device offline/);
});
