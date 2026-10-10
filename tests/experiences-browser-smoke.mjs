import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const port = 4325;
const base = 'http://127.0.0.1:' + port;
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: process.platform !== 'win32',
  env: process.env
});
let logs = '';
for (const stream of [server.stdout, server.stderr]) stream.on('data', (data) => { logs += data.toString(); });
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 65; attempt++) {
    if (server.exitCode !== null) throw new Error('Astro preview terminated early: ' + logs);
    try {
      const response = await fetch(base + '/experiences/', { signal: AbortSignal.timeout(1800) });
      if (response.ok) return;
    } catch { /* Boot is not complete yet. */ }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('Astro preview did not start: ' + logs);
}

function observeErrors(page, label, errors) {
  page.on('pageerror', (error) => errors.push(label + ': ' + error.message));
}

async function run() {
  await waitForServer();
  browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || undefined,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const errors = [];
  console.log('Browser smoke: preview running; loading desktop itinerary');
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  observeErrors(desktop, 'desktop', errors);
  desktop.setDefaultTimeout(12000);
  desktop.setDefaultNavigationTimeout(20000);

  const response = await desktop.goto(base + '/experiences/grand-diner-khmer/', { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200);
  assert.ok(await desktop.locator('[data-dinner-preview]').isVisible(), 'Shopping module must render');
  assert.ok(await desktop.locator('[data-kitchen-guide]').isVisible(), 'Kitchen module must render');
  await desktop.locator('[data-preview-guests="4"]').click();
  assert.match(await desktop.locator('[data-pack-guests]').innerText(), /4 personnes/);
  await desktop.locator('[data-preview-side-toggle]').check();
  assert.equal(await desktop.locator('[data-guide-dish="prahok-ktis"]').isVisible(), true);
  await desktop.locator('[data-guide-dish="prahok-ktis"]').click();
  assert.match(await desktop.locator('[data-guide-dish-title]').innerText(), /Prahok Ktis/);
  await desktop.locator('[data-service-time]').selectOption('19:30');
  assert.match(await desktop.locator('[data-pack-time]').innerText(), /19h30/);

  console.log('Browser smoke: desktop menu updated; testing download');
  const [download] = await Promise.all([
    desktop.waitForEvent('download'),
    desktop.locator('[data-pack-download]').click()
  ]);
  const filePath = await download.path();
  assert.ok(filePath, 'Download file should be written');
  const text = await fs.readFile(filePath, 'utf8');
  assert.match(text, /Prahok Ktis/);
  assert.match(text, /Nombre de convives : 4/);

  console.log('Browser smoke: download received; opening notebook');
  await desktop.locator('[data-pack-carnet]').click();
  await desktop.waitForURL('**/carnet-de-reception/**');
  assert.match(desktop.url(), /convives=4/);
  assert.match(desktop.url(), /service=19%3A30/);
  assert.match(desktop.url(), /partage=1/);
  assert.match(await desktop.locator('[data-reception-print-guests]').innerText(), /4 personnes/);
  assert.match(await desktop.locator('[data-reception-print-time]').innerText(), /19h30/);
  assert.match(await desktop.locator('[data-reception-print-menu]').innerText(), /Prahok Ktis/);
  assert.equal(await desktop.locator('[data-reception-side-tasting]').isVisible(), true);

  await desktop.locator('[data-reception-task]').first().check();
  assert.equal(await desktop.locator('[data-reception-progress]').getAttribute('value'), '1');
  await desktop.locator('[data-reception-side]').uncheck();
  assert.equal(await desktop.locator('[data-reception-side-tasting]').isHidden(), true);
  assert.equal(await desktop.locator('[data-reception-chapter-id="partage"]').isHidden(), true);
  assert.doesNotMatch(await desktop.locator('[data-reception-print-menu]').innerText(), /Prahok Ktis/);

  await desktop.emulateMedia({ media: 'print' });
  assert.equal(
    await desktop.locator('.reception-content').evaluate((el) => getComputedStyle(el).overflow),
    'visible', 'Print layout must never clip the multi-page notebook'
  );
  assert.equal(
    await desktop.locator('.site-nav').evaluate((el) => getComputedStyle(el).display),
    'none', 'Navigation must be absent from A4 print'
  );
  assert.equal(await desktop.locator('.reception-configuration-summary').isVisible(), true);
  await desktop.emulateMedia({ media: 'screen' });

  console.log('Browser smoke: desktop notebook + print style passed; loading mobile');
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  observeErrors(mobile, 'mobile', errors);
  mobile.setDefaultTimeout(12000);
  mobile.setDefaultNavigationTimeout(20000);
  const mobileResponse = await mobile.goto(base + '/experiences/grand-diner-khmer/', { waitUntil: 'networkidle' });
  assert.equal(mobileResponse.status(), 200);
  assert.ok(await mobile.locator('.dinner-journey-nav').isVisible());
  assert.ok(await mobile.locator('[data-preview-guests="6"]').isVisible());
  await mobile.locator('[data-preview-guests="6"]').click();
  assert.match(await mobile.locator('[data-pack-guests]').innerText(), /6 personnes/);
  const horizontalOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(horizontalOverflow <= 3, 'Mobile page must not overflow viewport: ' + horizontalOverflow + 'px');
  const mobileNotebook = await mobile.goto(base + '/experiences/grand-diner-khmer/carnet-de-reception/?convives=6&service=21%3A00&partage=1', { waitUntil: 'networkidle' });
  assert.equal(mobileNotebook.status(), 200);
  assert.match(await mobile.locator('[data-reception-print-guests]').innerText(), /6 personnes/);
  assert.match(await mobile.locator('[data-reception-print-time]').innerText(), /21h00/);
  assert.equal(await mobile.locator('[data-reception-side-tasting]').isVisible(), true);
  const notebookOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(notebookOverflow <= 3, 'Mobile notebook must not overflow viewport: ' + notebookOverflow + 'px');

  assert.deepEqual(errors, [], 'No browser JavaScript errors should occur');
  console.log('Experiences browser QA: PASS — desktop, mobile, download, optional dish, A4 print CSS, itinerary and access');
}

try {
  await run();
} catch (error) {
  console.error('Experiences browser QA: FAIL — ' + (error?.stack || error));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server.pid && process.platform !== 'win32') {
    try { process.kill(-server.pid, 'SIGTERM'); }
    catch { server.kill('SIGTERM'); }
  } else {
    server.kill('SIGTERM');
  }
}
