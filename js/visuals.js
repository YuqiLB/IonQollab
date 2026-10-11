import { gcd, modPow } from './rsa.js';

const text = (x, y, value, cls = '') => '<text x="' + x + '" y="' + y + '" class="' + cls + '">' + value + '</text>';
const rect = (x, y, w, h, cls = 'tile') => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" class="' + cls + '"/>';
const line = (x1, y1, x2, y2) => '<path class="line" d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '"/>';
const arrow = (x1, y, x2) => line(x1, y, x2, y) + '<path fill="#8bd8e5" d="M' + x2 + ' ' + y + 'l' + (x2 > x1 ? -7 : 7) + ' -4v8z"/>';
const svg = (body, label, height = 210) => '<svg class="math-svg" viewBox="0 0 480 ' + height + '" role="img" aria-label="' + label + '">' + body + '</svg>';
export function primesVisual(p, q, combined = false) {
  let body = '';
  const cell = Math.min(20, 125 / Math.max(p, q), 178 / Math.max(p, q)), gap = cell * .28;
  const x0 = 240 - (q * (cell + gap) - gap) / 2, y0 = 44;
  for (let row = 0; row < p; row++) for (let col = 0; col < q; col++) {
    const x = x0 + col * (cell + gap), y = y0 + row * (cell + gap);
    body += '<rect class="reveal" x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" fill="' + (row % 2 ? '#91a9fb' : '#8bd8e5') + '" style="animation-delay:' + ((row * q + col) * .01) + 's"/>';
  }
  body += '<g class="prime-left">' + text(69, 88, p, 'big cyan') + text(69, 111, 'rows', 'muted') + '</g>';
  body += '<g class="prime-right">' + text(411, 88, q, 'big blue') + text(411, 111, 'columns', 'muted') + '</g>';
  body += text(240, 230, combined ? p + ' × ' + q + ' = ' + p * q : 'two primes, one public product', combined ? 'big' : 'muted');
  return svg(body, p + ' rows and ' + q + ' columns form ' + p * q + ' tiles', 250);
}
export function phiVisual(keys) {
  const sample = Array.from({ length: 12 }, (_, i) => i + 1);
  let body = text(240, 32, 'Count residues below N that share no factor with N.', 'muted');
  sample.forEach((value, i) => {
    const coprime = gcd(value, keys.n) === 1, x = 38 + (i % 6) * 78, y = 67 + Math.floor(i / 6) * 48;
    body += '<g class="reveal" style="animation-delay:' + i * .035 + 's">' + rect(x, y, 58, 34, coprime ? 'accent-tile' : 'tile') + text(x + 29, y + 22, value, coprime ? 'cyan' : 'muted') + '</g>';
  });
  body += text(240, 181, 'φ(' + keys.n + ') = (' + keys.p + ' − 1)(' + keys.q + ' − 1) = ' + keys.phi, 'big');
  return svg(body, 'Sample residues below ' + keys.n + '; Euler phi is ' + keys.phi + ' for the selected prime factors.');
}
export function keyVisual(keys) {
  return svg('<g class="prime-left">' + rect(23, 45, 196, 97, 'accent-tile') + text(121, 71, 'PUBLIC', 'muted') + text(121, 112, 'n = ' + keys.n + ' · e = ' + keys.e, 'cyan') + '</g>' +
    '<g class="prime-right">' + rect(260, 45, 196, 97, 'key-rose') + text(358, 71, 'PRIVATE', 'muted') + text(358, 112, 'p, q · d = ' + keys.d, 'rose') + '</g>' + text(240, 184, keys.e + ' × ' + keys.d + ' ≡ 1 (mod ' + keys.phi + ')', 'muted'), 'Toy RSA public values n=' + keys.n + ' and e=' + keys.e + '; private primes and d=' + keys.d);
}
export function encodingVisual(byte, digits, n) {
  const width = digits.length, spacing = Math.min(77, 230 / width), left = 240 - (width * spacing) / 2;
  const terms = digits.map((digit, i) => digit + ' × ' + n + '^' + (width - i - 1)).join(' + ');
  return svg(rect(27, 65, 100, 75) + text(77, 91, 'UTF-8 byte', 'muted') + text(77, 125, byte, 'big') + arrow(141, 103, 199) +
    digits.map((d, i) => '<g class="move-right" style="animation-delay:' + i * .1 + 's">' + rect(left + i * spacing, 65, spacing * .78, 75, 'accent-tile') + text(left + i * spacing + spacing * .39, 110, d, 'big cyan') + text(left + i * spacing + spacing * .39, 132, n + '^' + (width - i - 1), 'small muted') + '</g>').join('') +
    text(240, 184, terms + ' = ' + byte, 'muted'), 'A UTF-8 byte becomes ' + width + ' fixed-width base-' + n + ' digits');
}
export function ringVisual(m, n = 15, e = 3) {
  const pos = k => ({ x: 151 + 72 * Math.sin(k / n * Math.PI * 2), y: 107 - 72 * Math.cos(k / n * Math.PI * 2) });
  let body = '<circle cx="151" cy="107" r="72" fill="none" stroke="#34445c"/>';
  const residues = Array.from({ length: Math.min(e, 7) }, (_, i) => modPow(m, i + 1, n));
  for (let i = 0; i < n; i++) {
    const p = pos(i), outer = { x: 151 + 92 * Math.sin(i / n * Math.PI * 2), y: 112 - 92 * Math.cos(i / n * Math.PI * 2) };
    body += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (residues.includes(i) ? 5 : 2) + '" fill="' + (residues.includes(i) ? '#8bd8e5' : '#54637b') + '"/>' + text(outer.x, outer.y, i, 'small ' + (residues.includes(i) ? 'cyan' : 'muted'));
  }
  const points = residues.map(pos);
  body += '<path class="ring-trace" d="M' + points.map(p => p.x + ',' + p.y).join(' L') + '" stroke="#8bd8e5" stroke-width="2.5" fill="none"/>';
  body += text(151, 110, 'mod ' + n, 'muted') + text(360, 65, 'm = ' + m, 'cyan') + text(360, 107, 'm^' + e + ' mod ' + n, 'big') + text(360, 151, '= ' + modPow(m, e, n), 'big cyan') + text(360, 183, residues.join(' → '), 'muted');
  return svg(body, 'Repeated multiplication modulo ' + n + ' follows residues ' + residues.join(', '), 222);
}
export function sequenceVisual(n = 15, a = 2, period = 4) {
  const values = Array.from({ length: 8 }, (_, x) => modPow(a, x, n));
  let body = text(240, 28, 'f(x) = ' + a + 'ˣ mod ' + n, 'big');
  values.forEach((v, i) => { body += '<g class="reveal" style="animation-delay:' + i * .1 + 's">' + rect(12 + i * 58, 70, 49, 48, i < period ? 'accent-tile' : 'tile') + text(36 + i * 58, 100, v, i < period ? 'cyan' : '') + text(36 + i * 58, 142, 'x=' + i, 'small muted') + '</g>'; });
  body += text(240, 197, 'the order is the first r with aʳ ≡ 1 (mod N)', 'muted');
  return svg(body, a + ' to the x modulo ' + n + '; the modular sequence repeats with period ' + period, 216);
}
export function circuitVisual(n = 15, a = 2) {
  let body = text(240, 20, 'ORDER-FINDING SCHEMATIC · a = ' + a + ', N = ' + n, 'small muted');
  [64, 105, 146].forEach((y, i) => { body += text(31, y + 5, i < 2 ? '|0⟩' : '|1⟩') + line(55, y, 448, y); });
  body += rect(69, 47, 36, 34) + text(87, 70, 'H') + rect(69, 88, 36, 34) + text(87, 111, 'H');
  body += '<circle cx="147" cy="64" r="4" fill="#8bd8e5"/>' + line(147, 64, 147, 132) + rect(123, 131, 48, 30, 'accent-tile') + text(147, 152, 'U¹', 'cyan');
  body += '<circle cx="207" cy="105" r="4" fill="#8bd8e5"/>' + line(207, 105, 207, 132) + rect(183, 131, 48, 30, 'accent-tile') + text(207, 152, 'U²', 'cyan');
  body += text(251, 84, '…', 'muted') + rect(283, 43, 62, 80) + text(314, 89, 'QFT⁻¹', 'cyan');
  [64, 105].forEach(y => { body += rect(373, y - 15, 39, 30) + text(392, y + 6, 'M', 'rose'); });
  body += text(240, 193, 'Hadamards → controlled powers → inverse QFT → measure', 'small muted');
  return svg(body, 'Order-finding schematic. Hadamard gates, controlled modular multiplication, inverse Fourier transform, measurement. Wires are abbreviated; this is not the executed circuit.', 214);
}
export function factorVisual(r, factors, n = 15, a = 2) {
  const half = modPow(a, r / 2, n);
  return svg(text(240, 34, 'Verified: ' + a + '^' + r + ' mod ' + n + ' = 1', 'cyan') + text(240, 64, 'The measured candidate is checked against smaller exponents.', 'muted') +
    '<g class="prime-left">' + rect(16, 88, 215, 82, 'accent-tile') + text(124, 118, 'gcd(' + a + '^' + r / 2 + ' − 1, ' + n + ')', '') + text(124, 154, '= ' + factors[0], 'big cyan') + '</g>' +
    '<g class="prime-right">' + rect(249, 88, 215, 82) + text(357, 118, 'gcd(' + a + '^' + r / 2 + ' + 1, ' + n + ')') + text(357, 154, '= ' + factors[1], 'big blue') + '</g>' + text(240, 207, factors[0] + ' × ' + factors[1] + ' = ' + n + '  (a^(r/2) mod N = ' + half + ')', 'muted'), 'Period ' + r + ' recovers factors ' + factors[0] + ' and ' + factors[1] + ' with gcd calculations', 226);
}
export function pqVisual(step) {
  let body = text(75, 25, 'YOU', 'muted') + text(405, 25, 'MIRA', 'muted');
  body += rect(25, 46, 100, 120) + rect(355, 46, 100, 120) + text(75, 73, 'sender', 'small muted') + text(405, 73, 'recipient', 'small muted');
  if (step === 0) {
    body += text(405, 111, 'pk', 'big cyan') + text(405, 143, 'sk stays here', 'small rose') + arrow(342, 105, 140) + '<g class="prime-right">' + rect(203, 82, 74, 44, 'accent-tile') + text(240, 110, 'pk', 'cyan') + '</g>' + text(240, 196, 'An authenticated ML-KEM public key crosses the channel.', 'small muted');
  } else {
    body += rect(38, 90, 74, 46, 'token') + text(75, 119, 'S', 'big cyan');
    if (step < 3) {
      body += arrow(139, 108, 341) + '<g class="move-right">' + rect(196, 84, 88, 48, 'accent-tile') + text(240, 114, 'Cₖₑₘ', 'cyan') + '</g>';
      body += text(240, 156, 'encapsulation data', 'small muted');
      body += step === 1 ? text(405, 112, 'sk', 'big rose') : '<g class="reveal delay">' + rect(368, 90, 74, 46, 'token') + text(405, 119, 'S', 'big cyan') + '</g>';
      body += text(240, 202, step === 1 ? 'S stays with you. Only Cₖₑₘ is sent.' : 'Decaps(sk, Cₖₑₘ) → the same shared secret S.', 'muted');
    } else {
      body += rect(368, 90, 74, 46, 'token') + text(405, 119, 'S', 'big cyan');
      body += arrow(140, 108, 340) + '<g class="move-right">' + rect(186, 79, 108, 58, 'key-rose') + text(240, 104, 'message', 'rose') + text(240, 124, '+ auth tag', 'small rose') + '</g>';
      body += text(75, 186, 'KDF(S) → K', 'small cyan') + text(405, 186, 'KDF(S) → K', 'small cyan') + text(240, 221, 'A derived symmetric key locks the message separately.', 'small muted');
    }
  }
  return svg(body, ['Mira provides her authenticated ML-KEM public key. Her secret key remains private.', 'The sender encapsulates secret S and sends encapsulation data C kem.', 'Mira decapsulates the same secret S using her private key.', 'Both sides derive a symmetric key from S; authenticated encryption protects the message and its integrity.'][step], 243);
}
