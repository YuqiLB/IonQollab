import { character, rivalSprites, storyExpressions } from './assets/manifest.js';
import { makeKeys, encode, encrypt, decrypt, modPow, inverse } from './js/rsa.js';
import { runAttack, liveAvailable, lessonBase } from './js/quantum-adapter.js';
import { primesVisual, phiVisual, keyVisual, encodingVisual, ringVisual, sequenceVisual, circuitVisual, factorVisual, pqVisual } from './js/visuals.js';

const $ = id => document.getElementById(id);
const allowed = {
  MENU: ['INTRO'],
  INTRO: ['INVITE'], INVITE: ['RSA'], RSA: ['INTERCEPT'], INTERCEPT: ['RECOVER'],
  RECOVER: ['CHOICE'], CHOICE: ['PQ'], PQ: ['RETRY'], RETRY: ['END'], END: [],
};
const replyChoices = {
  INTRO: ['I was hoping you’d still be awake.', 'So… do you always flirt in qubits?'],
  INVITE: ['Meet me on the observatory rooftop at midnight? ♥', 'Coffee at the Moon Café? Just us.'],
  RETRY: ['The quiet garden. 00:15. This time, just us. ♥', 'New plan: hot chocolate under the east dome?'],
};
let generation = 0, submission = 0, state, view = 'chat';
let followMessages = true, lastStageAction = 0, userScrollUntil = 0;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function orderOfBase(n, a) {
  for (let r = 1; r <= n; r++) if (modPow(a, r, n) === 1) return r;
  throw new Error('No modular order found within the bounded lesson input.');
}
const el = (tag, cls, content) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (content != null) node.textContent = content;
  return node;
};
function button(label, action, cls = '') {
  const b = el('button', cls, label); b.type = 'button'; b.addEventListener('click', action); return b;
}
function transition(next) {
  if (!allowed[state.phase]?.includes(next)) throw new Error('Invalid game transition ' + state.phase + ' → ' + next);
  state.phase = next; state.step = 0;
  document.body.dataset.phase = next;
  portrait(storyExpressions[next] || 'idle');
  updateChapter();
}
function updateChapter() {
  const chapter = ['MENU', 'INTRO', 'INVITE', 'RSA'].includes(state.phase) ? 1 : ['INTERCEPT', 'RECOVER'].includes(state.phase) ? 2 : 3;
  $('game').dataset.chapter = String(chapter);
}
// Warm the small native exports so expression changes do not flash or resize.
for (const expression of character.expressionsAvailable) {
  const image = new Image(character.width, character.height);
  image.src = character[expression];
}
function portrait(expression) {
  const resolved = character.expressionsAvailable.includes(expression) ? expression : 'idle';
  const image = $('portrait');
  image.src = character[resolved];
  image.alt = character.descriptions[resolved];
  image.width = character.width;
  image.height = character.height;
  image.dataset.expression = resolved;
  $('contact-avatar').src = character[resolved];
  document.querySelector('.portrait-panel').classList.toggle('romantic', ['blushing', 'happy'].includes(resolved));
}

function rivalSprite(pose) {
  const sprite = rivalSprites[pose];
  const image = el('img', 'rival-sprite rival-' + pose);
  Object.assign(image, sprite);
  return image;
}
function rivalInterruption() {
  const scene = el('aside', 'rival-interruption');
  scene.setAttribute('aria-label', 'Zeno interrupts with his quantum computer');
  const speech = el('div', 'rival-speech');
  speech.append(el('div', 'message-label', 'ZENO · UNINVITED'), el('p', '', 'A private invitation? Cute. Let’s see how private.'));
  const art = el('div', 'rival-art');
  art.append(rivalSprite('standing'), rivalSprite('machine'));
  scene.append(speech, art);
  return scene;
}
function rivalDefeat() {
  const scene = el('article', 'rival-defeat');
  const copy = el('div');
  copy.append(el('div', 'message-label', 'ZENO · DEFEATED'), el('p', '', '“Wait. My factoring trick doesn’t work on this?”'));
  scene.append(rivalSprite('fallen'), copy);
  $('messages').append(scene);
}

