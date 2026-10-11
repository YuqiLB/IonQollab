import { character, rivalSprites, storyExpressions } from './assets/manifest.js';
import { balconyReplies, balconyBeat } from './js/opening.js';
import { dateLocations, puzzleMessages } from './js/story-scenes.js';
import { openFromMessage, closePopup, cancelWindowMotion } from './js/window-motion.js';
import { makeKeys, encode, encrypt, decrypt, inverse } from './js/rsa.js';
import { runAttack, liveAvailable, lessonBase } from './js/quantum-adapter.js';

import { moveWindows, resetMotion } from './js/desktop-motion.js';
import { uiText } from './js/ui-text.js';
import { pqVisual } from './js/visuals.js';
import { revealWords, typingDelay, readingGap } from './js/story-pacing.js';
import { mountStoryMotion, flyPacket } from './js/story-motion.js';
let activeMotion = null, introReveal = null, dialogueReveal = null, sceneHandoff = null;
let handoffTimers = [];

const $ = id => document.getElementById(id);
const allowed = {
  MENU: ['BALCONY'], BALCONY: ['RETURN'], RETURN: ['INTRO'],
  INTRO: ['INVITE'], INVITE: ['RSA'], RSA: ['INTERCEPT'], INTERCEPT: ['RECOVER'],
  RECOVER: ['CHOICE'], CHOICE: ['PQ'], PQ: ['RETRY'], RETRY: ['DELIVERED'],
  DELIVERED: ['MEET'], MEET: ['END'], END: [],
};
const replyChoices = {
  INTRO: ['That was my favourite part of the shift.', 'So… do you always flirt in qubits?'],
  INVITE: ['Meet me on the observatory rooftop at midnight? ♥', 'Coffee at the Moon Café? Just us.'],
  RETRY: dateLocations.map(location => location.invitation),
};
let generation = 0, submission = 0, state, view = 'chat';
let followMessages = true, lastStageAction = 0, userScrollUntil = 0;
let puzzleChatTimer = null, puzzleChatQueue = [];
const taskCards = new Map();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const el = (tag, cls, content) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (content != null) uiText(node, content);
  return node;
};
function button(label, action, cls = '') {
  const b = el('button', cls, label); b.type = 'button'; b.addEventListener('click', action); return b;
}
function transition(next) {
  if (!allowed[state.phase]?.includes(next)) throw new Error('Invalid game transition ' + state.phase + ' → ' + next);
  cancelPuzzleChatter();
  state.phase = next; state.step = 0;
  document.body.dataset.phase = next;
  portrait(storyExpressions[next] || 'idle');
  updateChapter();
}
function updateChapter() {
  const chapter = ['MENU', 'BALCONY', 'RETURN', 'INTRO', 'INVITE', 'RSA'].includes(state.phase) ? 1 : ['INTERCEPT', 'RECOVER'].includes(state.phase) ? 2 : 3;
  $('game').dataset.chapter = String(chapter);
}
// Warm the small native exports so expression changes do not flash or resize.
for (const expression of character.expressionsAvailable) {
  const image = new Image(character.width, character.height);
  image.src = character[expression];
}
for (const sprite of Object.values(rivalSprites)) {
  const image = new Image(sprite.width, sprite.height); image.src = sprite.src;
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
  speech.append(el('div', 'message-label', 'ZENO · UNINVITED'), el('p', '', 'A private invitation? Cute.'));
  const art = el('div', 'rival-art');
  art.append(rivalSprite('standing'), rivalSprite('machine'));
  const banner = el('div', 'rival-banner'); banner.append(el('h3', '', 'ZENO INTERCEPTS!'));
  scene.append(banner, speech, art);
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
  if (followMessages && ['chat', 'stage'].includes(view)) $('messages').scrollTop = $('messages').scrollHeight;
  else $('new-messages').hidden = false;
  return item;
}
function busy(value) {
  state.busy = value; if (!value) state.replyTyping = false; updateComposer(); syncTask();
  renderTyping();
}
function renderTyping() {
  const value = state.replyTyping || state.chatterTyping;
  $('typing').classList.toggle('busy', value);
  $('typing').firstElementChild.textContent = value ? 'Alice is typing' : '';
}
function cancelPuzzleChatter() {
  clearTimeout(puzzleChatTimer); puzzleChatTimer = null; puzzleChatQueue = [];
  if (state) { state.chatterTyping = false; renderTyping(); }
}
function queuePuzzleMessage() {
  const key = state.phase + ':' + state.step;
  if (puzzleMessages[key] && !state.puzzleNotes.has(key) && !puzzleChatQueue.includes(key)) puzzleChatQueue.push(key);
  if (puzzleChatTimer !== null || !puzzleChatQueue.length) return;
  const epoch = generation, phase = state.phase;
  state.chatterTyping = true; renderTyping();
  puzzleChatTimer = setTimeout(() => {
    puzzleChatTimer = null;
    if (epoch !== generation || state.phase !== phase || view !== 'stage') return;
    const next = puzzleChatQueue.shift();
    state.puzzleNotes.add(next);
    const message = appendMessage('alice', puzzleMessages[next]);
    message.dataset.puzzleNote = next;
    state.chatterTyping = false; renderTyping();
    if (puzzleChatQueue.length) queuePuzzleMessage();
  }, typingDelay(puzzleMessages[puzzleChatQueue[0]]) + 500);
}
async function speak(lines, epoch = generation) {
  busy(true);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (index) await sleep(readingGap(lines[index-1]));
    if (epoch !== generation) return false;
    state.replyTyping = true; renderTyping();
    await sleep(typingDelay(line));
    if (epoch !== generation) return false;
    state.replyTyping = false; renderTyping();
    appendMessage('alice', line);
  }
  busy(false);
  return true;
}
function updateComposer() {
  const active = ['INTRO', 'INVITE', 'RETRY'].includes(state.phase) && !state.busy;
  $('message').disabled = !active; $('send').disabled = !active || !state.selectedReply;
  $('composer').classList.toggle('inactive', !active);
  $('puzzle-chat-lock').hidden = view !== 'stage';
  $('composer-label').textContent = state.phase === 'INVITE' ? 'MAKE IT PERSONAL · CHOOSE YOUR INVITATION' : state.phase === 'RETRY' ? 'A FRESH INVITATION · ILLUSTRATIVE PROTECTED CHANNEL' : state.phase === 'DELIVERED' ? 'IT’S A DATE' : 'CHOOSE YOUR REPLY';
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
function currentTask() {
  return { RSA: 'rsa', INTERCEPT: 'attack', RECOVER: 'attack', CHOICE: 'pq', PQ: 'pq' }[state.phase];
}
function offerTask(id, title, description, open, role = 'alice') {
  if (taskCards.has(id)) return;
  const item = el('article', 'message task-message ' + role);
  item.append(el('div', 'message-label', role === 'rival' ? 'ZENO · INTERCEPTED PACKET' : 'ALICE · SHARED WITH YOU'));
  const card = button('', () => { if (!state.busy && !card.disabled && currentTask() === id) open(card); }, 'task-attachment');
  card.dataset.task = id;
  card.setAttribute('aria-controls', id === 'attack' ? 'zeno-popup' : 'puzzle-window');
  const icon = el('span', 'task-icon', id === 'attack' ? '!' : '◇'); icon.setAttribute('aria-hidden', 'true');
  const copy = el('span', 'task-copy');
  copy.append(el('strong', '', title), el('span', 'task-description', description), el('span', 'task-status', 'Open attachment ↗'));
  const arrow = el('span', 'task-arrow', '↗'); arrow.setAttribute('aria-hidden', 'true');
  card.append(icon, copy, arrow); item.append(card); $('messages').append(item);
  taskCards.set(id, { card, title });
  syncTask();
  if (followMessages) $('messages').scrollTop = $('messages').scrollHeight;
  else $('new-messages').hidden = false;
}
function finishTask(id, text, compromised = false) {
  const entry = taskCards.get(id);
  if (!entry) return;
  entry.card.disabled = true;
  entry.card.dataset.state = compromised ? 'compromised' : 'complete';
  entry.card.setAttribute('aria-expanded', 'false');
  entry.card.querySelector('.task-status').textContent = text;
}
function syncTask() {
  const id = currentTask(), entry = taskCards.get(id);
  if (!entry || entry.card.disabled) return;
  const total = null;
  const progress = total ? ` · ${state.step + 1}/${total}` : '';
  const open = id === 'attack' ? $('zeno-popup').open && !state.zenoDismissed : view === 'stage' && !state.puzzleClosed;
  const status = state.phase === 'CHOICE' ? 'Open Alice’s attachment ↗' : open ? 'Open on your desktop' + progress : (entry.opened ? 'Resume task' : 'Open task') + progress + ' ↗';
  entry.card.querySelector('.task-status').textContent = status;
  entry.card.setAttribute('aria-expanded', String(open));
  entry.card.setAttribute('aria-disabled', String(state.busy));
}
function updateWindowDock() {
  const atDesk = ['chat', 'stage'].includes(view);
  $('game').classList.toggle('chat-closed', state.chatClosed);
  $('game').classList.toggle('puzzle-closed', state.puzzleClosed);
  $('conversation-window').hidden = state.chatClosed;
  $('puzzle-window').hidden = view !== 'stage' || state.puzzleClosed;
  $('restore-chat').hidden = !atDesk || !state.chatClosed;
  $('restore-puzzle').hidden = view !== 'stage' || !state.puzzleClosed;
  $('restore-puzzle').textContent = state.phase === 'PQ' ? 'Resume protection upgrade ↗' : 'Resume encryption ↗';
  $('restore-zeno').hidden = !atDesk || !state.zenoDismissed;
  $('window-dock').hidden = [...$('window-dock').children].every(control => control.hidden);
  $('game').classList.toggle('has-closed-windows', !$('window-dock').hidden);
  const resume = $('messages').querySelector('.pending-resume');
  if (resume) resume.hidden = !state.puzzleClosed;
  syncTask();
}
function restoreChat() {
  moveWindows(() => { state.chatClosed = false; updateWindowDock(); });
  $('messages').focus({ preventScroll: true });
}
function restorePuzzle() {
  activeMotion?.suspend('window', false);
  if (!['RSA', 'PQ', 'INTERCEPT', 'RECOVER'].includes(state.phase)) return;
  if (state.puzzleClosed) {
    cancelWindowMotion();
    moveWindows(() => { state.puzzleClosed = false; updateWindowDock(); }, taskCards.get(currentTask())?.card);
  }
  if (['RSA', 'PQ'].includes(state.phase)) { queuePuzzleMessage(); $('stage-title').focus({ preventScroll: true }); }
  else $('inspect-interception').focus({ preventScroll: true });
}
function minimizeTask() {
  if (view !== 'stage' || $('zeno-popup').open) return;
  activeMotion?.suspend('window', true);
  cancelWindowMotion(); cancelPuzzleChatter();
  moveWindows(() => { state.puzzleClosed = true; updateWindowDock(); });
  $('restore-puzzle').focus({ preventScroll: true });
}
function showChat() {
  stopStoryMotion();
  cancelPuzzleChatter(); cancelWindowMotion();
  moveWindows(() => {
    $('game').dataset.view = 'chat';
    view = 'chat'; $('puzzle-window').hidden = true; $('stage').hidden = true; $('chat-view').hidden = false;
    $('puzzle-window').append($('stage')); $('encryption-summary').hidden = true;
    state.chatClosed = false; state.puzzleClosed = false; state.zenoDismissed = false; updateWindowDock();
  });
  if (followMessages) { $('messages').scrollTop = $('messages').scrollHeight; $('new-messages').hidden = true; }
  updateComposer(); syncTask();
}
function showStage(source = null) {
  if (['INTERCEPT', 'RECOVER'].includes(state.phase)) return openZeno();
  if (view === 'stage') return restorePuzzle();
  const entry = taskCards.get(currentTask());
  if (entry) entry.opened = true;
  const sourceRect = source?.querySelector('.message-text')?.getBoundingClientRect();
  moveWindows(() => {
    $('game').dataset.view = 'stage';
    view = 'stage'; $('chat-view').hidden = false; $('stage').hidden = false; $('puzzle-window').hidden = false;
    $('puzzle-window').append($('stage')); $('encryption-summary').hidden = true;
    state.puzzleClosed = false; updateWindowDock();
  }, sourceRect ? null : source);
  $('message-context').hidden = false;
  uiText($('pending-message'), state.phase === 'RSA' ? state.invitation : source?.querySelector('.message-text')?.textContent || 'Let’s upgrade the protection.');
  $('message-context-label').textContent = state.phase === 'RSA' ? 'YOUR PENDING INVITATION' : 'A NEW ENVELOPE';
  $('message-context-status').textContent = state.phase === 'RSA' ? 'Encrypting… Complete the steps below to send.' : 'Illustrative protection upgrade · then choose a new invitation.';
  setActions([]); updateComposer();
  renderStage(); $('stage-title').focus({ preventScroll: true });
  openFromMessage($('puzzle-window'), sourceRect, $('pending-message'), $('pending-message').textContent);
}
function markDraft(note) {
  const draft = $('messages').querySelector('[data-draft]');
  if (draft) { draft.querySelector('.message-note').textContent = note; draft.classList.remove('pending'); draft.dataset.delivery = 'sent'; }
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
    const draft = appendMessage('user', raw, 'Encrypting…'); draft.dataset.draft = 'true'; draft.dataset.delivery = 'pending'; draft.classList.add('pending');
    const note = draft.querySelector('.message-note'); note.setAttribute('role', 'status');
    const resume = button('Continue encryption ↗', restorePuzzle, 'pending-resume'); resume.hidden = true; note.append(resume);
    transition('RSA'); updateComposer();
    if (!(await speak(['Let’s keep this between us. I sent you a little key builder—choose two primes to lock your invitation.'], epoch))) return;
    offerTask('rsa', 'Lock our invitation', 'Choose two primes → build a key → send the encrypted message.', () => restorePuzzle());
    await sleep(650);
    if (epoch !== generation || state.phase !== 'RSA') return;
    showStage(draft);
    taskCards.get('rsa').opened = true;
  } else {
    state.retry = raw;
    state.dateLocation = dateLocations.find(location => location.invitation === raw).id;
    transition('DELIVERED'); updateComposer();
    appendMessage('user', raw, 'Delivered in the story · post-quantum exchange illustrated').dataset.protected = 'true';
    appendMessage('system', 'ZENO TRIES THE OLD ATTACK\nThis attack relies on RSA’s structure. The upgraded scheme uses different mathematics. No quantum job was submitted for this retry.');
   
    if (!(await speak(['Okay. You’ve officially made the quantum researcher lose her train of thought.', selectedDate().confirmation], epoch))) return;
    portrait('happy');
    appendMessage('system', 'The first invitation is still leaked. But the next chapter belongs to the two of you.');
    if (followMessages) $('messages').scrollTop = $('messages').scrollHeight;
    setActions([{ label: 'Meet Alice ↗', run: startMeeting, cls: 'rose' }]);
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
function setStep(step) { state.step = step; renderStage(); $('stage').scrollTop = 0; $('stage-title').focus({ preventScroll: true }); }
function stageBase(title, subtitle, count) {
  stopStoryMotion();
  $('stage').classList.remove('cinematic-stage');
  $('pause-animation').hidden = true; $('replay-animation').hidden = false; $('skip-animation').hidden = false;
  $('replay-animation').disabled = false; $('skip-animation').disabled = false;
  $('stage-title').textContent = title; $('stage-subtitle').textContent = subtitle;
  $('step-count').textContent = count;
  $('execution-controls').hidden = state.phase !== 'INTERCEPT' || state.step === 0;
  $('stage').dataset.step = state.phase.toLowerCase() + '-' + state.step;
  $('stage-caption').textContent = ''; $('stage-nav').replaceChildren(); $('stage-body').replaceChildren();
  $('stage-body').className = 'stage-body animate';
  $('stage').classList.toggle('rival-stage', ['INTERCEPT', 'RECOVER'].includes(state.phase));
  $('skip-animation').textContent = 'Skip';
}
function visual(markup, compact = []) {
  const holder = el('div','visual'); holder.innerHTML = markup;
  const small = el('div','compact-visual');
  compact.forEach(line => small.append(el('div','',line)));
  holder.append(small); $('stage-body').append(holder);
}
function caption(content, brief = content) { state.explanation = content; $('stage-caption').textContent = brief; }
function renderStage() {
  if (state.renderedPhase !== state.phase) $('stage').scrollTop = 0;
  if (['INTERCEPT', 'RECOVER'].includes(state.phase)) $('zeno-title').textContent = state.phase === 'INTERCEPT' ? 'ZENO / PACKET INTERCEPTED' : 'ZENO / THE COPIED PACKET';
  else $('puzzle-window-title').textContent = 'Qrush / ' + (state.phase === 'RSA' ? 'encrypt your invitation' : 'new protection');
  if (state.phase === 'RSA') renderRSA();
  if (state.phase === 'INTERCEPT') renderIntercept();
  if (state.phase === 'RECOVER') renderRecovery();
  if (state.phase === 'PQ') renderPQ();
  state.renderedPhase = state.phase; state.stageDirty = false;
  syncTask(); queuePuzzleMessage();
}
function stopStoryMotion() { activeMotion?.destroy(); activeMotion = null; }
function beginStoryMotion(kind, data, complete) {
  const epoch = generation;
  $('stage').classList.add('cinematic-stage');
  $('pause-animation').hidden = false;
  $('stage-nav').replaceChildren();
  activeMotion = mountStoryMotion($('stage-body'), {
    kind, data, getResult: () => ({result:state.result,text:state.recoveredText}),
    onCaption: text => caption(text),
    onProgress: (paused, done) => {
      const label = paused ? 'Resume' : 'Pause';
      if ($('pause-animation').textContent !== label) $('pause-animation').textContent = label;
      $('pause-animation').disabled = done || ['error','inconclusive'].includes(state.job);
    },
    onComplete: () => { if (epoch === generation) { $('pause-animation').disabled = true; complete(); } },
  });
}
function encryptionReady() {
  if (state.phase !== 'RSA') return;
  state.motionReady = true;
  stageNavigation('Send to Alice ↗', intercept, () => setStep(0));
  $('step-count').textContent = 'Ready to send';
}
function renderRSA() {
  stageBase(state.step === 0 ? 'Keep this between us.' : 'An invitation, under lock.', 'Toy RSA · deliberately tiny keys', '');
  $('stage').classList.add('cinematic-stage');
  if (state.step === 0) { $('pause-animation').hidden = true; $('replay-animation').hidden = true; $('skip-animation').hidden = true; }
  if (state.step === 0) {
    const form = el('form', 'prime-form'); form.noValidate = true;
    const invitation = el('blockquote', 'prime-invitation'); invitation.append(el('small', '', 'YOUR PENDING INVITATION'), el('span', '', state.invitation)); form.append(invitation);
    const fields = el('div', 'prime-inputs');
    ['p', 'q'].forEach(name => {
      const label = el('label', '', name + ' ='); const input = el('input');
      input.type = 'text'; input.inputMode = 'numeric'; input.id = 'prime-' + name; input.name = name; input.maxLength = 2; input.autocomplete = 'off'; input.setAttribute('aria-describedby', 'prime-help prime-error');
      input.value = state.primeDraft[name]; input.addEventListener('input', () => { state.primeDraft[name] = input.value; $('prime-error').textContent = ''; });
      label.append(input); fields.append(label);
    });
    const help = el('p', 'prime-help', 'Distinct odd primes · p × q ≤ 63 · e = 3'); help.id = 'prime-help';
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
        setStep(1);
      } catch (e) {
        state.explanation = e.message;
        error.textContent = e.message.includes('fixes e = 3') ? 'This lesson fixes e = 3. Try 3 and 5.' : e.message.includes('odd primes') ? 'Choose odd primes. Try 3 and 5.' : e.message.includes('63 or below') ? 'Keep p × q ≤ 63. Try 3 and 5.' : e.message;
      }
    };
    form.addEventListener('submit', e => { e.preventDefault(); validate(); }); $('stage-body').append(form);
    caption('Choose distinct odd primes with p × q ≤ 63 and e = 3. Try (3, 5), (3, 11), (3, 17), or (5, 11). This is deliberately insecure textbook RSA with no padding. Only the public product N goes to the attack.', 'Your primes stay private; their product becomes public.');
    stageNavigation('Encrypt my invitation →', validate); return;
  }
  state.motionReady = false;
  beginStoryMotion('rsa', {keys:state.keys,packet:state.packet,message:state.invitation}, encryptionReady);
}
async function intercept() {
  if (state.phase !== 'RSA' || !state.packet || !state.motionReady || state.sending) return;
  state.sending = true; const epoch = generation;
  for (const button of $('stage-nav').querySelectorAll('button')) button.disabled = true;
  $('game').classList.add('sending-packet');
  await flyPacket($('game'));
  $('game').classList.remove('sending-packet');
  if (epoch !== generation) return;
  state.sending = false;
  cancelWindowMotion();
  markDraft('Encrypted packet sent · intercepted by Zeno');
  state.intercepted = structuredClone(state.packet);
  transition('INTERCEPT');
  $('message-context-label').textContent = 'YOUR INVITATION';
  $('message-context-status').textContent = 'Encryption complete · packet released.';
  $('packet-summary').textContent = state.packet.byteLength + ' UTF-8 bytes · ' + state.packet.ciphertext.length + ' encrypted blocks · public n = ' + state.packet.n;
  $('encryption-summary').hidden = false;
  $('zeno-popup').append($('stage'));
  appendMessage('system', 'PACKET COPIED · n = ' + state.packet.n + ', e = ' + state.packet.e + ' and the ciphertext are visible on the channel.');
  appendMessage('rival', 'A private invitation? Cute. Let’s see how private.');
  finishTask('rsa', 'Packet sent · intercepted by Zeno', true);
  offerTask('attack', 'Inspect Zeno’s attack', 'He copied the packet. Follow the attempt to recover your key.', openZeno, 'rival');
  renderStage();
  $('stage').scrollTop = 0;
  openZeno();
}
function openZeno() {
  if (!['INTERCEPT', 'RECOVER'].includes(state.phase) || state.zenoClosing) return;
  state.zenoDismissed = false; updateWindowDock();
  const popup = $('zeno-popup');
  popup.classList.remove('closing');
  if (!popup.open) popup.showModal();
  const entry = taskCards.get('attack'); if (entry) entry.opened = true;
  syncTask();
  $('stage-title').focus({ preventScroll: true });
}
function renderIntercept() {
  stageBase('Your invitation. My window.', 'Fictional future machine · toy RSA demonstration', '');
  if (state.step === 0) {
    $('execution-controls').hidden = false;
    $('pause-animation').hidden = true; $('replay-animation').hidden = true; $('skip-animation').hidden = true;
    $('stage-body').append(rivalInterruption());
    caption('A sufficiently powerful quantum computer could break RSA. This tiny example demonstrates how.');
    stageNavigation('Watch Zeno’s attack →', () => { state.step = 1; renderStage(); launchAttack(); });
    return;
  }
  $('stage-title').textContent = 'Inside Zeno’s machine.';
  $('execution-controls').hidden = true;
  beginStoryMotion('attack', {packet:state.intercepted,base:lessonBase(state.intercepted.n)}, attackRevealed);
  updateAttackStatus();
}
function attackRevealed() {
  if (!['INTERCEPT', 'RECOVER'].includes(state.phase) || state.job !== 'success' || typeof state.recoveredText !== 'string') return;
  if (state.phase === 'INTERCEPT') transition('RECOVER');
  state.step = 4;
  $('stage-title').textContent = 'He has your invitation.';
  $('step-count').textContent = 'Verified recovery';
  stageNavigation('Back to Alice →', consequence);
}
function updateAttackStatus() {
  let status = $('job-status');
  if (!status) { status = el('div', 'job-status'); status.id = 'job-status'; status.setAttribute('role','status'); $('stage-body').append(status); }
  status.className = 'job-status ' + state.job;
  status.textContent = state.job === 'success' ? (state.result.source === 'sample' ? 'Sample measurements · no quantum job.' : 'Live measurements · result verified.') : state.job === 'error' ? 'Attack failed. Nothing decrypted.' : state.job === 'inconclusive' ? 'No useful period. Nothing decrypted.' : state.mode === 'demo' ? 'Illustrative attack · no quantum job.' : 'Waiting for the live result…';
  if (['error','inconclusive'].includes(state.job)) {
    activeMotion?.suspend('failure',true);
    $('pause-animation').disabled = true;
    $('replay-animation').disabled = true; $('skip-animation').disabled = true;
    if (state.mode === 'live') status.append(button('Use illustrative demo instead', () => { changeMode('demo'); }, 'quiet'));
    stageNavigation('Retry attack →', () => { state.job='idle'; renderStage(); launchAttack(); });
  }
}
async function launchAttack() {
  if (state.phase !== 'INTERCEPT' || ['submitting', 'waiting', 'success'].includes(state.job)) return;
  const epoch = generation, ticket = ++submission; const mode = state.mode;
  state.error = ''; state.result = null; state.recoveredText = null;
  try {
    const result = await runAttack({ mode, modulus: state.intercepted.n, base: lessonBase(state.intercepted.n), onStatus: value => { if (epoch !== generation || ticket !== submission) return; state.job = value; state.stageDirty = true; $('execution-mode').disabled = true; if (view === 'stage') updateAttackStatus(); } });
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
    if (epoch === generation && ticket === submission) { state.stageDirty = true; $('execution-mode').disabled = state.job === 'success'; updateModeLabel(); if (view === 'stage') updateAttackStatus(); }
  }
}
function renderRecovery() { renderIntercept(); }
async function consequence() {
  if (state.phase !== 'RECOVER' || state.recoveredText == null || state.zenoClosing) return;
  const epoch = generation;
  state.zenoClosing = true; $('stage').inert = true; $('zeno-popup').classList.add('closing');
  await closePopup($('zeno-popup'));
  if (epoch !== generation) return;
  $('zeno-popup').close(); $('zeno-popup').classList.remove('closing'); $('stage').inert = false;
  state.zenoClosing = false;
  finishTask('attack', 'Key recovered · invitation leaked', true);
  transition('CHOICE');
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
  } }, { label: 'Upgrade the protection →', run: () => taskCards.get('pq')?.card.click() }]);
  offerTask('pq', 'A better envelope', 'Switch our key exchange so Zeno’s RSA trick won’t work.', card => {
    if (state.phase === 'CHOICE') {
      appendMessage('user', 'Let’s upgrade the protection.'); transition('PQ');
    }
    if (state.phase === 'PQ') showStage(card);
  });
  syncTask();
}
function protectionReady() {
  if (state.phase !== 'PQ') return;
  state.pqDetails = true;
  state.step = 0;
  renderStage();
}
function renderPQ() {
  if (state.pqDetails) return renderPQDetails();
  stageBase('A new key. A new plan.', 'Illustrative ML-KEM exchange · no post-quantum computation', '');
  beginStoryMotion('pq', {}, protectionReady);
}
const MLKEM_Q = 3329;
const MLKEM_FIELDS = [
  { key: 'a0', label: 'a₀', purpose: 'public matrix', min: 0, max: MLKEM_Q - 1 },
  { key: 'a1', label: 'a₁', purpose: 'public matrix', min: 0, max: MLKEM_Q - 1 },
  { key: 's0', label: 's₀', purpose: 'secret sample', min: -2, max: 2 },
  { key: 's1', label: 's₁', purpose: 'secret sample', min: -2, max: 2 },
  { key: 'e0', label: 'e₀', purpose: 'noise sample', min: -2, max: 2 },
  { key: 'e1', label: 'e₁', purpose: 'noise sample', min: -2, max: 2 },
];
function readMlkemInputs() {
  const values = {};
  for (const field of MLKEM_FIELDS) {
    const input = $('mlkem-' + field.key);
    const value = Number(input.value);
    if (!input.value.trim() || !Number.isInteger(value) || value < field.min || value > field.max) {
      throw new Error(field.label + ' must be a whole number from ' + field.min + ' to ' + field.max + '.');
    }
    values[field.key] = value;
  }
  state.mlkemDraft = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)]));
  return values;
}
function calculateMlkemToy(values) {
  const raw = [
    values.a0 * values.s0 + values.e0,
    values.a0 * values.s1 + values.a1 * values.s0 + values.e1,
    values.a1 * values.s1,
  ];
  return { raw, reduced: raw.map(value => ((value % MLKEM_Q) + MLKEM_Q) % MLKEM_Q) };
}
function polynomialText(coefficients) {
  const terms = [];
  coefficients.forEach((coefficient, power) => {
    if (!coefficient) return;
    const magnitude = Math.abs(coefficient);
    const body = power === 0 ? String(magnitude) : (magnitude === 1 ? '' : magnitude) + 'X' + (power > 1 ? '^' + power : '');
    if (!terms.length) terms.push((coefficient < 0 ? '−' : '') + body);
    else terms.push((coefficient < 0 ? ' − ' : ' + ') + body);
  });
  return terms.join('') || '0';
}
function renderPQDetails() {
  const titles = [
    'ML-KEM, in context',
    'Alice sends her public key',
    'Choose the toy numbers',
    'Follow one polynomial product',
    'What Zeno can intercept',
    'Why Zeno cannot feasibly decrypt it',
  ];
  const subtitles = [
    'A post-quantum way to agree on a shared secret.',
    'Public information can travel through the channel.',
    'Pick six coefficients for one small teaching example.',
    'See what the chosen coefficients do.',
    'An intercepted packet is still encrypted.',
    'The secret depends on two different protections.',
  ];
  stageBase(titles[state.step], subtitles[state.step], (state.step + 1) + ' / 6');
  $('replay-animation').hidden = true; $('skip-animation').hidden = true;
  if (state.step === 0) {
    $('stage-body').append(el('div', 'math-equation', 'ML-KEM → shared secret → AES-256-GCM'));
    $('stage-body').append(el('p', 'math-small mlkem-copy', 'ML-KEM helps you and Alice establish the same secret. AES-GCM uses a key derived from it to encrypt the actual text and detect tampering.'));
    const details = el('details', 'mlkem-details');
    details.append(el('summary', '', 'How this demo differs from real ML-KEM'));
    details.append(el('p', '', 'Real ML-KEM-768 works with a 3 × 3 matrix of degree-255 polynomials modulo X^256 + 1 and q = 3329, with standardized sampling, transforms, encoding, and compression. This lesson lets you choose six toy coefficients and calculates one short polynomial product within a simplified equation. It does not generate an ML-KEM key, capsule, or encrypted message; real secret and noise values are sampled by the algorithm.'));
    $('stage-body').append(details);
    caption('ML-KEM establishes a secret; AES-GCM encrypts the text. This is a teaching model, not a working cipher.', 'ML-KEM agrees a secret; AES-GCM protects the text.');
  }
  if (state.step === 1) {
    visual(pqVisual(0), ['ALICE → YOU', 'ML-KEM public key']);
    $('stage-body').append(el('p', 'math-small mlkem-copy', 'Alice’s ML-KEM-768 public key is 1,184 bytes in the real standard. The coefficients on the next screen are teaching inputs, not those key bytes.'));
    caption('Alice’s public key may be shared. Her private decapsulation key stays on her device. In this story, you already verified Alice’s identity at work.', 'Alice sends pk; her private decapsulation key stays with her.');
  }
  if (state.step === 2) {
    $('stage-body').append(el('div', 'math-equation mlkem-input-equation', 't(X) = a(X)s(X) + e(X)  (mod 3329)'));
    $('stage-body').append(el('p', 'math-small mlkem-copy', 'a(X) = a₀ + a₁X · a₀ is the constant term; a₁ is the coefficient of X.'));
    const form = el('form', 'mlkem-form');
    form.noValidate = true;
    const groups = [
      { title: 'a(X) · public matrix sample', note: 'Coefficients: 0 to 3328', fields: MLKEM_FIELDS.slice(0, 2) },
      { title: 's(X) · secret sample', note: 'Demo range: −2 to 2', fields: MLKEM_FIELDS.slice(2, 4) },
      { title: 'e(X) · noise sample', note: 'Demo range: −2 to 2', fields: MLKEM_FIELDS.slice(4, 6) },
    ];
    const grid = el('div', 'mlkem-input-groups');
    let error;
    for (const groupInfo of groups) {
      const group = el('fieldset', 'mlkem-input-group');
      group.append(el('legend', '', groupInfo.title), el('p', 'mlkem-group-note', groupInfo.note));
      const row = el('div', 'mlkem-coefficients');
      for (const field of groupInfo.fields) {
        const label = el('label', 'mlkem-coefficient');
        label.append(el('span', '', field.label));
        const input = el('input');
        input.type = 'number'; input.step = '1'; input.min = String(field.min); input.max = String(field.max);
        input.id = 'mlkem-' + field.key; input.name = field.key; input.inputMode = 'numeric'; input.required = true;
        input.value = state.mlkemDraft[field.key];
        input.setAttribute('aria-label', field.label + ', ' + field.purpose + ' coefficient');
        input.addEventListener('input', () => { state.mlkemDraft[field.key] = input.value; if (error) error.textContent = ''; });
        label.append(input); row.append(label);
      }
      group.append(row); grid.append(group);
    }
    const help = el('p', 'mlkem-input-help', 'Toy values only: real ML-KEM samples its secret and noise internally. Here you choose them to follow the equation.');
    help.id = 'mlkem-input-help';
    error = el('p', 'field-error'); error.id = 'mlkem-input-error'; error.setAttribute('role', 'alert');
    form.append(grid, help, error);
    const calculate = event => {
      if (event) event.preventDefault();
      try {
        readMlkemInputs();
        setStep(3);
      } catch (problem) { error.textContent = problem.message; }
    };
    form.addEventListener('submit', calculate);
    $('stage-body').append(form);
    caption('q stays fixed at 3329. Choose each coefficient within its displayed range.', 'Choose six values, then calculate.');
    stageNavigation('Calculate →', calculate, () => setStep(1));
    return;
  }
  if (state.step === 3) {
    const values = Object.fromEntries(MLKEM_FIELDS.map(field => [field.key, Number(state.mlkemDraft[field.key])]));
    const result = calculateMlkemToy(values);
    const a = [values.a0, values.a1], s = [values.s0, values.s1], e = [values.e0, values.e1];
    $('stage-body').append(el('p', 'math-small mlkem-copy', 'a(X) = ' + polynomialText(a) + '     s(X) = ' + polynomialText(s) + '     e(X) = ' + polynomialText(e)));
    $('stage-body').append(el('p', 'math-small mlkem-copy', 'a(X)s(X) + e(X) = ' + polynomialText(result.raw)));
    $('stage-body').append(el('div', 'math-equation mlkem-result', '[' + result.reduced.join(', ') + '] mod 3329'));
    const wrapped = result.raw.filter(value => value < 0).map(value => value + ' ≡ ' + (((value % MLKEM_Q) + MLKEM_Q) % MLKEM_Q) + ' (mod 3329)').join('; ');
    $('stage-body').append(el('p', 'math-small mlkem-copy', wrapped ? 'Negative coefficients wrap into 0–3328: ' + wrapped + '.' : 'Each coefficient is reduced modulo q into the range 0–3328.'));
    caption('This is a toy single-polynomial analogue of one product term in t = A·s + e. Real ML-KEM sums three polynomial products per component and also reduces modulo X^256 + 1.', 'Your values are multiplied, noise is added, and coefficients are reduced mod q.');
  }
  if (state.step === 4) {
    visual(pqVisual(1), ['YOU: keep S', 'Send Cₖₑₘ → ALICE']);
    const grid = el('div', 'mlkem-observer-grid');
    const visible = el('section', 'mlkem-observer-card');
    visible.append(el('h3', '', 'Visible to Zeno'));
    const publicList = el('ul', '');
    ['Alice’s public key', 'ML-KEM capsule Cₖₑₘ', 'AES-GCM nonce, ciphertext, and authentication tag'].forEach(item => publicList.append(el('li', '', item)));
    visible.append(publicList);
    const secret = el('section', 'mlkem-observer-card private');
    secret.append(el('h3', '', 'Not sent in the packet'));
    const privateList = el('ul', '');
    ['Alice’s private decapsulation key', 'The shared secret S', 'The derived AES key K'].forEach(item => privateList.append(el('li', '', item)));
    secret.append(privateList);
    grid.append(visible, secret);
    $('stage-body').append(grid);
    caption('These are the fields a real hybrid packet would expose. This demo generates none of them; Zeno could copy them, but copying ciphertext is not decrypting it.', 'Zeno can copy the packet fields. They do not contain the secret.');
  }
  if (state.step === 5) {
    const points = el('ol', 'mlkem-security-points');
    const keySetup = el('li', '');
    keySetup.append(el('strong', '', 'ML-KEM: '), el('span', '', 'Recovering S from Alice’s public key and Cₖₑₘ would require Alice’s private key or solving the Module-LWE lattice problem. No practical quantum attack on standardized ML-KEM-768 is known; Shor’s factoring algorithm does not solve this problem.'));
    const message = el('li', '');
    message.append(el('strong', '', 'AES-256-GCM: '), el('span', '', 'Without S and the derived key K, the ciphertext cannot feasibly be decrypted or authenticated. Generic quantum search gives a quadratic speedup, not a Shor-style break; AES-256 is designed to retain a strong security margin.'));
    const identity = el('li', '');
    identity.append(el('strong', '', 'Alice’s identity: '), el('span', '', 'This story assumes her public key was authenticated when you verified each other at work. Without key authentication, Zeno could try to substitute his own public key.'));
    points.append(keySetup, message, identity);
    $('stage-body').append(points);
    const caveat = el('details', 'mlkem-details');
    caveat.append(el('summary', '', 'What “cannot” means here'));
    caveat.append(el('p', '', 'Zeno can intercept the packet, but current cryptanalysis gives him no known feasible way to decrypt it when the standardized algorithms are implemented correctly and the key is authentic. This is not a mathematical proof that no future attack can ever exist. This game only illustrates the process; it does not run ML-KEM or AES-GCM.'));
    $('stage-body').append(caveat);
    caption('Interception is possible. Feasible decryption is what these algorithms are designed to prevent.', 'Zeno can copy it; no known practical quantum attack decrypts it.');
  }
  stageNavigation(state.step === 5 ? 'Choose a new invitation ♥' : 'Next →', state.step === 5 ? retryConversation : () => setStep(state.step + 1), state.step ? () => setStep(state.step - 1) : () => { state.pqDetails=false; state.step=0; renderStage(); });
  if (!state.step) $('stage-nav').firstElementChild.textContent = '← Animation';
}
async function retryConversation() {
  if (state.phase !== 'PQ') return;
  finishTask('pq', 'Step-by-step exchange illustrated · ready for a new invitation');
  const epoch = generation; transition('RETRY'); setActions([]); showChat();
  appendMessage('system', 'ILLUSTRATIVE POST-QUANTUM EXCHANGE COMPLETE\nNo ML-KEM or AES-GCM code ran, and no real message was protected. Zeno’s RSA factoring trick does not apply to this key-establishment scheme.');
  rivalDefeat();
  if (!(await speak(['Better mathematics. Same butterflies.', 'The first invitation is still out there. Let’s make a new plan—somewhere the intercom can’t follow us.'], epoch))) return;
  updateComposer(); focusChoices();
}
function changeMode(mode) {
  if (['submitting', 'waiting', 'success'].includes(state.job)) return;
  state.mode = mode; state.job = 'idle'; state.error = ''; state.result = null;
  $('execution-mode').value = mode; updateModeLabel();
  if (view === 'stage' && state.phase === 'INTERCEPT') {
    state.step = 0; renderStage();
  }
}
function updateModeLabel() {
  $('mode-label').textContent = state.mode === 'demo' ? 'No quantum job.' : liveAvailable() ? 'Adapter connected.' : 'Connection required.';
}
function openAbout() {
  activeMotion?.suspend('details',true);
  const report = el('div', 'run-report');
  const description = state.result ? 'This playthrough: ' + (state.result.source === 'sample' ? 'sample measurements (no quantum job)' : 'live Qollab measurements') + '; job status: ' + state.job + '.' : 'This playthrough: ' + (state.job === 'error' ? 'the attack failed. No successful quantum result.' : ['waiting', 'submitting'].includes(state.job) ? 'the attack is still pending.' : 'no attack completed yet.');
  report.append(el('p', '', description), el('p', '', 'Dialogue uses scripted reply choices. No messages are sent to a server or stored persistently.'));
  if (view === 'stage' && state.explanation) report.append(el('p', '', state.explanation));
  if (state.error) report.append(el('p', '', state.error));
  if (state.keys) {
    const k=state.keys;
    report.append(el('h3','','Your RSA arithmetic'), el('p','',`p=${k.p}, q=${k.q}; N=${k.n}; φ(N)=(${k.p}−1)(${k.q}−1)=${k.phi}; e=${k.e}; d=${k.d}. e×d ≡ 1 (mod φ).`));
    report.append(el('p','',`The invitation is encoded as UTF-8 bytes, then ${state.packet.width} fixed-width base-${k.n} digits per byte. Each digit is encrypted with c=m^${k.e} mod ${k.n}.`));
  }
  if (state.result?.status === 'success') {
    const r=state.result;
    report.append(el('h3','','Verified recovery'),el('p','',`Measurement phases y/2ᵗ suggest the period through continued fractions. Verified r=${r.period}, a=${r.base}. gcd(a^(r/2)±1,N) yields ${r.factors.join(' and ')}. The recovered private exponent is d=${state.recoveredKey.d}.`));
  }
  if (state.result?.distribution) {
    report.append(el('h3', '', 'All returned measurements (' + state.result.distribution_kind + ')'), el('pre', 'measurement-data', JSON.stringify(state.result.distribution, null, 2)));
  }
  $('run-report').replaceChildren(report); $('about-dialog').showModal();
}
export async function restart() {
  const pending = state && ['waiting', 'submitting'].includes(state.job) && state.mode === 'live';
  generation++; submission++;
  introReveal?.cancel(); dialogueReveal?.cancel(); cancelSceneHandoff();
  stopStoryMotion();
  $('game').classList.remove('sending-packet');
  $('game').querySelectorAll('.outgoing-packet').forEach(packet => packet.remove());
  resetMotion(); taskCards.clear();
  cancelPuzzleChatter(); cancelWindowMotion();
  if ($('zeno-popup').open) $('zeno-popup').close();
  $('zeno-popup').classList.remove('closing'); $('stage').inert = false;
  $('puzzle-window').append($('stage')); $('encryption-summary').hidden = true;
  state = { phase: 'MENU', step: 0, balconyStep: 0, balconyChoice: 0, dateStep: 0, dateLocation: null, chatClosed: false, puzzleClosed: false, zenoDismissed: false, zenoClosing: false, chatterTyping: false, puzzleNotes: new Set(), busy: false, selectedReply: '', mode: 'demo', job: 'idle', history: [], primeDraft: { p: '', q: '' }, mlkemDraft: { a0: '6', a1: '1', s0: '1', s1: '-1', e0: '0', e1: '1' }, invitation: '', retry: '', result: null, packet: null, error: '', recoveredText: null };
  lastStageAction = 0; followMessages = true; userScrollUntil = 0;
  $('messages').replaceChildren();
  $('message').value = ''; updateCount(); $('new-messages').hidden = true;
  $('execution-mode').value = 'demo'; $('execution-mode').disabled = false; updateModeLabel();
  $('game').classList.remove('entering');
  $('game').dataset.scene = 'balcony';
  $('balcony-scene').hidden = true;
  $('balcony-scene').inert = false;
  $('balcony-choices').replaceChildren();
  $('balcony-scene').setAttribute('aria-label', 'A walk break with Alice');
  $('scene-place').textContent = 'QUANTUM LABORATORY';
  $('scene-time').textContent = 'Balcony · late shift';
  $('date-art').hidden = true;
  $('skip-balcony').hidden = false;
  $('end-screen').hidden = true;
  $('puzzle-window').hidden = true;
  $('scene-transition').hidden = true;
  portrait('idle'); document.body.dataset.phase = 'MENU'; updateChapter(); setActions([]);
  view = 'menu'; $('game').dataset.view = 'menu';
  updateWindowDock();
  $('stage').hidden = true; $('chat-view').hidden = false;
  document.querySelector('.conversation-panel').inert = true;
  $('start-screen').hidden = false;
  busy(false);
  if (pending) appendMessage('system', 'Story restarted. A submitted remote job may still finish; restarting this interface does not cancel it. Its result will be ignored.');
  $('start-game').focus({ preventScroll: true });
  $('start-prompt-copy').textContent = 'Click anywhere to reveal';
  introReveal = revealWords([...$('intro-story').children], { pace:150, onComplete:() => { $('start-prompt-copy').textContent = 'Click anywhere to start'; } });
}
function startGame(event) {
  if (state.phase !== 'MENU' || event?.detail > 1) return;
  if (introReveal?.running) { introReveal.finish(); return; }
  introReveal?.cancel();
  const epoch = generation;
  transition('BALCONY');
  $('start-screen').hidden = true;
  view = 'balcony'; $('game').dataset.view = 'balcony';
  $('balcony-scene').hidden = false;
  renderBalcony();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $('game').classList.add('entering');
    setTimeout(() => { if (generation === epoch) $('game').classList.remove('entering'); }, 850);
  }
}
function renderBalcony() {
  dialogueReveal?.cancel();
  const meeting = state.phase === 'MEET';
  const beat = meeting ? { ...selectedDate().lines[state.dateStep], last: state.dateStep === selectedDate().lines.length - 1 } : balconyBeat(state.balconyStep, state.balconyChoice);
  portrait(beat.expression);
  $('balcony-speaker').textContent = beat.speaker;
  $('balcony-context').textContent = beat.speaker === 'Bob' ? 'YOU · IN PERSON' : 'IN PERSON';
  $('balcony-line').textContent = beat.text;
  $('balcony-choices').replaceChildren();
  const choosing = !meeting && state.balconyStep === 0;
  if (choosing) {
    balconyReplies.forEach((reply, index) => {
      $('balcony-choices').append(button(reply, () => {
        if (state.phase !== 'BALCONY' || state.balconyStep !== 0) return;
        state.balconyChoice = index; state.balconyStep = 1; renderBalcony();
      }));
    });
  }
  const ready = () => {
    $('balcony-next').hidden = choosing;
    uiText($('balcony-next'), beat.last ? (meeting ? 'Finish ♥' : 'Back to my desk ↗') : 'Continue ▼');
    $('balcony-hint').textContent = choosing ? 'Choose your reply' : 'Click anywhere in this box';
    $('dialogue-advance').disabled = choosing;
    $('dialogue-advance').setAttribute('aria-label', beat.last ? (meeting ? 'Finish the date' : 'Back to my desk') : 'Continue dialogue');
    for (const choice of $('balcony-choices').children) choice.disabled = false;
    if (choosing) $('balcony-choices').firstElementChild.focus({preventScroll:true});
  };
  for (const choice of $('balcony-choices').children) choice.disabled = true;
  $('balcony-next').hidden = true;
  $('balcony-hint').textContent = 'Click to reveal the full line';
  $('dialogue-advance').disabled = false;
  $('dialogue-advance').setAttribute('aria-label','Show full dialogue');
  dialogueReveal = revealWords([$('balcony-line')], {pace:100, onComplete:ready});
  $('dialogue-advance').focus({preventScroll:true});
}
function advanceBalcony(event) {
  if (event.detail > 1 || !['BALCONY','MEET'].includes(state.phase)) return;
  if (dialogueReveal?.running) { dialogueReveal.finish(); return; }
  if (state.phase === 'MEET') {
    if (state.dateStep === selectedDate().lines.length - 1) return finishStory();
    state.dateStep++; renderBalcony(); return;
  }
  if (state.phase !== 'BALCONY' || state.balconyStep === 0) return;
  if (balconyBeat(state.balconyStep, state.balconyChoice).last) return returnToDesk();
  state.balconyStep++; renderBalcony();
}
function cancelSceneHandoff() {
  handoffTimers.forEach(clearTimeout); handoffTimers=[]; sceneHandoff=null;
  $('scene-transition').hidden=true; $('scene-transition').classList.remove('leaving');
}
function showSceneHandoff({kicker,title,copy,prompt,prepare,after,auto=false}) {
  cancelSceneHandoff();
  const handoff={epoch:generation,prepare,after,advancing:false}; sceneHandoff=handoff;
  $('transition-kicker').textContent=kicker; $('transition-title').textContent=title;
  $('transition-copy').textContent=copy; $('transition-prompt').textContent=prompt;
  $('scene-transition').hidden=false; $('transition-continue').disabled=true;
  handoffTimers.push(setTimeout(() => {
    if (sceneHandoff!==handoff || handoff.epoch!==generation) return;
    $('transition-continue').disabled=false; $('transition-continue').focus({preventScroll:true});
  },matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600));
  if (auto) handoffTimers.push(setTimeout(advanceSceneHandoff,3200));
}
async function advanceSceneHandoff(event) {
  const handoff=sceneHandoff;
  if (!handoff || handoff.advancing || $('transition-continue').disabled || event?.detail>1) return;
  handoff.advancing=true; $('transition-continue').disabled=true;
  handoffTimers.forEach(clearTimeout); handoffTimers=[];
  handoff.prepare(); $('scene-transition').classList.add('leaving');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) await sleep(700);
  if (generation!==handoff.epoch || sceneHandoff!==handoff) return;
  $('scene-transition').hidden=true; $('scene-transition').classList.remove('leaving'); sceneHandoff=null;
  handoff.after();
}
function returnToDesk() {
  if (state.phase !== 'BALCONY') return;
  dialogueReveal?.cancel(); const epoch=generation;
  transition('RETURN'); $('balcony-scene').inert=true;
  showSceneHandoff({
    kicker:'A FEW STEPS DOWN THE HALL', title:'Back at your desk.',
    copy:'You sit down. A message from Alice lights up your screen.',
    prompt:'Click anywhere to continue ↗',
    prepare:() => {
      $('balcony-scene').hidden=true; $('game').classList.remove('entering');
      $('game').dataset.scene='desk'; transition('INTRO');
      showChat();
    },
    after:async () => {
      document.querySelector('.conversation-panel').inert=false;
      $('messages').focus({preventScroll:true});
      if (await speak(['Back at your desk? I’m glad we took that walk.', 'The trapped ions can wait. I’d rather get to know you.', 'Want to continue this somewhere a little more private?'],epoch)) focusChoices();
    },
  });
}
function selectedDate() { return dateLocations.find(location => location.id === state.dateLocation); }
function startMeeting() {
  if (state.phase !== 'DELIVERED' || state.busy || sceneHandoff) return;
  const location=selectedDate(); setActions([]);
  document.querySelector('.conversation-panel').inert=true;
  showSceneHandoff({
    kicker:location.time.toUpperCase(), title:location.name,
    copy:location.id==='garden' ? 'You pocket your phone. Alice is waiting with two coffees.' : 'You pocket your phone and head for the glow of the east dome.',
    prompt:'Your shift can wait. ↗', auto:true,
    prepare:() => {
      transition('MEET'); state.dateStep=0;
      view='balcony'; $('game').dataset.view='balcony'; $('game').dataset.scene=location.id;
      $('date-art').src=location.background; $('date-art').hidden=false;
      $('scene-place').textContent=location.name.toUpperCase(); $('scene-time').textContent=location.time+' · just us';
      $('balcony-scene').setAttribute('aria-label','A date with Alice at the '+location.name.toLowerCase());
      $('balcony-line').textContent=''; $('balcony-choices').replaceChildren();
      $('balcony-scene').hidden=false; $('balcony-scene').inert=true; $('skip-balcony').hidden=true;
      $('dialogue-advance').disabled=true;
    },
    after:() => { $('balcony-scene').inert=false; renderBalcony(); },
  });
}
function finishStory() {
  if (state.phase !== 'MEET') return;
  transition('END');
  view = 'end'; $('game').dataset.view = 'end';
  $('balcony-scene').hidden = true;
  $('end-location').textContent = selectedDate().ending;
  $('end-screen').hidden = false;
  $('end-title').focus({ preventScroll: true });
}

