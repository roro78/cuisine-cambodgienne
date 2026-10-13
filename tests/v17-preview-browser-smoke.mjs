import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const port = 4332;
const base = 'http://127.0.0.1:' + port;
const astroCli = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
const server = spawn(process.execPath, [astroCli, 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: process.platform !== 'win32',
  env: process.env
});
let logs = '';
for (const stream of [server.stdout, server.stderr]) {
  stream.on('data', (data) => { logs += data.toString(); });
}
let browser;
const errors = [];

async function waitForServer() {
  for (let i = 0; i < 65; i++) {
    if (server.exitCode !== null) throw new Error('Astro preview exited early: ' + logs);
    try {
      const res = await fetch(base + '/v17-preview/', { signal: AbortSignal.timeout(1500) });
      if (res.ok) return;
    } catch { /* server still booting */ }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('Astro preview did not start: ' + logs);
}

function listenErrors(page, name) {
  page.on('pageerror', (error) => errors.push(name + ': ' + error.message));
}

async function inspectViewport(width, height, screenshotPath, options = {}) {
  const page = await browser.newPage({
    viewport: { width, height },
    isMobile: width < 761,
    hasTouch: width < 761,
    reducedMotion: options.reduced ? 'reduce' : 'no-preference'
  });
  listenErrors(page, String(width));
  page.setDefaultTimeout(12000);
  try {
    const response = await page.goto(base + '/v17-preview/', { waitUntil: 'networkidle' });
    assert.equal(response?.status(), 200, 'Prototype route should return 200 at ' + width);
    assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
    assert.equal(await page.locator('h1').count(), 1, 'Exactly one H1');
    assert.ok(await page.locator('.v17-hero-photo').isVisible());
    assert.equal(await page.locator('.v17-actions a').count(), 2);
    assert.equal(await page.locator('.v17-actions a').first().getAttribute('href'), '/recettes/');
    assert.equal(await page.locator('.v17-actions a').last().getAttribute('href'), '/apprendre/');
    assert.equal(await page.locator('.v17-gesture-study').count(), 1, 'Pedagogical study must exist');
    assert.equal(await page.locator('[data-v17-bridge]').count(), 2, 'Market→gesture and gesture→table interludes');
    assert.equal(await page.locator('[data-v17-parallax]').count(), 2, 'Parallax limited to two existing photos');
    assert.equal(await page.locator('.v17-gesture-paste img').getAttribute('alt'), "Kroeung rouge après broyage : exemple photographié d'une pâte obtenue");
    assert.equal(await page.locator('.v17-gesture-study ol li').count(), 3);
    assert.match(await page.locator('.v17-table-photo figcaption').innerText(), /Phnom Penh/);
    assert.ok(await page.locator('.v17-preview-legal a[href="/credits-photos/"]').count());
    await page.waitForFunction(() => {
      const image = document.querySelector('.v17-hero-photo img');
      return image?.complete && image.naturalWidth > 0;
    });
    const dims = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    assert.ok(dims.scroll - dims.client <= 2,
      'Horizontal overflow at ' + width + ': ' + JSON.stringify(dims));
    const buttons = await page.locator('.v17-actions a').evaluateAll((links) =>
      links.map((el) => ({ w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height }))
    );
    assert.ok(buttons.every((button) => button.h >= 42), 'Hero links must have >=42px height');
    if (options.reduced) {
      const transform = await page.locator('.v17-hero-photo img').evaluate((img) =>
        getComputedStyle(img).transform
      );
      assert.equal(transform, 'none', 'Reduced motion must disable hero parallax');
      const imageTransforms = await page.locator('[data-v17-parallax]').evaluateAll((images) =>
        images.map((img) => getComputedStyle(img).transform)
      );
      assert.ok(imageTransforms.every((value) => value === 'none'), 'Reduced motion must disable all photo parallax');
    }
    if (width === 390) {
      const menu = page.locator('[data-mobile-menu]');
      await menu.locator('summary').click();
      assert.equal(await menu.evaluate((el) => el.open), true, 'Mobile menu opens');
      await page.keyboard.press('Escape');
      assert.equal(await menu.evaluate((el) => el.open), false, 'Escape closes mobile menu');
    }
    // GSAP reveals sections as they enter the viewport. Do not assert they are
    // visible at scrollY=0 before their ScrollTrigger has run.
    for (const selector of ['.v17-intro', '.v17-market', '.v17-bridge-market', '.v17-gesture-study', '.v17-bridge-table', '.v17-table', '.v17-finale']) {
      await page.locator(selector).first().evaluate((element) =>
        element.scrollIntoView({ block: 'center', behavior: 'instant' })
      );
      await page.waitForTimeout(170);
    }
    await page.waitForTimeout(850);
    assert.ok(await page.locator('.v17-gesture-study').isVisible(), 'Scene appears after scrolling');
    assert.ok(await page.locator('.v17-bridge-market h2').isVisible(), 'First transition title stays accessible');
    assert.ok(await page.locator('.v17-bridge-table h2').isVisible(), 'Second transition title stays accessible');
    const bridgeLines = await page.locator('.v17-bridge-trace').evaluateAll((lines) =>
      lines.map((el) => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }))
    );
    assert.ok(bridgeLines.every((l) => l.width > 120 && l.height >= 2), 'Transition traces rendered');
    await page.waitForFunction(() => {
      const market = document.querySelector('.v17-market-large img');
      const paste = document.querySelector('.v17-gesture-paste img');
      const table = document.querySelector('.v17-table-photo img');
      return market?.complete && market.naturalWidth > 0 &&
             paste?.complete && paste.naturalWidth > 0 &&
             table?.complete && table.naturalWidth > 0;
    }, null, { timeout: 10000 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(160);
    if (screenshotPath) {
      await fs.mkdir('artifacts', { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
    }
    console.log('V17 browser: ' + width + 'x' + height + (options.reduced ? ' reduced' : '') + ' PASS');
  } finally {
    await page.close();
  }
}

try {
  await waitForServer();
  browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || undefined,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  await inspectViewport(1440, 900, 'artifacts/v17-preview-1440.png');
  await inspectViewport(390, 844, 'artifacts/v17-preview-390.png');
  await inspectViewport(360, 800, null);
  await inspectViewport(768, 1024, null);
  await inspectViewport(320, 640, null);
  await inspectViewport(390, 844, null, { reduced: true });
  assert.deepEqual(errors, [], 'No runtime JavaScript errors');
  console.log('V17 preview browser QA: PASS — noindex, responsiveness, photography, navigation, reduced motion');
} catch (error) {
  console.error('V17 preview browser QA: FAIL — ' + (error?.stack || error));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server.pid && process.platform !== 'win32') {
    try { process.kill(-server.pid, 'SIGTERM'); }
    catch { server.kill('SIGTERM'); }
  } else server.kill('SIGTERM');
}
