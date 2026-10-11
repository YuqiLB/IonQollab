// Scene flow + visual QA. Reuses a developer Playwright installation, no player dependency.
const { chromium } = require(require('node:path').join(process.argv[2], 'playwright'));
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'qa/scenes');
const server = spawn(process.execPath, ['tools/serve.mjs'], { cwd: root, env: { ...process.env, PORT: '4176' }, windowsHide: true, stdio: 'pipe' });
let browser;
(async () => {
  await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(Error('Server exited ' + code))); setTimeout(() => reject(Error('Server timeout')), 10000).unref(); });
  browser = await chromium.launch({ headless: true, executablePath: process.argv[3] || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  await mkdir(out, { recursive: true });
  const errors = [], checks = [];
  const p = await browser.newPage();
  p.on('pageerror', e => errors.push(e.message));
  const start = async () => { await p.goto('http://127.0.0.1:4176'); await p.locator('#start-game').press('Enter'); await p.evaluate(() => document.fonts.ready); };
  const fit = async () => {
    const issues = await p.evaluate(() => {
      const problems = [];
      const visible = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
      for (const selector of ['.vn-dialogue', '#balcony-choices button', '#skip-balcony', '#dialogue-advance', '.conversation-panel', '#suggestions button', '#send']) {
        for (const node of document.querySelectorAll(selector)) {
          if (!visible(node)) continue;
          const b = node.getBoundingClientRect();
          if (b.top < -1 || b.left < -1 || b.right > innerWidth + 1 || b.bottom > innerHeight + 1) problems.push(selector + ' outside viewport');
        }
      }
      const choices = document.getElementById('balcony-choices'), dialogue = document.querySelector('.vn-dialogue');
      if (visible(choices) && choices.children.length && choices.getBoundingClientRect().bottom > dialogue.getBoundingClientRect().top) problems.push('choices overlap dialogue');
      if (document.documentElement.scrollWidth > innerWidth) problems.push('outer horizontal overflow');
      if (document.getElementById('game').dataset.scene === 'desk') {
        const box = document.querySelector('.conversation-panel').getBoundingClientRect();
        if (Math.abs(box.left - (innerWidth - box.right)) > 2) problems.push('chat not centered');
        if (visible(document.querySelector('.portrait-panel'))) problems.push('large portrait visible at desk');
      }
      return problems;
    });
    assert.deepEqual(issues, [], JSON.stringify(p.viewportSize()));
  };
  const sizes = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'compact', width: 320, height: 480 },
    { name: 'landscape', width: 844, height: 390 },
  ];
  for (const [index, size] of sizes.entries()) {
    await p.setViewportSize({ width: size.width, height: size.height });
    await p.emulateMedia({ reducedMotion: index ? 'reduce' : 'no-preference' });
    await start(); await p.waitForTimeout(500);
    await fit();
    assert.equal(await p.locator('body').getAttribute('data-phase'), 'BALCONY');
    assert.equal(await p.locator('.message').count(), 0, 'texting waits for desk');
    assert(await p.locator('#dialogue-advance').isDisabled(), 'a required choice cannot be bypassed');
    assert(await p.locator('.conversation-panel').evaluate(e => e.inert));
    assert(await p.locator('#portrait').evaluate(e => e.naturalWidth === 68 && e.naturalHeight === 89 && getComputedStyle(e).objectFit === 'contain'));
    await p.screenshot({ path: path.join(out, size.name + '-balcony.png'), animations: 'disabled' });
    const branch = index % 2;
    const choice = p.locator('#balcony-choices button').nth(branch);
    const reply = await choice.textContent();
    await choice.press('Enter');
    assert.equal(await p.locator('#balcony-speaker').textContent(), 'Bob');
    assert.equal(await p.locator('#balcony-line').textContent(), reply);
    await p.locator('#dialogue-advance').press('Enter');
    assert.equal(await p.locator('#portrait').getAttribute('data-expression'), branch ? 'blushing' : 'happy');
    assert.match(await p.locator('#balcony-line').textContent(), branch ? /much better excuse/ : /walk with you/);
    await fit();
    // The namebar and body are both part of the hit target; the footer isn't required.
    await p.locator('#dialogue-advance').click({ position: { x: 15, y: 15 } });
    assert.equal(await p.locator('#balcony-speaker').textContent(), 'Alice');
    await p.locator('#dialogue-advance').dblclick({ position: { x: 30, y: 90 } });
    assert.equal(await p.locator('#balcony-speaker').textContent(), 'Bob', 'double-click advances only one beat');
    await p.locator('#dialogue-advance').press('Space');
    assert.equal(await p.locator('#balcony-next').textContent(), 'Back to my desk ↗');
    await p.locator('#dialogue-advance').press('Enter');
    await p.waitForFunction(() => !document.getElementById('message').disabled);
    await fit();
    assert.equal(await p.locator('.message.alice').count(), 3);
    assert.equal(await p.locator('#game').getAttribute('data-scene'), 'desk');
    assert.equal(await p.locator('body').getAttribute('data-phase'), 'INTRO');
    if (index) assert.equal(await p.locator('.conversation-panel').evaluate(e => getComputedStyle(e).animationName), 'none');
    await p.screenshot({ path: path.join(out, size.name + '-desk.png'), animations: 'disabled' });
    checks.push(size.name + ': keyboard branch, expression, scene transition, centered chat, viewport fit');
  }
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  await start();
  await p.locator('#skip-balcony').evaluate(e => { e.click(); e.click(); });
  assert.equal(await p.locator('body').getAttribute('data-phase'), 'RETURN');
  await p.evaluate(async () => (await import('./main.js')).restart());
  await p.waitForTimeout(700);
  assert.equal(await p.locator('body').getAttribute('data-phase'), 'MENU');
  assert.equal(await p.locator('#game').getAttribute('data-scene'), 'balcony');
  assert(await p.locator('#scene-transition').isHidden());
  assert.equal(await p.locator('.message').count(), 0, 'stale return does not start texting');
  await p.locator('#start-game').click(); await p.locator('#skip-balcony').click();
  await p.waitForFunction(() => !document.getElementById('message').disabled);
  assert.equal(await p.locator('.message.alice').count(), 3, 'skip starts exactly one conversation');
  assert.deepEqual(errors, []);
  checks.push('skip, duplicate click, restart during return, stale transition guard, no page errors');
  await writeFile(path.join(out, 'results.json'), JSON.stringify({ checks, errors }, null, 2));
  console.log(checks.map(c => 'PASS: ' + c).join('\n'));
})().then(async () => { if (browser) await browser.close(); server.kill(); }).catch(async e => { console.error(e); if (browser) await browser.close(); server.kill(); process.exitCode = 1; });
