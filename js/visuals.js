import { modPow } from './rsa.js';

const text = (x, y, value, cls = '') => '<text x="' + x + '" y="' + y + '" class="' + cls + '">' + value + '</text>';
const rect = (x, y, w, h, cls = 'tile') => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" class="' + cls + '"/>';
const line = (x1, y1, x2, y2) => '<path class="line" d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '"/>';
const arrow = (x1, y, x2) => line(x1, y, x2, y) + '<path fill="#8bd8e5" d="M' + x2 + ' ' + y + 'l' + (x2 > x1 ? -7 : 7) + ' -4v8z"/>';
const svg = (body, label, height = 210) => '<svg class="math-svg" viewBox="0 0 480 ' + height + '" role="img" aria-label="' + label + '">' + body + '</svg>';
export function primesVisual(p, q, combined = false) {
  let body = '';
  for (let row = 0; row < p; row++) for (let col = 0; col < q; col++) {
    const x = 160 + col * 34, y = 51 + row * 34;
    body += '<rect class="reveal" x="' + x + '" y="' + y + '" width="22" height="22" fill="' + (row % 2 ? '#91a9fb' : '#8bd8e5') + '" style="animation-delay:' + ((row * q + col) * .03) + 's"/>';
  }
  body += '<g class="prime-left">' + text(69, 88, p, 'big cyan') + text(69, 111, 'rows', 'muted') + '</g>';
  body += '<g class="prime-right">' + text(411, 88, q, 'big blue') + text(411, 111, 'columns', 'muted') + '</g>';
  body += text(240, Math.max(190, p * 34 + 80), combined ? p + ' × ' + q + ' = ' + p * q : 'two primes, one public product', combined ? 'big' : 'muted');
  return svg(body, p + ' rows and ' + q + ' columns form ' + p * q + ' tiles', Math.max(220, p * 34 + 110));
}
export function phiVisual(keys) {
  const coprimes = Array.from({ length: 14 }, (_, i) => i + 1).filter(v => v % 3 && v % 5);
  let body = text(240, 25, 'Which numbers share no factor with 15?', 'muted');
  for (let i = 1; i <= 14; i++) {
    const x = 43 + ((i - 1) % 7) * 58, y = 44 + Math.floor((i - 1) / 7) * 54;
    body += '<g class="reveal" style="animation-delay:' + i * .035 + 's">' + rect(x, y, 42, 37, coprimes.includes(i) ? 'accent-tile' : 'tile') + text(x + 21, y + 24, i, coprimes.includes(i) ? 'cyan' : 'muted') + '</g>';
  }
  body += text(240, 182, 'φ(15) = (' + keys.p + ' − 1)(' + keys.q + ' − 1) = ' + keys.phi, 'big');
  return svg(body, 'Eight numbers below 15 are coprime to 15: ' + coprimes.join(', '));
}
export function keyVisual(keys) {
  return svg('<g class="prime-left">' + rect(23, 45, 196, 97, 'accent-tile') + text(121, 71, 'PUBLIC', 'muted') + text(121, 112, 'n = ' + keys.n + ' · e = ' + keys.e, 'cyan') + '</g>' +
    '<g class="prime-right">' + rect(260, 45, 196, 97, 'key-rose') + text(358, 71, 'PRIVATE', 'muted') + text(358, 112, 'p, q · d = ' + keys.d, 'rose') + '</g>' + text(240, 184, 'e × d = 3 × 3 ≡ 1 (mod 8)', 'muted'), 'Public values n=15 and e=3 separate from private primes and d=3');
}
export function encodingVisual(byte, digits) {
  return svg(rect(27, 65, 100, 75) + text(77, 91, 'UTF-8 byte', 'muted') + text(77, 125, byte, 'big') + arrow(141, 103, 199) +
    digits.map((d, i) => '<g class="move-right" style="animation-delay:' + i * .1 + 's">' + rect(215 + i * 77, 65, 62, 75, 'accent-tile') + text(246 + i * 77, 110, d, 'big cyan') + text(246 + i * 77, 132, ['15²', '15¹', '15⁰'][i], 'small muted') + '</g>').join('') +
    text(240, 184, digits[0] + ' × 225 + ' + digits[1] + ' × 15 + ' + digits[2] + ' = ' + byte, 'muted'), 'A UTF-8 byte becomes three fixed-width base-15 digits');
}
export function ringVisual(m, n = 15, e = 3) {
  const pos = k => ({ x: 151 + 72 * Math.sin(k / n * Math.PI * 2), y: 107 - 72 * Math.cos(k / n * Math.PI * 2) });
  let body = '<circle cx="151" cy="107" r="72" fill="none" stroke="#34445c"/>';
  const residues = [m, modPow(m, 2, n), modPow(m, 3, n)];
  for (let i = 0; i < n; i++) {
    const p = pos(i), outer = { x: 151 + 92 * Math.sin(i / n * Math.PI * 2), y: 112 - 92 * Math.cos(i / n * Math.PI * 2) };
    body += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (residues.includes(i) ? 5 : 2) + '" fill="' + (residues.includes(i) ? '#8bd8e5' : '#54637b') + '"/>' + text(outer.x, outer.y, i, 'small ' + (residues.includes(i) ? 'cyan' : 'muted'));
  }
  const points = residues.map(pos);
  body += '<path class="ring-trace" d="M' + points.map(p => p.x + ',' + p.y).join(' L') + '" stroke="#8bd8e5" stroke-width="2.5" fill="none"/>';
  body += text(151, 110, 'mod 15', 'muted') + text(360, 65, 'm = ' + m, 'cyan') + text(360, 107, m + '³ mod 15', 'big') + text(360, 151, '= ' + modPow(m, e, n), 'big cyan') + text(360, 183, residues.join(' → '), 'muted');
  return svg(body, 'Repeated multiplication modulo 15 follows residues ' + residues.join(', '), 222);
}
export function sequenceVisual() {
  const values = Array.from({ length: 8 }, (_, x) => modPow(2, x, 15));
  let body = text(240, 28, 'f(x) = 2ˣ mod 15', 'big');
  values.forEach((v, i) => { body += '<g class="reveal" style="animation-delay:' + i * .1 + 's">' + rect(12 + i * 58, 70, 49, 48, i < 4 ? 'accent-tile' : 'tile') + text(36 + i * 58, 100, v, i < 4 ? 'cyan' : '') + text(36 + i * 58, 142, 'x=' + i, 'small muted') + '</g>'; });
  body += '<path d="M36 160v13h232v-13" class="line"/>' + text(153, 197, 'the pattern repeats after 4 steps', 'muted');
  return svg(body, '2 to the x modulo 15 repeats 1, 2, 4, 8 every four steps', 216);
}
export function circuitVisual() {
  let body = text(240, 20, 'ORDER-FINDING SCHEMATIC · a = 2, N = 15', 'small muted');
  [64, 105, 146].forEach((y, i) => { body += text(31, y + 5, i < 2 ? '|0⟩' : '|1⟩') + line(55, y, 448, y); });
  body += rect(69, 47, 36, 34) + text(87, 70, 'H') + rect(69, 88, 36, 34) + text(87, 111, 'H');
  body += '<circle cx="147" cy="64" r="4" fill="#8bd8e5"/>' + line(147, 64, 147, 132) + rect(123, 131, 48, 30, 'accent-tile') + text(147, 152, 'U¹', 'cyan');
  body += '<circle cx="207" cy="105" r="4" fill="#8bd8e5"/>' + line(207, 105, 207, 132) + rect(183, 131, 48, 30, 'accent-tile') + text(207, 152, 'U²', 'cyan');
  body += text(251, 84, '…', 'muted') + rect(283, 43, 62, 80) + text(314, 89, 'QFT⁻¹', 'cyan');
  [64, 105].forEach(y => { body += rect(373, y - 15, 39, 30) + text(392, y + 6, 'M', 'rose'); });
  body += text(240, 193, 'Hadamards → controlled powers → inverse QFT → measure', 'small muted');
  return svg(body, 'Order-finding schematic. Hadamard gates, controlled modular multiplication, inverse Fourier transform, measurement. Wires are abbreviated; this is not the executed circuit.', 214);
}
export function factorVisual(r, factors) {
  return svg(text(240, 34, 'Verified: 2⁴ mod 15 = 1', 'cyan') + text(240, 64, 'No smaller positive exponent returns to 1.', 'muted') +
    '<g class="prime-left">' + rect(16, 88, 215, 82, 'accent-tile') + text(124, 118, 'gcd(2² − 1, 15)', '') + text(124, 154, '= ' + factors[0], 'big cyan') + '</g>' +
    '<g class="prime-right">' + rect(249, 88, 215, 82) + text(357, 118, 'gcd(2² + 1, 15)') + text(357, 154, '= ' + factors[1], 'big blue') + '</g>' + text(240, 207, factors[0] + ' × ' + factors[1] + ' = 15', 'muted'), 'Period ' + r + ' recovers factors 3 and 5 with gcd calculations', 226);
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