function appendMessage(role, content, note = '') {
  const item = el('article', 'message ' + role);
  if (role !== 'system') item.append(el('div', 'message-label', role === 'user' ? 'YOU' : role === 'rival' ? 'ZENO · UNINVITED' : 'ALICE'));
  item.append(el('div', 'message-text', content));
  if (note) item.append(el('div', 'message-note', note));
  $('messages').append(item);
  state.history.push({ role, content, note });
  if (followMessages && view === 'chat') $('messages').scrollTop = $('messages').scrollHeight;
  else $('new-messages').hidden = false;
  return item;
}
function busy(value) {
  state.busy = value; updateComposer();
  $('typing').classList.toggle('busy', value);
  $('typing').firstElementChild.textContent = value ? 'Alice is typing' : '';
}
async function speak(lines, epoch = generation) {
  busy(true);
  for (const line of lines) {
    await sleep(650);
    if (epoch !== generation) return false;
    appendMessage('alice', line);
  }
  busy(false);
  return true;
}
function updateComposer() {
  const active = ['INTRO', 'INVITE', 'RETRY'].includes(state.phase) && !state.busy;
  $('message').disabled = !active; $('send').disabled = !active || !state.selectedReply;
  $('composer').classList.toggle('inactive', !active);
  $('composer-label').textContent = state.phase === 'INVITE' ? 'MAKE IT PERSONAL · CHOOSE YOUR INVITATION' : state.phase === 'RETRY' ? 'A FRESH INVITATION · ILLUSTRATIVE PROTECTED CHANNEL' : state.phase === 'END' ? 'CONNECTION CONTINUES' : 'CHOOSE YOUR REPLY';
  $('message').placeholder = active ? 'Choose a reply above…' : state.busy ? 'Alice is typing…' : 'Continue the story using the button above.';
  $('composer-hint').textContent = active ? 'Choose a reply above, then send ↗' : state.busy ? 'A moment. She’s still here.' : 'Your conversation stays here.';
  const suggestions = replyChoices[state.phase] || [];
  $('suggestions').replaceChildren(...suggestions.map(value => {
    const b = button(value, () => {
      if (state.busy || !replyChoices[state.phase]?.includes(value)) return;
      state.selectedReply = value;
      $('message').value = value; updateCount(); $('send').disabled = false;
      for (const choice of $('suggestions').children) choice.setAttribute('aria-pressed', String(choice === b));
    });
    b.setAttribute('aria-pressed', String(state.selectedReply === value));
    b.disabled = !active; return b;
  }));
}
function focusChoices() { $('suggestions').querySelector('button:not(:disabled)')?.focus({ preventScroll: true }); }
function updateCount() { $('char-count').textContent = $('message').value.length + ' / 280'; $('compose-error').textContent = ''; }
function setActions(actions) { $('story-actions').replaceChildren(...actions.map(a => button(a.label, a.run, a.cls || 'primary'))); }
function showChat() {
  $('game').dataset.view = 'chat';
  view = 'chat'; $('stage').hidden = true; $('chat-view').hidden = false;
  if (followMessages) { $('messages').scrollTop = $('messages').scrollHeight; $('new-messages').hidden = true; }
  updateComposer();
}
function showStage() {
  $('game').dataset.view = 'stage';
  view = 'stage'; $('chat-view').hidden = true; $('stage').hidden = false;
  renderStage(); $('stage-title').focus({ preventScroll: true });
}
function markDraft(note) {
  const draft = $('messages').querySelector('[data-draft]');
  if (draft) draft.querySelector('.message-note').textContent = note;
}
async function sendMessage(event) {
  event.preventDefault();
  if (state.busy || !['INTRO', 'INVITE', 'RETRY'].includes(state.phase)) return;
  const raw = state.selectedReply;
  if (!replyChoices[state.phase]?.includes(raw)) { $('compose-error').textContent = 'Choose a reply above before sending.'; focusChoices(); return; }
  state.selectedReply = '';
  $('message').value = ''; updateCount();
  const epoch = generation;
  if (state.phase === 'INTRO') {
    appendMessage('user', raw); busy(true);
    if (!(await speak(['Message received. For the record, I’m enjoying this.', 'Let’s make a plan. Where should we meet?'], epoch))) return;
    transition('INVITE'); updateComposer(); focusChoices();
  } else if (state.phase === 'INVITE') {
    state.invitation = raw;
    const draft = appendMessage('user', raw, 'Draft · held before delivery'); draft.dataset.draft = 'true';
    busy(true);
    if (!(await speak(['Before we send your invitation, let’s encrypt it. RSA starts with two prime numbers that we use to build the encryption key.'], epoch))) return;
    transition('RSA'); updateComposer(); showStage();
  } else {
    state.retry = raw; transition('END'); updateComposer();
    appendMessage('user', raw, 'Delivered in the story · post-quantum exchange illustrated');
    appendMessage('system', 'ZENO TRIES THE OLD ATTACK\nThis attack relies on RSA’s structure. The upgraded scheme uses different mathematics. No quantum job was submitted for this retry.');
   
    if (!(await speak(['Okay. You’ve officially made the quantum researcher lose her train of thought.', 'It’s a date. I’ll bring the coffee. You bring that very distracting smile. ♥'], epoch))) return;
    portrait('happy');
    appendMessage('system', 'The first invitation is still leaked. But the next chapter belongs to the two of you.');
    const stamp = el('div', 'ending-stamp', '♥  CONNECTION CONTINUES  ♥'); $('messages').append(stamp);
    if (followMessages) $('messages').scrollTop = $('messages').scrollHeight;
    setActions([{ label: 'Play again ↺', run: restart, cls: 'rose' }, { label: 'What actually ran?', run: openAbout, cls: '' }]);
  }
}

