// Optional developer verification. No Playwright dependency is shipped to players.
const { chromium } = require(process.argv[2] ? require('node:path').join(process.argv[2], 'playwright') : 'playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdir } = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const server = spawn(process.execPath, ['tools/serve.mjs'], { cwd: root, env: { ...process.env, PORT: '4175' }, windowsHide: true, stdio: 'pipe' });
const delay = ms => new Promise(r => setTimeout(r, ms));
const url = 'http://127.0.0.1:4175';
let browser;
(async () => {
  await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.stderr.on('data', b => process.stderr.write(b)); server.once('error', reject); server.once('exit', code => reject(new Error('Static test server exited: ' + code))); setTimeout(() => reject(new Error('Static test server did not start')), 10000).unref(); });
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { executablePath: process.argv[3] || 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}) });
  await mkdir(path.join(root, 'qa'), { recursive: true });
  const errors = [];
  const portraitRequests = new Set();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', request => { if (request.url().includes('/assets/characters/')) portraitRequests.add(new URL(request.url()).pathname.split('/').pop()); });
  const expectPortrait = async (p, expression) => {
    await p.waitForFunction(expected => {
      const image = document.getElementById('portrait');
      return image.dataset.expression === expected && image.complete && image.naturalWidth === 68 && image.naturalHeight === 89;
    }, expression);
    assert((await p.locator('#portrait').getAttribute('src')).endsWith('mira-' + expression + '-68x89.png'));
    assert.equal(await p.locator('#portrait').evaluate(image => getComputedStyle(image).objectFit), 'contain');
  };
  const clickNext = async p => { await p.waitForTimeout(280); await p.locator('#stage-nav button').last().click(); };
  const assertStageLayout = async p => {
    const problems = await p.evaluate(() => {
      const issues = [];
      const checkStack = selector => {
        const children = [...document.querySelector(selector).children].filter(e => e.getClientRects().length);
        for (let i = 1; i < children.length; i++) {
          if (children[i - 1].getBoundingClientRect().bottom > children[i].getBoundingClientRect().top + 1) {
            issues.push(selector + ': ' + children[i - 1].className + ' overlaps ' + children[i].className);
          }
        }
      };
      checkStack('#stage'); checkStack('#stage-body');
      const stage = document.getElementById('stage');
      if (stage.scrollWidth > stage.clientWidth + 1) issues.push('stage overflows horizontally');
      if (stage.scrollHeight > stage.clientHeight + 2) issues.push('stage requires vertical scrolling');
      const chat = document.querySelector('.conversation-panel').getBoundingClientRect();
      const puzzle = document.getElementById('puzzle-window').getBoundingClientRect();
      if (innerWidth > 760) {
        if (Math.abs(chat.width / (chat.width + puzzle.width) - .3) > .005) issues.push('chat does not occupy 30% of window space');
        if (chat.right >= puzzle.left) issues.push('chat overlaps puzzle window');
      } else if (chat.bottom >= puzzle.top) issues.push('stacked chat overlaps puzzle window');
      if (puzzle.bottom > innerHeight + 1 || chat.bottom > innerHeight + 1) issues.push('window outside viewport');
      if (document.getElementById('message').disabled !== true || document.getElementById('send').disabled !== true) issues.push('responses enabled during puzzle');
      const speech = document.querySelector('.rival-speech');
      if (speech) {
        const box = speech.getBoundingClientRect();
        const art = document.querySelector('.rival-art').getBoundingClientRect();
        if (box.bottom > art.top && box.top < art.bottom && box.right > art.left && box.left < art.right) issues.push('diagonal speech covers sprites');
        if (box.left < stage.getBoundingClientRect().left || box.right > stage.getBoundingClientRect().right) issues.push('diagonal speech is clipped');
      }
      return issues;
    });
    if (problems.length) await p.screenshot({ animations: 'disabled', path: path.join(root, 'qa/attack-layout-failure.png') });
    assert.deepEqual(problems, [], 'stage contents stay separated at ' + JSON.stringify(p.viewportSize()));
  };
  const checkAttackSizes = async p => {
    const original = p.viewportSize();
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 480 }, { width: 844, height: 390 }]) {
      await p.setViewportSize(viewport);
      await p.waitForFunction(() => Math.abs(document.querySelector('.app').getBoundingClientRect().height - (window.visualViewport?.height || innerHeight)) < 2);
      await assertStageLayout(p);
    }
    await p.setViewportSize(original);
    await p.waitForFunction(() => Math.abs(document.querySelector('.app').getBoundingClientRect().height - (window.visualViewport?.height || innerHeight)) < 2);
  };
  const expectRival = async (p, pose, width, height) => {
    await p.waitForFunction(({ pose, width, height }) => [...document.querySelectorAll('.rival-' + pose)].some(image => image.complete && image.naturalWidth === width && image.naturalHeight === height), { pose, width, height });
  };
  const ready = p => p.waitForFunction(() => !document.getElementById('message').disabled);
  const start = async p => { await p.getByRole('button', { name: 'Start Qrush', exact: true }).click(); await p.locator('#skip-balcony').click(); await ready(p); };
  const chooseReply = async (p, index = 0) => {
    const choice = p.locator('#suggestions button').nth(index);
    const reply = await choice.innerText();
    await choice.click();
    assert.equal(await p.locator('#message').inputValue(), reply);
    assert.equal(await choice.getAttribute('aria-pressed'), 'true');
    await p.getByRole('button', { name: 'Send message', exact: true }).click();
    return reply;
  };
  const begin = async (p, invitationIndex = 0) => {
    await p.goto(url); await start(p);
    await chooseReply(p); await ready(p);
    const invitation = await chooseReply(p, invitationIndex);
    await p.locator('#prime-p').waitFor();
    return invitation;
  };
  const toIntercept = async p => {
    await p.getByRole('button', { name: 'Use demo values', exact: true }).click();
    for (let i = 0; i < 7; i++) await clickNext(p);
    await clickNext(p); // public sequence → circuit
  };
  const finishDate = async (p, venue, prefix) => {
    await p.getByRole('button', { name: 'Meet Alice ↗', exact: true }).click();
    assert.equal(await p.locator('body').getAttribute('data-phase'), 'MEET');
    assert.equal(await p.locator('#game').getAttribute('data-scene'), venue);
    await p.waitForFunction(() => document.getElementById('date-art').complete && document.getElementById('date-art').naturalWidth > 0);
    assert((await p.locator('#date-art').getAttribute('src')).endsWith(venue + '.svg'));
    assert.match(await p.locator('#balcony-line').textContent(), venue === 'garden' ? /garden.*coffee/ : /dome.*hot chocolate/);
    assert(await p.locator('.conversation-panel').isHidden());
    const viewport = p.viewportSize();
    for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 480 }, { width: 844, height: 390 }]) {
      await p.setViewportSize(size);
      await p.waitForFunction(() => Math.abs(document.querySelector('.app').getBoundingClientRect().height - (window.visualViewport?.height || innerHeight)) < 2);
      assert(await p.locator('.vn-dialogue').evaluate(e => { const b = e.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight; }));
    }
    await p.setViewportSize(viewport);
    await p.screenshot({ animations: 'disabled', path: path.join(root, 'qa/' + prefix + '-date-' + venue + '.png') });
    await p.locator('#dialogue-advance').click({ position: { x: 20, y: 15 } });
    assert.equal(await p.locator('#balcony-speaker').textContent(), 'Bob');
    await p.locator('#dialogue-advance').dblclick({ position: { x: 40, y: 85 } });
    assert.equal(await p.locator('#balcony-speaker').textContent(), 'Alice');
    for (let i = 0; i < 3; i++) await p.locator('#dialogue-advance').press('Enter');
    assert.equal(await p.locator('body').getAttribute('data-phase'), 'END');
    assert(await p.locator('#end-screen').isVisible());
    assert.match(await p.locator('#end-location').textContent(), venue === 'garden' ? /garden/ : /dome/);
    await p.locator('#end-about').click();
    assert(await p.locator('#about-dialog').isVisible());
    await p.locator('#close-about').click();
    assert(await p.locator('#end-screen').isVisible());
  };
  await page.goto(url);
  assert.equal(await page.locator('body').getAttribute('data-phase'), 'MENU');
  assert(await page.locator('#portrait').isHidden(), 'Alice must not appear behind the introduction');
  assert(await page.locator('.conversation-panel').evaluate(p => p.inert));
  assert.match(await page.locator('#intro-story').innerText(), /Alice/);
  assert.match(await page.locator('#intro-story').innerText(), /Zeno/);
  await page.screenshot({ animations: 'disabled', path: path.join(root, 'qa/desktop-intro.png') });
  assert.equal(await page.locator('.message').count(), 0, 'the conversation waits for the player');
  await page.mouse.click(20, 20); // The skyline is part of the start target, too.
  await page.locator('#start-game').evaluate(b => b.click()); // A repeated start must be ignored.
  assert.equal(await page.locator('.portrait-wrap').evaluate(p => getComputedStyle(p).animationName), 'balcony-enter');
  assert.equal(await page.locator('body').getAttribute('data-phase'), 'BALCONY');
  await page.locator('#skip-balcony').click();
  await ready(page);
  assert.equal(await page.locator('.message.alice').count(), 3, 'the intro starts exactly one conversation');
  assert(await page.locator('.chat-contact').isVisible());
  assert.equal(await page.locator('#contact-avatar').getAttribute('src'), await page.locator('#portrait').getAttribute('src'));
  await expectPortrait(page, 'idle');
  const portraitSize = await page.locator('#contact-avatar').evaluate(image => [image.clientWidth, image.clientHeight]);
  await page.screenshot({ animations: 'disabled', path: path.join(root, 'qa/desktop-conversation.png') });
  assert.equal(await page.locator('.message.system').count(), 0, 'opening caption is removed');
  assert(await page.locator('#message').evaluate(m => m.readOnly && m.tabIndex === -1));
  assert(await page.locator('#send').isDisabled(), 'send requires a reply choice');
  assert(await page.locator('#suggestions').evaluate(s => s.getBoundingClientRect().bottom <= document.querySelector('.compose-box').getBoundingClientRect().top), 'suggestions sit above the textbox');
  const box = await page.locator('#message').boundingBox();
  await page.mouse.click(box.x + 10, box.y + 10);
  assert.notEqual(await page.evaluate(() => document.activeElement.id), 'message', 'clicking the preview must not focus it');
  await page.locator('#message').focus(); await page.keyboard.type('Cannot type here');
  assert.equal(await page.locator('#message').inputValue(), '');
  await page.locator('#suggestions button').last().press('Enter');
  const openingReply = await page.locator('#suggestions button').last().innerText();
  assert.equal(await page.locator('#message').inputValue(), openingReply);
  assert.equal(await page.locator('.message.user').count(), 0, 'selecting previews without sending');
  // A wider, more legible layout may fit all three opening messages. Exercise
  // reading-position preservation only after making the log actually scrollable.
  const readingViewport = page.viewportSize();
  await page.setViewportSize({ width: readingViewport.width, height: 650 });
  assert(await page.locator('#messages').evaluate(m => m.scrollHeight > m.clientHeight + 45), 'reading-position check requires scrollable history');
  await page.locator('#send').evaluate(b => { b.click(); b.click(); });
  await page.locator('#messages').evaluate(m => { m.dispatchEvent(new WheelEvent('wheel')); m.scrollTop = 0; });
  await ready(page);
  assert.equal(await page.locator('#messages').evaluate(m => m.scrollTop), 0, 'new messages must not pull a reader away');
  await page.setViewportSize(readingViewport);
  await expectPortrait(page, 'blushing');
  assert.deepEqual(await page.locator('#contact-avatar').evaluate(image => [image.clientWidth, image.clientHeight]), portraitSize, 'expression swaps must keep the same avatar frame dimensions');
  await page.screenshot({ animations: 'disabled', path: path.join(root, 'qa/desktop-flustered.png') });
  assert.equal(await page.locator('.message.user').count(), 1, 'duplicate send only sends one reply');
  assert.equal(await page.locator('#message').inputValue(), '', 'new phase starts with an empty preview');
  assert(await page.locator('#send').isDisabled());
  await page.getByRole('button', { name: 'New messages ↓', exact: true }).click();
  assert(await page.locator('#new-messages').isHidden(), 'returning to the latest message clears the history control');
  await page.screenshot({ animations: 'disabled', path: path.join(root, 'qa/desktop-pixel-texting.png') });
  const invitation = await chooseReply(page);
  await page.locator('#prime-p').waitFor();
  await page.locator('#messages').evaluate(m => { m.dispatchEvent(new WheelEvent('wheel')); m.scrollTop = 0; });
  await page.locator('[data-puzzle-note="RSA:0"]').waitFor();
  assert.equal(await page.locator('#messages').evaluate(m => m.scrollTop), 0, 'Alice’s puzzle texts preserve a reader’s scroll position');
  await page.locator('#new-messages').click();
  await assertStageLayout(page);
  const heldCount = await page.locator('.message.user').count();
  await page.locator('#composer').evaluate(form => form.requestSubmit());
  assert.equal(await page.locator('.message.user').count(), heldCount, 'responses stay locked during puzzles');
  await page.waitForTimeout(700);
  assert.equal(await page.locator('.portrait-panel').evaluate(p => getComputedStyle(p).filter), 'none', 'pixel artwork stays crisp during mathematics');
  assert.match(await page.locator('#stage-subtitle').innerText(), /Toy RSA/);
  await page.screenshot({ animations: 'disabled', path: path.join(root, 'qa/desktop-primes.png') });
  for (const [p, q, pattern] of [['', '', /whole prime/], ['4', '5', /whole prime/], ['3', '3', /distinct/], ['3', '7', /fixes e = 3/]]) {
    await page.locator('#prime-p').fill(p); await page.locator('#prime-q').fill(q); await clickNext(page);
    assert.match(await page.locator('#prime-error').innerText(), pattern);
  }
  await page.locator('#prime-p').fill('5'); await page.locator('#prime-q').fill('3'); await clickNext(page);
  await page.getByRole('button', { name: 'Skip animation', exact: true }).click();
  assert.equal(await page.locator('#step-count').innerText(), '2 / 7');
  await page.screenshot({ animations: 'disabled', path: path.join(root, 'qa/desktop-modulus.png') });
  await page.waitForTimeout(280); await page.getByRole('button', { name: '← Back', exact: true }).click();
  assert.equal(await page.locator('[data-puzzle-note="RSA:0"]').count(), 1, 'back does not duplicate Alice’s text');
  assert.equal(await page.locator('#prime-p').inputValue(), '5'); await clickNext(page);
  for (let i = 0; i < 6; i++) await clickNext(page);
  assert.equal(await page.locator('body').getAttribute('data-phase'), 'INTERCEPT');
  await expectPortrait(page, 'surprised');
  await expectRival(page, 'standing', 136, 178); await expectRival(page, 'machine', 68, 89);
  await checkAttackSizes(page);
  assert.notEqual(await page.locator('.rival-speech').evaluate(e => getComputedStyle(e).transform), 'none');
  await page.locator('#stage').evaluate(e => { e.scrollTop = 0; });
  await page.screenshot({ animations: 'disabled', path: path.join(root, 'qa/desktop-interception.png') });
  await clickNext(page);
  await checkAttackSizes(page);
  await page.locator('#execution-mode').selectOption('live');
  await page.getByRole('button', { name: 'Run quantum attack →', exact: true }).click();
  await page.locator('.job-status.error').waitFor();
  await checkAttackSizes(page);
  assert.match(await page.locator('#job-status').innerText(), /not connected/);
  assert.equal(await page.locator('.leak-quote').count(), 0);
  await page.getByRole('button', { name: 'Explicitly switch to illustrative demo', exact: true }).click();
  await page.getByRole('button', { name: 'Run quantum attack →', exact: true }).evaluate(b => { b.click(); b.click(); });
  await page.locator('.job-status.success').waitFor();
  await checkAttackSizes(page);
  await clickNext(page);
  assert.match(await page.locator('#stage-body').innerText(), /SAMPLE MEASUREMENTS/);
  await checkAttackSizes(page);
  await page.getByRole('button', { name: 'All measurements ↗', exact: true }).click();
  assert(await page.locator('.measurement-data').isVisible());
  await page.locator('#close-about').click(); await checkAttackSizes(page);
  await page.screenshot({ animations: 'disabled', path: path.join(root, 'qa/desktop-measurements.png') });
  for (let i = 0; i < 4; i++) { await clickNext(page); await checkAttackSizes(page); }
  assert.equal(await page.locator('.leak-quote').innerText(), invitation);
  assert.equal(await page.evaluate(() => window.BAD), undefined);
  await clickNext(page);
  await page.getByRole('button', { name: 'Change only my message', exact: true }).waitFor();
  await expectPortrait(page, 'serious');
  await page.getByRole('button', { name: 'Change only my message', exact: true }).click();
  await page.getByRole('button', { name: 'Upgrade the protection →', exact: true }).waitFor();
  assert.match(await page.locator('#messages').innerText(), /New words, same vulnerable key/);
  await page.getByRole('button', { name: 'Upgrade the protection →', exact: true }).click();
  await clickNext(page); await clickNext(page);
  await page.screenshot({ animations: 'disabled', path: path.join(root, 'qa/desktop-exchange.png') });
  await clickNext(page); await clickNext(page); await ready(page);
  await expectRival(page, 'fallen', 68, 89);
  await page.locator('.rival-defeat').scrollIntoViewIfNeeded();
  await page.screenshot({ animations: 'disabled', path: path.join(root, 'qa/desktop-zeno-defeated.png') });
  await page.locator('#messages').evaluate(e => { e.scrollTop = e.scrollHeight; });
  await chooseReply(page);
  await page.getByRole('button', { name: 'Meet Alice ↗', exact: true }).waitFor();
  assert.match(await page.locator('#messages').innerText(), /It’s a date/);
  await expectPortrait(page, 'happy');
  assert.deepEqual([...portraitRequests].sort(), [...['idle', 'blushing', 'happy', 'serious', 'surprised'].map(name => 'mira-' + name + '-68x89.png'), 'redcoat-standing-136x178.png', 'machine-68x89.png', 'redcoat-fallen-68x89.png'].sort(), 'the five portraits and three supplied rival sprites load');
  assert.match(await page.locator('[data-draft] .message-note').innerText(), /Leaked/);
  await finishDate(page, 'garden', 'desktop');
  await page.screenshot({ animations: 'disabled', path: path.join(root, 'qa/desktop-ending.png') });
  await page.getByRole('button', { name: 'Play again ↺', exact: true }).click();
  assert.equal(await page.locator('body').getAttribute('data-phase'), 'MENU');
  assert.equal(await page.locator('.rival-defeat').count(), 0, 'replay clears the defeated pose');
  assert(await page.locator('#portrait').isHidden());
  await start(page);
  assert.equal(await page.locator('.message.user').count(), 0);
  assert.equal(await page.locator('.message.alice').count(), 3);
  console.log('PASS: complete desktop loop, click-anywhere intro, guarded entrance, Alice avatar, crisp pixel math scene, choices, recovery, replay.');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'reduce' });
  mobile.on('pageerror', e => errors.push(e.message));
  await mobile.goto(url);
  await mobile.screenshot({ animations: 'disabled', path: path.join(root, 'qa/mobile-intro.png') });
  await mobile.setViewportSize({ width: 320, height: 480 });
  await mobile.screenshot({ animations: 'disabled', path: path.join(root, 'qa/mobile-intro-compact.png') });
  assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight));
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.locator('#start-game').press('Enter'); await mobile.locator('#skip-balcony').click(); await ready(mobile);
  assert.equal(await mobile.locator('.portrait-wrap').evaluate(p => getComputedStyle(p).animationName), 'none', 'reduced motion disables sprite entrance and idle movement');
  await mobile.screenshot({ animations: 'disabled', path: path.join(root, 'qa/mobile-conversation.png') });
  for (const viewport of [{ width: 320, height: 480 }, { width: 844, height: 390 }]) {
    await mobile.setViewportSize(viewport);
    assert(await mobile.locator('#suggestions button').first().isVisible(), 'short screens must retain reply choices');
    assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight));
    assert(await mobile.locator('.compose-box').evaluate(b => b.getBoundingClientRect().bottom <= innerHeight));
  }
  await mobile.setViewportSize({ width: 390, height: 844 });
  const mobileInvitation = await begin(mobile, 1);
  const fits = p => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight && document.getElementById('composer').getBoundingClientRect().bottom <= innerHeight); 
  assert(await fits(mobile), 'mobile prime-entry layout must fit');
  await mobile.screenshot({ animations: 'disabled', path: path.join(root, 'qa/mobile-primes.png'), fullPage: true });
  await toIntercept(mobile);
  await assertStageLayout(mobile);
  assert(await fits(mobile), 'mobile circuit layout must fit');
  await mobile.getByRole('button', { name: 'Run quantum attack →', exact: true }).click();
  await mobile.locator('.job-status.success').waitFor(); await clickNext(mobile);
  for (let i = 0; i < 4; i++) await clickNext(mobile);
  assert.equal(await mobile.locator('.leak-quote').innerText(), mobileInvitation);
  assert(await fits(mobile), 'recovered invitation must fit');
  await mobile.screenshot({ animations: 'disabled', path: path.join(root, 'qa/mobile-reveal.png'), fullPage: true });
  await clickNext(mobile); await mobile.getByRole('button', { name: 'Upgrade the protection →', exact: true }).waitFor();
  await mobile.getByRole('button', { name: 'Upgrade the protection →', exact: true }).click();
  for (let i = 0; i < 4; i++) await clickNext(mobile);
  await ready(mobile); await expectRival(mobile, 'fallen', 68, 89);
  await mobile.locator('.rival-defeat').scrollIntoViewIfNeeded();
  await mobile.screenshot({ animations: 'disabled', path: path.join(root, 'qa/mobile-zeno-defeated.png') });
  await mobile.locator('#messages').evaluate(e => { e.scrollTop = e.scrollHeight; });
  await chooseReply(mobile, 1);
  await mobile.getByRole('button', { name: 'Meet Alice ↗', exact: true }).waitFor();
  assert(await fits(mobile));
  await mobile.waitForTimeout(200);
  assert(await mobile.locator('#new-messages').isHidden(), 'default play must follow the ending');
  await finishDate(mobile, 'dome', 'mobile');
  await mobile.screenshot({ animations: 'disabled', path: path.join(root, 'qa/mobile-ending.png'), fullPage: true });
  console.log('PASS: complete mobile loop, keyboard start, reduced motion, compact intro, both invitations, no outer overflow.');

  // Test-only live bridge: verifies asynchronous UI behavior, NOT quantum execution.
  await begin(page); await toIntercept(page);
  await page.evaluate(async () => {
    const adapter = await import('./js/quantum-adapter.js'); window.calls = 0;
    adapter.configureQollab({ backend: { testOnly: true }, runAttack: { callPromising: () => { window.calls++; return new Promise(resolve => { window.resolveTestJob = resolve; }); } } });
  });
  await page.locator('#execution-mode').selectOption('live');
  await page.getByRole('button', { name: 'Run quantum attack →', exact: true }).evaluate(b => { b.click(); b.click(); });
  assert.equal(await page.evaluate(() => window.calls), 1);
  await page.evaluate(async () => { const game = await import('./main.js'); await game.restart(); });
  assert.equal(await page.locator('body').getAttribute('data-phase'), 'MENU');
  assert.match(await page.locator('#messages').textContent(), /does not cancel it/);
  await page.evaluate(() => window.resolveTestJob({ status: 'success', distribution: { '00': 25, '01': 25, '10': 25, '11': 25 }, distribution_kind: 'counts' }));
  assert.equal(await page.locator('body').getAttribute('data-phase'), 'MENU');
  await start(page);
  assert.equal(await page.locator('body').getAttribute('data-phase'), 'INTRO');
  assert.equal(await page.locator('[data-puzzle-note]').count(), 0, 'restart clears puzzle chatter and cancels queued texts');
  assert.equal(await page.locator('.leak-quote').count(), 0);
  assert.equal(await page.locator('.message.rival').count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: duplicate live submission blocked, UI responsive, restart ignores stale result without claiming remote cancellation.');
})().then(async () => { if (browser) await browser.close(); server.kill(); }).catch(async e => { console.error(e); if (browser) await browser.close(); server.kill(); process.exitCode = 1; });
