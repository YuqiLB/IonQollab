import { character, rivalSprites } from '../../../assets/manifest.js';
import { makeKeys, encrypt } from '../../../js/rsa.js';

const MESSAGE = 'Meet me on the observatory rooftop at midnight? ♥';
const ALICE_LINE = 'Let’s make a plan. Where should we meet?';
const ZENO_LINE = 'A private invitation? Cute. Let’s see how private.';
const titles = { a: 'Intimate handheld', b: 'Graphic confrontation', c: 'Hijacked interface' };
const root = document.querySelector('#preview');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let direction = 'a', phase = 'ready', epoch = 0, timers = [], packet = null, copiedPacket = null, returnFocus = false;
const $ = selector => root.querySelector(selector);
const asset = path => new URL('../../../' + path.replace(/^\.\//, ''), import.meta.url).href;
const alice = (cls = '') => `<img class="sprite alice ${cls}" src="${asset(character.blushing)}" width="68" height="89" alt="${character.descriptions.blushing}">`;
const zeno = () => `<div class="intruder" aria-hidden="true"><img class="sprite zeno" src="${asset(rivalSprites.standing.src)}" width="136" height="178" alt=""><img class="sprite machine" src="${asset(rivalSprites.machine.src)}" width="68" height="89" alt=""></div>`;
const message = () => `<div class="message-unit"><div class="message-meta"><span class="message-owner">YOU → ALICE</span><span class="message-kind">UNSENT</span></div><div class="letter" aria-label="${MESSAGE}"></div><p class="packet-note" hidden></p></div>`;
const controls = () => `<div class="action-group"><button class="primary" type="button">Encrypt message <span aria-hidden="true">↗</span></button><div class="secondary-actions"><button class="replay" type="button" aria-label="Replay scene">↺ Replay</button><button class="skip" type="button" hidden>Skip animation</button></div></div>`;
const dialogue = () => `<div class="dialogue"><span class="speaker">ALICE</span><p class="dialogue-line">${ALICE_LINE}</p></div>`;
const footer = () => `<footer class="scene-footer"><span class="scene-status">01 / A PRIVATE INVITATION</span><button class="about">Toy RSA · scripted interception <span aria-hidden="true">ⓘ</span><span class="sr-only"> — What actually runs?</span></button></footer>`;
const room = `<svg class="room" viewBox="0 0 360 210" preserveAspectRatio="xMidYMid slice" aria-hidden="true" shape-rendering="crispEdges">
  <path fill="#382b38" d="M0 0h360v210H0z"/><path fill="#232333" d="M17 11h326v142H17z"/>
  <g transform="translate(218,-6)"><path fill="#c79983" d="M60 29h10v3h3v10h-3v3H60v-3h-3V32h3z"/><path fill="#232333" d="M67 29h5v12h-5z"/></g>
  <g fill="#746074"><path d="M29 32h1v1h-1zM114 18h1v1h-1zM151 47h1v1h-1zM295 30h1v1h-1zM324 56h1v1h-1zM219 24h1v1h-1z"/></g>
  <path fill="#191f2a" d="M17 113h12V87h25v16h11V71h22v34h20V92h30v26h28V84h20v14h32V70h21v38h18V90h36v21h19V81h22v72H17z"/>
  <g fill="#806273"><path d="M35 93h3v5h-3zM73 82h3v5h-3zM80 93h3v5h-3zM225 78h3v5h-3zM231 94h3v5h-3zM275 98h3v5h-3zM319 87h3v5h-3z"/></g>
  <path fill="#53404a" d="M13 6h334v5H13zM13 151h334v8H13zM13 6h5v150h-5zM342 6h5v150h-5zM101 10h4v143h-4zM255 10h4v143h-4z"/>
  <path fill="#4a3540" d="M0 0h9v163H0zM351 0h9v163h-9z"/><path fill="#67484a" d="M0 163h360v47H0z"/><path fill="#ae7860" d="M0 163h360v3H0z"/>
  <path fill="#402d36" d="M0 195h360v3H0zM21 174h91v2H21zM278 184h65v2h-65z"/>
  <path fill="#251f2a" d="M285 159h37v4h-37zM302 119h4v42h-4z"/><path fill="#bf8a64" d="M291 95h25v5h3v5h3v13h-37v-13h3v-5h3z"/><path fill="#e2b489" d="M288 113h31v5h-31z"/>
  <path fill="#362b35" d="M38 166h27v4h4v15h-4v4H38z"/><path fill="#a97e72" d="M40 164h23v4H40zM65 170h8v11h-8v-3h5v-5h-5z"/><path fill="#241f2b" d="M42 165h19v2H42z"/>
</svg>`;

function template() {
  if (direction === 'a') return `<section class="scene handheld" data-phase="ready" aria-label="A: Intimate handheld">
    ${room}<div class="room-title"><p class="eyebrow">A QUANTUM LOVE STORY</p><h1>Qrush<span>♥</span></h1><p>Late shift. Just the two of you.</p></div>
    <div class="device-zone"><div class="device"><div class="device-cap"><span>QR / PERSONAL COMMUNICATOR</span><i aria-hidden="true"></i></div>
      <div class="device-screen"><header class="device-contact"><span class="contact-name">Alice</span><span class="contact-state">LATE SHIFT · 23:58</span></header>
        <div class="intimate-portrait">${alice()}<span class="portrait-caption">STILL HERE.</span></div>${dialogue()}${message()}
      </div><div class="device-controls">${controls()}</div><div class="device-bottom" aria-hidden="true"><span>Q / 02</span><span>▰ ▰ ▰</span></div></div>${zeno()}</div>
    <span class="room-location">QUANTUM LABORATORY<br>NIGHT WINDOW / 2042</span>${footer()}</section>`;
  if (direction === 'b') return `<section class="scene confrontation" data-phase="ready" aria-label="B: Graphic confrontation">
    <div class="poster-rule" aria-hidden="true"></div><header class="poster-heading"><h1>Qrush<span>♥</span></h1><p>A LITTLE CHEMISTRY.<br>A LITTLE CRYPTOGRAPHY.</p></header>
    <span class="poster-chapter">01<span>AFTER<br>HOURS</span></span><div class="character-plane" aria-hidden="true"></div>
    <div class="poster-portrait">${alice()}</div><div class="invasion-plane" aria-hidden="true"></div>${zeno()}
    <div class="poster-content">${dialogue()}${message()}${controls()}</div><span class="vertical-caption" aria-hidden="true">QUANTUM LABORATORY — 23:58</span>${footer()}</section>`;
  return `<section class="scene terminal" data-phase="ready" aria-label="C: Hijacked interface">
    <header class="desktop-heading"><h1>Qrush<span>®</span></h1><p>QUANTUM LABORATORY<br>PERSONAL COMMUNICATIONS / 2042</p><span class="desktop-clock">23:58</span></header>
    <div class="terminal-window"><header class="window-title"><span class="window-symbol" aria-hidden="true">↗</span><span class="window-owner">BOB / PRIVATE CHANNEL</span><span class="window-serial">QR–001</span></header>
      <div class="terminal-body"><aside class="contacts"><p class="eyebrow">DIRECT MESSAGES</p><div class="recipient alice-recipient"><span class="recipient-dot" aria-hidden="true"></span><strong>Alice</strong><span class="recipient-state">Conversation open</span></div><div class="recipient observer" hidden><span aria-hidden="true">↳</span><strong>Zeno</strong><span>Uninvited observer</span></div><div class="contact-portrait">${alice()}</div><span class="sidebar-note">ONE INVITATION.<br>INTENDED FOR ONE PERSON.</span></aside>
      <div class="terminal-workspace"><header class="route"><span>TO</span><strong class="route-name">Alice</strong><span class="route-state">Not yet sent</span></header>${dialogue()}<div class="packet-workspace">${message()}<div class="copy-tray" aria-hidden="true">↳ ZENO / COPIED PACKET</div></div>${controls()}${zeno()}</div></div>
      <footer class="window-footer"><span class="window-status">DRAFT SAVED IN THIS BROWSER</span><span>LOCAL SESSION</span></footer></div>${footer()}</section>`;
}

function clearTimers() { epoch++; timers.forEach(clearTimeout); timers = []; }
function schedule(ms, callback) { const current = epoch; timers.push(setTimeout(() => { if (epoch === current) callback(); }, ms)); }
function announce(text) { document.querySelector('#announcement').textContent = text; }
function setPhase(next) { phase = next; $('.scene').dataset.phase = next; }
function setPortrait(expression) { root.querySelectorAll('.alice').forEach(img => { img.src = asset(character[expression]); img.alt = character.descriptions[expression]; }); }
function setStatus(text) { $('.scene-status').textContent = text; }
function reset({ focus = false } = {}) {
  clearTimers(); packet = null; copiedPacket = null; phase = 'ready'; returnFocus = false;
  root.innerHTML = template();
  for (const char of Array.from(MESSAGE)) {
    const span = document.createElement('span'); span.className = 'letter-char'; span.textContent = char; $('.letter').append(span);
  }
  $('.primary').addEventListener('click', act);
  $('.replay').addEventListener('click', () => { reset({ focus: true }); announce('Scene reset. Your invitation is ready to encrypt.'); });
  $('.skip').addEventListener('click', () => { const old = phase; returnFocus = true; clearTimers(); if (old === 'encrypting') seal(); else if (['sending', 'warning', 'impact'].includes(old)) { invade(); settle(); } });
  $('.about').addEventListener('click', () => {
    document.querySelector('#packet-label').textContent = copiedPacket ? 'The actual copied packet' : 'Your actual packet';
    document.querySelector('#packet-data').textContent = packet ? JSON.stringify(copiedPacket || packet, null, 2) : 'Encrypt the message to create its packet.';
    document.querySelector('#packet-dialog').showModal();
  });
  if (focus) $('.primary').focus({ preventScroll: true });
}
function act() {
  returnFocus = document.activeElement === $('.primary');
  if (phase === 'ready') {
    // This is the production encoder, not decorative/random ciphertext.
    try { packet = encrypt(MESSAGE, makeKeys(3, 5)); }
    catch (error) { announce('Encryption failed: ' + error.message); setStatus('ENCRYPTION FAILED — REPLAY TO RETRY'); return; }
    setPhase('encrypting'); $('.primary').disabled = true; $('.primary').textContent = 'Sealing your words…'; $('.skip').hidden = false;
    setStatus('02 / ENCRYPTING LOCALLY'); announce('Encrypting your invitation with the local toy RSA example.');
    if (reducedMotion.matches) return seal();
    const spans = [...root.querySelectorAll('.letter-char')];
    let offset = 0;
    for (let i = 0; i < spans.length; i++) {
      const length = new TextEncoder().encode(Array.from(MESSAGE)[i]).length * packet.width;
      const blocks = packet.ciphertext.slice(offset, offset + length); offset += length;
      schedule(90 + i * 17, () => { spans[i].textContent = blocks.join(' ') + ' '; spans[i].classList.add('encoded'); });
    }
    schedule(1080, seal);
  } else if (phase === 'sealed') {
    setPhase('sending'); $('.primary').disabled = true; $('.primary').textContent = 'Sending…'; $('.skip').hidden = false;
    $('.message-kind').textContent = 'IN TRANSIT'; setStatus('03 / ON ITS WAY TO ALICE');
    announce('The encrypted packet is on its way to Alice in the story.');
    if (direction === 'c') { $('.route-state').textContent = 'In transit'; $('.window-status').textContent = 'PACKET IN TRANSIT'; }
    if (reducedMotion.matches) { invade(); settle(); return; }
    schedule(600, () => { setPhase('warning'); setStatus('03 / SOMEONE ELSE IS ON THE LINE'); $('.dialogue-line').textContent = '…'; if (direction === 'c') $('.route-state').textContent = 'Observer joined'; });
    schedule(1150, invade);
    schedule(2300, settle);
  }
}
function seal() {
  setPhase('sealed');
  $('.letter').textContent = packet.ciphertext.slice(0, 33).join(' ');
  $('.letter').setAttribute('aria-label', 'Encrypted invitation. Ciphertext preview: ' + packet.ciphertext.slice(0, 33).join(', '));
  $('.message-kind').textContent = 'TOY RSA / SEALED';
  $('.packet-note').hidden = false; $('.packet-note').textContent = `First 33 of ${packet.ciphertext.length} blocks · ${packet.byteLength} UTF-8 bytes`;
  $('.primary').disabled = false; $('.primary').innerHTML = 'Send to Alice <span aria-hidden="true">↗</span>'; $('.skip').hidden = true;
  setStatus('02 / ENCRYPTED. YOUR MOVE.');
  announce('Toy RSA encryption complete. You decide when to send the packet.');
  if (direction === 'c') $('.window-status').textContent = 'TOY RSA PACKET READY / n = 15, e = 3';
  restoreActionFocus();
}
function invade() {
  if (!packet) return;
  copiedPacket = structuredClone(packet);
  setPhase('impact'); setPortrait('surprised');
  $('.speaker').textContent = 'ZENO · UNINVITED'; $('.dialogue-line').textContent = ZENO_LINE;
  $('.message-kind').textContent = 'COPIED BY ZENO';
  $('.message-owner').textContent = 'YOUR INVITATION / INTERCEPTED';
  if (direction === 'a') { $('.contact-name').textContent = 'Alice + an uninvited guest'; $('.contact-state').textContent = 'PRIVATE SPACE / INTERRUPTED'; }
  if (direction === 'c') {
    $('.window-owner').textContent = 'ZENO / I’LL TAKE IT FROM HERE';
    $('.observer').hidden = false; $('.recipient-state').textContent = 'Delivery unconfirmed';
    $('.route-name').textContent = 'Zeno'; $('.route-state').textContent = 'Observer copied packet';
    $('.window-status').textContent = 'PACKET COPIED / CONTENTS NOT DECRYPTED';
  }
  setStatus('04 / YOUR ENVELOPE. HIS COPY.');
}
function settle() {
  setPhase('intercepted'); $('.skip').hidden = true;
  // Keep a single, obvious continuation at the same physical control.
  $('.primary').disabled = false; $('.primary').innerHTML = 'Replay scene <span aria-hidden="true">↺</span>';
  $('.primary').removeEventListener('click', act);
  $('.primary').addEventListener('click', () => { reset({ focus: true }); announce('Scene reset. Your invitation is ready to encrypt.'); }, { once: true });
  announce('Zeno has copied the encrypted packet. No message has been decrypted. Replay the scene or inspect what actually ran.');
  restoreActionFocus();
}
function restoreActionFocus() {
  const active = document.activeElement;
  if (returnFocus && (active === document.body || active === $('.primary') || active === $('.skip'))) $('.primary').focus({ preventScroll: true });
  returnFocus = false;
}
function select() {
  direction = Object.hasOwn(titles, location.hash.slice(1)) ? location.hash.slice(1) : 'a';
  document.body.dataset.concept = direction;
  document.title = 'Qrush — ' + titles[direction];
  document.querySelectorAll('.review-bar [data-concept]').forEach(link => {
    if (link.dataset.concept === direction) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  reset();
}
addEventListener('hashchange', select);
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { const old = phase; clearTimers(); if (old === 'encrypting') seal(); else if (['sending', 'warning', 'impact'].includes(old)) { invade(); settle(); } } });
for (const path of [character.blushing, character.surprised, rivalSprites.standing.src, rivalSprites.machine.src]) { const img = new Image(); img.src = asset(path); }
select();