function stageNavigation(nextLabel, next, back = null) {
  const backButton = button('← Back', () => stageAction(back)); backButton.disabled = !back; backButton.hidden = !back;
  $('stage-nav').replaceChildren(backButton, button(nextLabel, () => stageAction(next), 'primary'));
}
function stageAction(action) {
  // Prevent double-clicks on a newly rendered Next button from skipping a beat.
  const now = performance.now();
  if (!action || now - lastStageAction < 250) return;
  lastStageAction = now; action();
}
function setStep(step) { state.step = step; renderStage(); $('stage').scrollTop = 0; }
function stageBase(title, subtitle, count) {
  $('stage-title').textContent = title; $('stage-subtitle').textContent = subtitle;
  $('step-count').textContent = count;
  $('execution-controls').hidden = !['INTERCEPT', 'RECOVER'].includes(state.phase);
  $('stage-caption').textContent = ''; $('stage-nav').replaceChildren(); $('stage-body').replaceChildren();
  $('stage-body').className = 'stage-body animate';
  $('stage').classList.toggle('rival-stage', ['INTERCEPT', 'RECOVER'].includes(state.phase));
  $('skip-animation').textContent = 'Skip animation';
}
function visual(markup) { const holder = el('div', 'visual'); holder.innerHTML = markup; $('stage-body').append(holder); }
function caption(content) { $('stage-caption').textContent = content; }
function renderStage() {
  if (state.phase === 'RSA') renderRSA();
  if (state.phase === 'INTERCEPT') renderIntercept();
  if (state.phase === 'RECOVER') renderRecovery();
  if (state.phase === 'PQ') renderPQ();
}
function renderRSA() {
  const titles = ['Enter two prime numbers', 'Calculate the public modulus', 'Calculate φ(n)', 'Set the RSA exponents', 'Encode your message', 'Encrypt a message block', 'Send the encrypted packet'];
  stageBase(titles[state.step], state.step === 0 ? 'Build an RSA key to encrypt the invitation you’re about to send to Alice.' : 'RSA encryption · turning your invitation into ciphertext.', (state.step + 1) + ' / 7');
  const next = () => setStep(state.step + 1), back = state.step ? () => setStep(state.step - 1) : null;
  if (state.step === 0) {
    const form = el('form', 'prime-form'); form.noValidate = true;
    const fields = el('div', 'prime-inputs');
    ['p', 'q'].forEach(name => {
      const label = el('label', '', name + ' ='); const input = el('input');
      input.type = 'text'; input.inputMode = 'numeric'; input.id = 'prime-' + name; input.name = name; input.maxLength = 2; input.autocomplete = 'off'; input.setAttribute('aria-describedby', 'prime-help prime-error');
      input.value = state.primeDraft[name]; input.addEventListener('input', () => { state.primeDraft[name] = input.value; });
      label.append(input); fields.append(label);
    });
    const help = el('p', 'prime-help', 'Choose two distinct odd primes with p × q ≤ 63. This lesson fixes e = 3; try (3, 5), (3, 11), (3, 17), or (5, 11). The largest circuit uses 18 qubits.'); help.id = 'prime-help';
    const error = el('p', 'field-error'); error.id = 'prime-error'; error.setAttribute('role', 'alert');
    form.append(fields, help, button('Use demo values', () => { $('prime-p').value = '3'; $('prime-q').value = '5'; state.primeDraft = { p: '3', q: '5' }; error.textContent = ''; }), error);
    const validate = () => {
      try {
        const p = $('prime-p').value.trim(), q = $('prime-q').value.trim();
        if (!/^\d+$/.test(p) || !/^\d+$/.test(q)) throw new Error('Enter whole prime numbers in both fields. Try 3 and 5 to begin.');
        state.keys = makeKeys(Number(p), Number(q)); state.encoded = encode(state.invitation, state.keys.n);
        state.packet = encrypt(state.invitation, state.keys);
        state.selectedBlock = state.encoded.digits.findIndex((m, i) => state.packet.ciphertext[i] !== m);
        if (state.selectedBlock < 0) state.selectedBlock = Math.min(2, state.encoded.digits.length - 1);
        next();
      } catch (e) { error.textContent = e.message; }
    };
    form.addEventListener('submit', e => { e.preventDefault(); validate(); }); $('stage-body').append(form);
    caption('Deliberately insecure textbook RSA: tiny parameters, no production padding. Your primes stay in the game; only their public product N is sent to the quantum attack.');
    stageNavigation('Calculate n →', validate); return;
  }
  const keys = state.keys;
  if (state.step === 1) { visual(primesVisual(keys.p, keys.q, true)); caption('Multiply the two primes. The product n = ' + keys.n + ' becomes public; the two factors are meant to stay private.'); }
  if (state.step === 2) { visual(phiVisual(keys)); caption('φ(n) counts numbers below n that share no factor with it. For two distinct primes, φ(n) = (p − 1)(q − 1) = ' + keys.phi + '.'); }
  if (state.step === 3) { visual(keyVisual(keys)); caption('This lesson fixes e = 3. The private exponent d solves e × d ≡ 1 (mod φ(n)). These tiny textbook values are deliberately insecure; the disclaimer explains the limits.'); }
  if (state.step === 4) {
    const byte = new TextEncoder().encode(state.invitation)[0]; visual(encodingVisual(byte, state.encoded.digits.slice(0, state.encoded.width), keys.n));
    caption('Your actual first UTF-8 byte is ' + byte + '. Each byte uses ' + state.encoded.width + ' fixed-width base-' + keys.n + ' digits, including leading zeroes. Unicode round-trips too.');
  }
  if (state.step === 5) {
    const m = state.encoded.digits[state.selectedBlock], c = state.packet.ciphertext[state.selectedBlock]; visual(ringVisual(m, keys.n, keys.e));
    caption('Selected block #' + (state.selectedBlock + 1) + ': m = ' + m + '. Raise m to the public exponent and keep the remainder: c = m^' + keys.e + ' mod ' + keys.n + ' = ' + c + '. The path connects those residues.');
  }
  if (state.step === 6) {
    $('stage-body').append(el('div', 'math-equation', 'c = m^' + keys.e + ' mod ' + keys.n), el('p', 'math-small', state.packet.byteLength + ' UTF-8 bytes · ' + state.packet.ciphertext.length + ' encrypted blocks'));
    const packet = el('div', 'packet-preview', state.packet.ciphertext.slice(0, 54).join(' · ') + (state.packet.ciphertext.length > 54 ? ' …' : '')); $('stage-body').append(packet);
    $('stage-body').append(el('p', 'math-small', 'Public metadata: n = ' + keys.n + ' · e = ' + keys.e + ' · ' + state.packet.width + ' digits / byte'));
    caption('The full packet contains every encrypted block and its decoding metadata. Someone on the channel can copy the envelope without knowing what it says.');
  }
  stageNavigation(state.step === 6 ? 'Send encrypted packet ↗' : ['','','Calculate φ(n) →','Choose the exponent →','Encode my message →','Encrypt a block →','Prepare the packet →'][state.step + 1] || 'Next →', state.step === 6 ? intercept : next, back);
}
function intercept() {
  if (state.phase !== 'RSA' || !state.packet) return;
  markDraft('Toy RSA packet sent · copied by an observer');
  state.intercepted = structuredClone(state.packet);
  transition('INTERCEPT');
  appendMessage('system', 'PACKET COPIED · n = ' + state.packet.n + ', e = ' + state.packet.e + ' and the ciphertext are visible on the channel.');
  appendMessage('rival', 'A private invitation? Cute. Let’s see how private.');
  renderStage();
  $('stage').scrollTop = 0;
}
function renderIntercept() {
  stageBase('An uninvited observer.', 'Cas copied the ciphertext. Copying it is easy. Reading it takes the next step.', '02 / THE RIVAL’S VIEW', 'INTERCEPTION');
  const rival = el('div', 'rival-avatar'); rival.append(el('div', 'rival-face', '>_'), el('p', '', '“If I factor ' + state.intercepted.n + ', I can recover the toy key. And maybe get to your date first.”')); $('stage-body').append(rival);
  if (state.step === 0 && state.job === 'idle') {
    const base = lessonBase(state.intercepted.n);
    visual(sequenceVisual(state.intercepted.n, base, orderOfBase(state.intercepted.n, base)));
    caption('The public modulus is N = ' + state.intercepted.n + '. For a = ' + base + ', modular powers repeat. Quantum order finding estimates that repetition; at this tiny size we can also see it directly.');
    stageNavigation('See the quantum circuit →', () => setStep(1));
    return;
  }
  const base = lessonBase(state.intercepted.n);
  visual(circuitVisual(state.intercepted.n, base));
  const status = el('div', 'job-status ' + state.job);
  status.id = 'job-status'; status.setAttribute('role', 'status');
  status.textContent = state.job === 'idle' ? (state.mode === 'demo' ? 'Illustrative demo—no quantum job executed. Run the sequence with deterministic sample measurements.' : 'Live Qollab: select a simulator with Select QPU. ' + (liveAvailable() ? 'Python adapter connected.' : 'Python adapter is not yet connected.')) :
    state.job === 'submitting' ? 'Submitting the quantum job…' : state.job === 'waiting' ? (state.mode === 'demo' ? 'Preparing labeled sample measurements…' : 'Waiting for Qollab’s actual result. The interface remains available.') :
    state.job === 'success' ? (state.result.source === 'sample' ? 'Sample measurements processed. ' : 'Live measurements received. ') + 'A candidate period passed mathematical verification.' : state.job === 'inconclusive' ? 'Measurements returned, but no useful period was recovered. Nothing has been decrypted.' : state.error;
  if (state.job === 'error' || state.job === 'inconclusive') {
    if (state.mode === 'live') status.append(button('Explicitly switch to illustrative demo', () => { if (!['error', 'inconclusive'].includes(state.job)) return; changeMode('demo'); renderStage(); }, 'quiet'));
  }
  if (state.job === 'inconclusive' && state.result) status.append(button('Inspect returned measurements', () => { const detail = el('pre', 'packet-preview', JSON.stringify(state.result.distribution, null, 2)); detail.setAttribute('aria-label', state.result.distribution_kind); status.append(detail); }, 'quiet'));
  $('stage-body').append(status);
  caption('Fictional future machine; tiny simulator demonstration. The attack receives public N = ' + state.intercepted.n + ' and a = ' + base + ', not your selected prime factors. It does not break production RSA, AES, or every end-to-end scheme.');
  if (state.job === 'success') stageNavigation('Inspect the measurements →', () => { transition('RECOVER'); renderStage(); });
  else {
    const b = button(['waiting', 'submitting'].includes(state.job) ? 'Job in progress…' : state.job === 'idle' ? 'Run quantum attack →' : 'Retry quantum attack →', launchAttack, 'primary rose');
    b.disabled = ['waiting', 'submitting'].includes(state.job); $('stage-nav').replaceChildren(b);
  }
}
async function launchAttack() {
  if (state.phase !== 'INTERCEPT' || ['submitting', 'waiting', 'success'].includes(state.job)) return;
  const epoch = generation, ticket = ++submission; const mode = state.mode;
  state.error = ''; state.result = null; state.recoveredText = null;
  try {
    const result = await runAttack({ mode, modulus: state.intercepted.n, base: lessonBase(state.intercepted.n), onStatus: value => { if (epoch !== generation || ticket !== submission) return; state.job = value; $('execution-mode').disabled = true; if (view === 'stage') renderStage(); } });
    if (epoch !== generation || ticket !== submission) return;
    state.result = result; state.job = result.status;
    if (result.status === 'success') {
      // Recovery uses only the copied public packet and factors verified from measurements.
      const [p, q] = result.factors, phi = (p - 1) * (q - 1);
      const d = inverse(state.intercepted.e, phi);
      state.recoveredText = decrypt(state.intercepted, d);
      state.recoveredKey = { p, q, n: p * q, phi, e: state.intercepted.e, d };
    }
  } catch (error) {
    if (epoch !== generation || ticket !== submission) return;
    state.job = 'error'; state.error = error.message || String(error); state.recoveredText = null;
  } finally {
    if (epoch === generation && ticket === submission) { $('execution-mode').disabled = state.job === 'success'; updateModeLabel(); if (view === 'stage') renderStage(); }
  }
}
function measurements() {
  const { distribution, distribution_kind: kind, source, total } = state.result;
  $('stage-body').append(el('div', 'result-label', source === 'sample' ? 'SAMPLE MEASUREMENTS · NO QUANTUM JOB' : 'ACTUAL RETURNED MEASUREMENTS'));
  const chart = el('div', 'measurements');
  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(x => x[1]));
  for (const [key, value] of entries.slice(0, 8)) {
    const col = el('div', 'measurement'); const bar = el('div', 'bar');
    bar.style.height = (value / max * 95) + 'px';
    col.append(el('span', '', kind === 'counts' ? value : (value * 100).toFixed(1) + '%'), bar, el('span', '', key));
    col.setAttribute('aria-label', key + ': ' + value + ' ' + kind); chart.append(col);
  }
  $('stage-body').append(chart, el('p', 'math-small', kind === 'counts' ? total + ' measured shots · binary phase-register outcomes' : 'Returned probabilities · not integer shot counts'));
  const details = el('details'); details.append(el('summary', 'quiet', 'All returned values (' + kind + ')'), el('pre', 'packet-preview', JSON.stringify(distribution, null, 2))); $('stage-body').append(details);
}
function renderRecovery() {
  const titles = ['Read the measurements', 'Verify the period', 'Recover the prime factors', 'Recover the private key', 'Read the decrypted message'];
  stageBase(titles[state.step], state.result.source === 'sample' ? 'Illustrative demo—no quantum job executed. Classical recovery is computed.' : 'Live Qollab measurements. Classical recovery is computed in this browser.', (state.step + 1) + ' / 5');
  if (state.step === 0) { measurements(); caption('Read each bitstring as y / 2ᵗ. Continued fractions propose a period; modular arithmetic must verify it. A returned job alone is not a successful attack.'); }
  if (state.step === 1) { visual(sequenceVisual(state.intercepted.n, state.result.base, state.result.period)); caption('The returned phases yield the verified candidate r = ' + state.result.period + '. Checking ' + state.result.base + '^r mod ' + state.intercepted.n + ' and every smaller positive exponent confirms the order.'); }
  if (state.step === 2) { visual(factorVisual(state.result.period, state.result.factors, state.intercepted.n, state.result.base)); caption('The even period gives gcd(a^(r/2) − 1, N) and gcd(a^(r/2) + 1, N). These recover ' + state.result.factors.join(' and ') + ', whose product is the intercepted modulus.'); }
  if (state.step === 3) {
    visual(keyVisual(state.recoveredKey));
    const c = state.intercepted.ciphertext[state.selectedBlock], m = modPow(c, state.recoveredKey.d, state.intercepted.n);
    caption('From the recovered factors: φ = ' + state.recoveredKey.phi + ', d = ' + state.recoveredKey.d + '. Selected block: ' + c + '^' + state.recoveredKey.d + ' mod ' + state.intercepted.n + ' = ' + m + '. Decrypt every block, restore the fixed-width bytes, then decode UTF-8.');
  }
  if (state.step === 4) {
    if (state.job !== 'success' || typeof state.recoveredText !== 'string') throw new Error('Recovery required before reveal.');
    $('stage-body').append(el('div', 'result-label', 'ACTUAL INTERCEPTED MESSAGE · DECRYPTED'), el('blockquote', 'leak-quote', state.recoveredText));
    caption('Zeno recovered your actual words from the ciphertext. The quantum sample/live distinction changes where the measurements came from; the toy decryption is real.');
  }
  stageNavigation(state.step === 4 ? 'Return to the conversation →' : 'Next →', state.step === 4 ? consequence : () => setStep(state.step + 1), state.step ? () => setStep(state.step - 1) : null);
}
async function consequence() {
  if (state.phase !== 'RECOVER' || state.recoveredText == null) return;
  const epoch = generation; transition('CHOICE');
  setActions([]); showChat();
  const excerpt = [...state.recoveredText].slice(0, 110).join('') + ([...state.recoveredText].length > 110 ? '…' : '');
  appendMessage('rival', '“' + excerpt + '”\nOops. Did I just read your invitation out loud on the observatory intercom?');
  markDraft('Leaked by Zeno · this cannot be undone');
  $('messages').querySelector('[data-draft]')?.classList.add('leaked');
  appendMessage('system', 'The intercom crackles. Everyone turns. Your private invitation is now the entire observatory’s business.');
  if (!(await speak(['Zeno. Off the intercom. Now.', 'I still want that date. But we need a better envelope. The weakness was in the key mathematics, not your message.'], epoch))) return;
  choiceActions();
}
function choiceActions() {
  setActions([{ label: 'Change only my message', cls: '', run: async () => {
    if (state.phase !== 'CHOICE' || state.busy) return;
    setActions([]); const epoch = generation;
    appendMessage('user', 'What if I just change the wording?');
    if (await speak(['New words, same vulnerable key. Zeno could factor the same RSA modulus again. Let’s change how we establish the key.'], epoch)) choiceActions();
  } }, { label: 'Upgrade the protection →', run: () => {
    if (state.phase !== 'CHOICE' || state.busy) return;
    appendMessage('user', 'Let’s upgrade the protection.'); transition('PQ'); showStage();
  } }]);
}
function renderPQ() {
  const titles = ['Receive Alice’s ML-KEM public key', 'Encapsulate a shared secret', 'Recover the same shared secret', 'Protect the message with a symmetric key'];
  const captions = [
    'Alice provides an ML-KEM public key, authenticated as hers. Her decapsulation key stays private. This scheme uses different mathematics from RSA factoring.',
    'You encapsulate: the public key produces a shared secret S and encapsulation data Cₖₑₘ. Only Cₖₑₘ crosses the channel. The shared secret is not sent.',
    'Alice decapsulates Cₖₑₘ with her private key to recover the same S. Matching tokens illustrate that agreement; they are not computed cryptographic secrets.',
    'Both sides derive a symmetric key K from S. Authenticated encryption then protects the text and detects tampering. ML-KEM establishes a secret; it does not encrypt chat text directly.',
  ];
  stageBase(titles[state.step], 'Illustrative post-quantum exchange · no ML-KEM or authenticated encryption is executed.', (state.step + 1) + ' / 4');
  visual(pqVisual(state.step)); caption(captions[state.step]);
  stageNavigation(state.step === 3 ? 'Choose a new invitation ♥' : 'Next →', state.step === 3 ? retryConversation : () => setStep(state.step + 1), state.step ? () => setStep(state.step - 1) : null);
}
async function retryConversation() {
  if (state.phase !== 'PQ') return;
  const epoch = generation; transition('RETRY'); setActions([]); showChat();
  appendMessage('system', 'ILLUSTRATIVE POST-QUANTUM EXCHANGE COMPLETE\nThe RSA factoring attack no longer applies to this key-establishment scheme. This is not a proof that every attack is impossible.');
  rivalDefeat();
  if (!(await speak(['Better mathematics. Same butterflies.', 'The first invitation is still out there. Let’s make a new plan—somewhere the intercom can’t follow us.'], epoch))) return;
  updateComposer(); focusChoices();
}
function changeMode(mode) {
  if (['submitting', 'waiting', 'success'].includes(state.job)) return;
  state.mode = mode; state.job = 'idle'; state.error = ''; state.result = null;
  $('execution-mode').value = mode; updateModeLabel();
  if (view === 'stage' && state.phase === 'INTERCEPT') renderStage();
}
function updateModeLabel() {
  $('mode-label').textContent = state.mode === 'demo' ? 'Illustrative demo—no quantum job executed.' : 'Live Qollab · ' + (liveAvailable() ? 'Python adapter connected' : 'Python connection required');
}
function openAbout() {
  const report = el('div', 'run-report');
  const description = state.result ? 'This playthrough: ' + (state.result.source === 'sample' ? 'sample measurements (no quantum job)' : 'live Qollab measurements') + '; job status: ' + state.job + '.' : 'This playthrough: ' + (state.job === 'error' ? 'the attack failed. No successful quantum result.' : ['waiting', 'submitting'].includes(state.job) ? 'the attack is still pending.' : 'no attack completed yet.');
  report.append(el('p', '', description), el('p', '', 'Dialogue uses scripted reply choices. No messages are sent to a server or stored persistently.'));
  $('run-report').replaceChildren(report); $('about-dialog').showModal();
}
export async function restart() {
  const pending = state && ['waiting', 'submitting'].includes(state.job) && state.mode === 'live';
  generation++; submission++;
  state = { phase: 'MENU', step: 0, busy: false, selectedReply: '', mode: 'demo', job: 'idle', history: [], primeDraft: { p: '', q: '' }, invitation: '', retry: '', result: null, packet: null, error: '', recoveredText: null };
  lastStageAction = 0; followMessages = true; userScrollUntil = 0;
  $('messages').replaceChildren();
  $('message').value = ''; updateCount(); $('new-messages').hidden = true;
  $('execution-mode').value = 'demo'; $('execution-mode').disabled = false; updateModeLabel();
  $('game').classList.remove('entering');
  portrait('idle'); document.body.dataset.phase = 'MENU'; updateChapter(); setActions([]);
  view = 'menu'; $('game').dataset.view = 'menu';
  $('stage').hidden = true; $('chat-view').hidden = false;
  document.querySelector('.conversation-panel').inert = true;
  $('start-screen').hidden = false;
  busy(false);
  if (pending) appendMessage('system', 'Story restarted. A submitted remote job may still finish; restarting this interface does not cancel it. Its result will be ignored.');
  $('start-game').focus({ preventScroll: true });
}
async function startGame() {
  if (state.phase !== 'MENU') return;
  const epoch = generation;
  transition('INTRO');
  $('start-screen').hidden = true;
  document.querySelector('.conversation-panel').inert = false;
  showChat();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $('game').classList.add('entering');
    // Generation guard also covers replay while the entrance is still running.
    setTimeout(() => { if (generation === epoch) $('game').classList.remove('entering'); }, 1000);
  }
  if (await speak(['Hey, Bob. Still awake? I was running out of excuses to stay in the lab.', 'The trapped ions can wait. I’d rather get to know you.', 'Want to continue this somewhere a little more private?'], epoch)) focusChoices();
}

