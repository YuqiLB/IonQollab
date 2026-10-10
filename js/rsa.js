// Intentionally tiny, unpadded textbook RSA. Educational, never production crypto.
export function modPow(base, exponent, modulus) {
  if (![base, exponent, modulus].every(Number.isSafeInteger) || exponent < 0 || modulus < 2) throw new Error('Invalid modular exponentiation input.');
  let b = BigInt(base), e = BigInt(exponent), n = BigInt(modulus), result = 1n;
  b = ((b % n) + n) % n;
  while (e > 0n) { if (e & 1n) result = (result * b) % n; b = (b * b) % n; e >>= 1n; }
  return Number(result);
}
export function gcd(a, b) { while (b) [a, b] = [b, a % b]; return Math.abs(a); }
export function isPrime(n) {
  if (!Number.isSafeInteger(n) || n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}
export function inverse(e, phi) {
  for (let d = 1; d < phi; d++) if ((e * d) % phi === 1) return d;
  throw new Error('The exponent has no inverse.');
}
export function makeKeys(p, q) {
  if (!isPrime(p) || !isPrime(q)) throw new Error('Both values must be prime numbers. Try 3 and 5.');
  if (p === q) throw new Error('Choose two distinct primes: 3 and 5.');
  if (p * q !== 15) throw new Error('This demonstration supports only 3 and 5, in either order.');
  const n = p * q, phi = (p - 1) * (q - 1), e = 3;
  return { p, q, n, phi, e, d: inverse(e, phi) };
}
export function encode(text, n) {
  const bytes = new TextEncoder().encode(text);
  const width = Math.ceil(Math.log(256) / Math.log(n));
  const digits = [];
  for (const byte of bytes) {
    let value = byte;
    const chunk = Array(width).fill(0);
    for (let j = width - 1; j >= 0; j--) { chunk[j] = value % n; value = Math.floor(value / n); }
    digits.push(...chunk);
  }
  return { digits, width, byteLength: bytes.length, encoding: 'utf-8/base-n-fixed-width' };
}
export function encrypt(text, keys) {
  const encoded = encode(text, keys.n);
  return { n: keys.n, e: keys.e, width: encoded.width, byteLength: encoded.byteLength,
    encoding: encoded.encoding, ciphertext: encoded.digits.map(m => modPow(m, keys.e, keys.n)) };
}
export function decrypt(packet, d) {
  if (packet.n !== 15 || packet.width !== 3 || packet.encoding !== 'utf-8/base-n-fixed-width' ||
      !Number.isInteger(packet.byteLength) || packet.byteLength < 0 ||
      packet.ciphertext.length !== packet.byteLength * packet.width) throw new Error('Invalid toy packet metadata.');
  const blocks = packet.ciphertext.map(c => {
    if (!Number.isInteger(c) || c < 0 || c >= packet.n) throw new Error('Invalid ciphertext block.');
    return modPow(c, d, packet.n);
  });
  const bytes = [];
  for (let i = 0; i < blocks.length; i += packet.width) {
    let b = 0;
    for (let j = 0; j < packet.width; j++) b = b * packet.n + blocks[i + j];
    if (b > 255) throw new Error('Recovered block is not a UTF-8 byte.');
    bytes.push(b);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
}
export function factorsFromPeriod(period, n = 15, a = 2) {
  if (!Number.isSafeInteger(period) || period < 2 || period > 64 || period % 2 || modPow(a, period, n) !== 1) return null;
  // Require the smallest period, not just a multiple of it.
  for (let r = 1; r < period; r++) if (modPow(a, r, n) === 1) return null;
  const half = modPow(a, period / 2, n);
  const factors = [gcd(half - 1, n), gcd(half + 1, n)];
  return factors.every(f => f > 1 && f < n && isPrime(f)) && factors[0] * factors[1] === n ? factors : null;
}
// Continued-fraction convergents of measured phase y / 2^t.
// No trial-factor or hardcoded-success fallback: unhelpful measurements remain so.
export function periodFromDistribution(distribution, bits, n = 15, a = 2) {
  for (const [key, weight] of Object.entries(distribution).sort((a, b) => b[1] - a[1])) {
    if (weight <= 0) continue;
    let numerator = parseInt(key, 2), denominator = 2 ** bits;
    if (!numerator) continue;
    let h0 = 0, h1 = 1, k0 = 1, k1 = 0;
    while (denominator) {
      const quotient = Math.floor(numerator / denominator);
      const h = quotient * h1 + h0, k = quotient * k1 + k0;
      if (factorsFromPeriod(k, n, a)) return k;
      [h0, h1, k0, k1] = [h1, h, k1, k];
      [numerator, denominator] = [denominator, numerator % denominator];
    }
  }
  return null;
}