// Fit the visible viewport, including a phone's on-screen keyboard.
function fitScene() {
  document.documentElement.style.setProperty('--scene-height', Math.round(window.visualViewport?.height || window.innerHeight) + 'px');
}
window.addEventListener('resize', fitScene);
window.visualViewport?.addEventListener('resize', fitScene);
fitScene();

$('minimize-task').addEventListener('click', minimizeTask);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && view === 'stage' && !$('about-dialog').open && !$('zeno-popup').open) { event.preventDefault(); minimizeTask(); }
});
$('start-game').addEventListener('click', startGame);
$('dialogue-advance').addEventListener('click', advanceBalcony);
$('transition-continue').addEventListener('click', advanceSceneHandoff);
$('skip-balcony').addEventListener('click', returnToDesk);
$('end-replay').addEventListener('click', restart);
$('end-about').addEventListener('click', openAbout);
$('close-chat').addEventListener('click', () => { moveWindows(() => { state.chatClosed = true; updateWindowDock(); }); $('restore-chat').focus({ preventScroll: true }); });
$('restore-chat').addEventListener('click', restoreChat);
$('close-puzzle').addEventListener('click', minimizeTask);
$('restore-puzzle').addEventListener('click', restorePuzzle);
$('zeno-popup').addEventListener('cancel', event => event.preventDefault());
$('restore-zeno').addEventListener('click', openZeno);
$('inspect-interception').addEventListener('click', openZeno);
$('composer').addEventListener('submit', sendMessage);
for (const event of ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'keydown']) {
  $('messages').addEventListener(event, () => { userScrollUntil = performance.now() + 1000; }, { passive: true });
}
$('messages').addEventListener('scroll', () => {
  if (!['chat', 'stage'].includes(view) || performance.now() > userScrollUntil) return;
  const m = $('messages'); followMessages = m.scrollHeight - m.scrollTop - m.clientHeight < 45;
  if (followMessages) $('new-messages').hidden = true;
});
new ResizeObserver(() => {
  if (followMessages && ['chat', 'stage'].includes(view)) { $('messages').scrollTop = $('messages').scrollHeight; $('new-messages').hidden = true; }
}).observe($('messages'));
$('new-messages').addEventListener('click', () => { followMessages = true; $('messages').scrollTop = $('messages').scrollHeight; $('new-messages').hidden = true; });
$('pause-animation').addEventListener('click', () => activeMotion?.toggle());
$('replay-animation').addEventListener('click', () => {
  if (!activeMotion || state.sending) return;
  state.motionReady = false; $('stage-nav').replaceChildren(); $('step-count').textContent = '';
  activeMotion.replay();
});
$('skip-animation').addEventListener('click', () => activeMotion?.skip());
$('about-button').addEventListener('click', openAbout);
$('close-about').addEventListener('click', () => $('about-dialog').close());
$('about-dialog').addEventListener('close', () => activeMotion?.suspend('details',false));
$('execution-mode').addEventListener('change', e => changeMode(e.target.value));
restart();