// Fit the visible viewport, including a phone's on-screen keyboard.
function fitScene() {
  document.documentElement.style.setProperty('--scene-height', Math.round(window.visualViewport?.height || window.innerHeight) + 'px');
}
window.addEventListener('resize', fitScene);
window.visualViewport?.addEventListener('resize', fitScene);
fitScene();

$('start-game').addEventListener('click', startGame);
$('composer').addEventListener('submit', sendMessage);
for (const event of ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'keydown']) {
  $('messages').addEventListener(event, () => { userScrollUntil = performance.now() + 1000; }, { passive: true });
}
$('messages').addEventListener('scroll', () => {
  if (view !== 'chat' || performance.now() > userScrollUntil) return;
  const m = $('messages'); followMessages = m.scrollHeight - m.scrollTop - m.clientHeight < 45;
  if (followMessages) $('new-messages').hidden = true;
});
new ResizeObserver(() => {
  if (followMessages && view === 'chat') { $('messages').scrollTop = $('messages').scrollHeight; $('new-messages').hidden = true; }
}).observe($('messages'));
$('new-messages').addEventListener('click', () => { followMessages = true; $('messages').scrollTop = $('messages').scrollHeight; $('new-messages').hidden = true; });
$('replay-animation').addEventListener('click', () => { $('stage-body').classList.remove('animate', 'still'); void $('stage-body').offsetWidth; $('stage-body').classList.add('animate'); $('skip-animation').textContent = 'Skip animation'; });
$('skip-animation').addEventListener('click', () => { $('stage-body').classList.add('still'); $('skip-animation').textContent = 'Motion skipped ✓'; });
$('about-button').addEventListener('click', openAbout);
$('close-about').addEventListener('click', () => $('about-dialog').close());
$('execution-mode').addEventListener('change', e => changeMode(e.target.value));
restart();
