// Compose actual QA captures into a single review image. No runtime dependency.
const { chromium } = require(process.argv[2] + '/playwright');
const { readFile } = require('node:fs/promises');
process.chdir(require('node:path').resolve(__dirname, '..'));
(async () => {
  const names = ['A / Intimate handheld', 'B / Graphic confrontation', 'C / Hijacked interface'];
  const figures = await Promise.all(['a','b','c'].map(async (letter, i) => {
    const ready = await readFile(`qa/concepts/${letter}-desktop-ready.png`);
    const intercepted = await readFile(`qa/concepts/${letter}-desktop-intercepted.png`);
    return `<section><h2>${names[i]}</h2><img src="data:image/png;base64,${ready.toString('base64')}"/><p>THE INVITATION</p><img src="data:image/png;base64,${intercepted.toString('base64')}"/><p>THE INTRUSION</p></section>`;
  }));
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page = await browser.newPage({viewport:{width:1680,height:830},deviceScaleFactor:1});
  await page.setContent(`<html><head><style>*{box-sizing:border-box}body{margin:0;padding:25px 25px 10px;background:#f3efe6;color:#27242c;font-family:Arial}header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:15px}h1{font-size:30px;letter-spacing:-1px;margin:0}header p{font-size:12px;margin:0}main{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}h2{font-size:15px;margin:0 0 10px}img{display:block;width:100%;height:auto}section p{font:9px monospace;letter-spacing:1px;margin:8px 0 15px}</style></head><body><header><h1>Qrush / Three playable studies</h1><p>Same invitation. Same controls. Three ways to invade a private space.</p></header><main>${figures.join('')}</main></body></html>`);
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
  await page.screenshot({path:'qa/concepts/comparison.png',fullPage:true});
  await browser.close();
  console.log('Review comparison saved to qa/concepts/comparison.png');
})().catch(error => {console.error(error);process.exit(1)});
