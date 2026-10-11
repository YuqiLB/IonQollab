// Read-only inspection of the current production UI; captures go to a new folder.
const { chromium } = require(process.argv[2] + '/playwright');
const { mkdir } = require('node:fs/promises');
process.chdir(require('node:path').resolve(__dirname, '..'));
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await mkdir('qa/concepts', { recursive: true });
  await page.goto('http://127.0.0.1:4173');
  await page.getByRole('button', { name: 'Start Qrush', exact: true }).click();
  await page.waitForFunction(() => !document.getElementById('message').disabled);
  await page.screenshot({ path: 'qa/concepts/before-chat.png' });
  await page.locator('#suggestions button').first().click();
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await page.waitForFunction(() => !document.getElementById('message').disabled);
  await page.locator('#suggestions button').first().click();
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await page.locator('#prime-p').waitFor();
  await page.screenshot({ path: 'qa/concepts/before-rsa.png' });
  await page.getByRole('button', { name: 'Use demo values', exact: true }).click();
  for (let i = 0; i < 7; i++) { await page.waitForTimeout(300); await page.locator('#stage-nav button').last().click(); }
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'qa/concepts/before-intrusion.png' });
  console.log('Current chat, RSA and intrusion captured.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
