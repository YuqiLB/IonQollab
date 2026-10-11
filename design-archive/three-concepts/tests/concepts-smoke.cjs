// Optional browser QA using an existing developer Playwright installation.
// Usage: node tests/concepts-smoke.cjs /path/to/node_modules [base URL]
const { chromium } = require(process.argv[2] + '/playwright');
const assert = require('node:assert/strict');
const { mkdir, writeFile } = require('node:fs/promises');
const base = process.argv[3] || 'http://127.0.0.1:4173';
const message = 'Meet me on the observatory rooftop at midnight? ♥';
process.chdir(require('node:path').resolve(__dirname, '..'));
let browser;
(async () => {
  const { encrypt, makeKeys } = await import('../../../js/rsa.js');
  const expected = encrypt(message, makeKeys(3, 5));
  await mkdir('qa/concepts', { recursive: true });
  browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  const phase = value => page.waitForFunction(value => document.querySelector('.scene')?.dataset.phase === value, value);
  const checkLayout = async label => {
    const problems = await page.evaluate(() => {
      const problems = [];
      if (document.documentElement.scrollWidth > innerWidth) problems.push('Horizontal page overflow');
      for (const selector of ['.primary', '.letter', '.message-meta', '.dialogue', '.scene-footer']) {
        const node = document.querySelector(selector), r = node.getBoundingClientRect();
        if (r.left < -1 || r.right > innerWidth + 1) problems.push(selector + ' outside viewport horizontally');
        if (node.scrollHeight > node.clientHeight + 2 && selector === '.letter') problems.push('Message text clipped');
      }
      for (const image of document.querySelectorAll('.sprite')) {
        if (!image.complete || !image.naturalWidth) problems.push('Missing sprite');
        if (Math.abs(image.clientWidth / image.clientHeight - image.naturalWidth / image.naturalHeight) > .001) problems.push('Distorted sprite');
        if (getComputedStyle(image).imageRendering !== 'pixelated') problems.push('Non-crisp sprite');
      }
      const button = document.querySelector('.primary').getBoundingClientRect();
      const footer = document.querySelector('.scene-footer').getBoundingClientRect();
      if (button.bottom > footer.top) problems.push('Primary action overlaps footer');
      return problems;
    });
    assert.deepEqual(problems, [], label);
  };
  for (const concept of ['a', 'b', 'c']) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + '/design-archive/three-concepts/design-preview.html#' + concept);
    await phase('ready'); await page.waitForTimeout(750);
    assert.equal(await page.locator('.letter').innerText(), message);
    await checkLayout(concept + ' desktop ready');
    await page.screenshot({ path: `qa/concepts/${concept}-desktop-ready.png`, fullPage: true });
    await page.locator('.primary').focus();
    await page.keyboard.press('Enter');
    await phase('encrypting');
    await phase('sealed');
    await page.locator('.about').click();
    assert.deepEqual(JSON.parse(await page.locator('#packet-data').innerText()), expected, 'Actual UTF-8 toy ciphertext');
    await page.keyboard.press('Escape');
    await page.locator('.primary').click();
    await phase('warning'); await phase('impact'); await phase('intercepted'); await page.waitForTimeout(550);
    assert.match(await page.locator('.dialogue-line').innerText(), /A private invitation\? Cute/);
    await page.locator('.about').click();
    assert.equal(await page.locator('#packet-label').innerText(), 'The actual copied packet');
    assert.deepEqual(JSON.parse(await page.locator('#packet-data').innerText()), expected, 'The intercepted packet preserves every encrypted block');
    await page.keyboard.press('Escape');
    await checkLayout(concept + ' desktop intercepted');
    await page.screenshot({ path: `qa/concepts/${concept}-desktop-intercepted.png`, fullPage: true });
    await page.locator('.primary').click(); await phase('ready');
    // Replay cancels both text transformation and an in-flight intrusion.
    await page.locator('.primary').click(); await page.locator('.replay').click();
    await page.waitForTimeout(1200); await phase('ready');
    assert.equal(await page.locator('.letter').innerText(), message);
    await page.locator('.primary').click(); await page.locator('.skip').click(); await phase('sealed');
    await page.locator('.primary').click(); await page.locator('.replay').click();
    await page.waitForTimeout(2400); await phase('ready');
    for (const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]) {
      await page.setViewportSize(viewport);
      await checkLayout(concept + ' ready ' + viewport.width);
      if (viewport.width === 390) await page.screenshot({ path: `qa/concepts/${concept}-mobile-ready.png`, fullPage:true });
      await page.locator('.primary').click(); await page.locator('.skip').click(); await phase('sealed');
      await page.locator('.primary').click(); await page.locator('.skip').click(); await phase('intercepted'); await page.waitForTimeout(550);
      await checkLayout(concept + ' intercepted ' + viewport.width);
      if (viewport.width === 390) await page.screenshot({ path: `qa/concepts/${concept}-mobile-intercepted.png`, fullPage:true });
      await page.locator('.primary').click(); await phase('ready');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.primary').focus(); await page.keyboard.press('Enter'); await phase('sealed');
    await page.locator('.primary').focus(); await page.keyboard.press('Space'); await phase('intercepted');
    assert.equal(await page.locator('.intruder').evaluate(n => getComputedStyle(n).animationName), 'none');
    await page.locator('.primary').click(); await phase('ready');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base + '/design-archive/three-concepts/design-preview.html#a');
  await page.locator('.primary').click();
  await page.locator('a[data-concept="b"]').click();
  await page.waitForTimeout(1300); await phase('ready');
  assert.equal(await page.locator('.letter').innerText(), message);
  await page.locator('.primary').click(); await page.locator('.skip').click(); await page.locator('.primary').click();
  await page.locator('a[data-concept="c"]').click();
  await page.waitForTimeout(2400); await phase('ready');
  await page.locator('.primary').focus();
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  assert(await page.locator('.primary').evaluate(n => n === document.activeElement));
  assert.equal(await page.locator('.primary').evaluate(n => getComputedStyle(n).outlineStyle), 'solid');
  assert.deepEqual(errors, []);
  await writeFile('qa/concepts/browser-results.json', JSON.stringify({ result: 'passed', browser: await browser.version(), concepts: ['a','b','c'], viewports: ['1440x900','390x844','320x568','844x390'], packet: { bytes: expected.byteLength, blocks: expected.ciphertext.length }, pageErrors: errors, checks: ['actual packet equality', 'encrypt/send/anticipation/impact/recovery', 'full and mid-transition replay', 'skip', 'cross-concept cancellation', 'keyboard Enter/Space/focus', 'reduced motion', 'dialog Escape', 'sprite proportions and loading', 'horizontal overflow and action/footer separation'] }, null, 2));
  console.log('Three concepts passed desktop/mobile, packet equality, lifecycle and accessibility checks. Screenshots in qa/concepts.');
  await browser.close();
})().catch(async error => { console.error(error); if (browser) await browser.close(); process.exitCode = 1; });
