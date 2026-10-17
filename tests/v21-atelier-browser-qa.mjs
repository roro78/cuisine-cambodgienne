import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const port = 4377;
const base = 'http://127.0.0.1:' + port;
const cli = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
const server = spawn(process.execPath, [cli, 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32'
});
let logs = '';
for (const stream of [server.stdout, server.stderr]) stream.on('data', (chunk) => { logs += String(chunk); });
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const routes = [
  'piler-aromates-au-mortier', 'equilibrer-une-sauce', 'saisir-viande-poele',
  'fraicheur-herbes-agrumes', 'bouillon-leger-savoureux', 'composer-repas-cambodgien'
];
let browser;
async function ready() {
  for (let i = 0; i < 55; i++) {
    if (server.exitCode !== null) throw Error('Astro preview exited: ' + logs);
    try { if ((await fetch(base + '/apprendre/', { signal: AbortSignal.timeout(1700) })).ok) return; } catch {}
    await sleep(350);
  }
  throw Error('Astro preview unavailable: ' + logs);
}
async function verify(width, height) {
  const mobile = width < 700;
  const page = await browser.newPage({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
  page.setDefaultTimeout(14000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    for (const slug of routes) {
      const res = await page.goto(base + '/apprendre/' + slug + '/', { waitUntil: 'domcontentloaded' });
      assert.equal(res?.status(), 200, slug + ' route');
      assert.equal(await page.locator('.workshop-experience-photo img').count(), 1, slug + ' hero');
      assert.equal(await page.locator('.workshop-tutorial-step').count(), 4, slug + ' four gestures');
      assert.equal(await page.locator('.workshop-tutorial[data-enhanced="true"]').count(), 1, slug + ' interactive enhancement');
      await page.waitForFunction(() => {
        const image = document.querySelector('.workshop-experience-photo img');
        return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
      });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 3, slug + ' viewport overflow ' + overflow + ' px at ' + width);
      assert.equal(await page.locator('.workshop-tutorial-step:visible').count(), 1, slug + ' first step only');
      assert.equal(await page.locator('[data-workshop-progress-link="1"]').getAttribute('aria-current'), 'step');
      if (slug === 'piler-aromates-au-mortier') {
        assert.equal(await page.locator('.workshop-tutorial-step [src*="mortier-etape-"]').count(), 5,
          'Mortar includes 3 step photos and 2 comparison photos');
      } else {
        assert.equal(await page.locator('.workshop-infographic:visible').count(), 1, slug + ' bespoke educational graphic');
      }
      if (slug !== 'piler-aromates-au-mortier') {
        const firstGraphic = page.locator('.workshop-stage-graphic:visible');
        assert.equal(await firstGraphic.getAttribute('data-stage-number'), '1',
          slug + ' first stage visual must be unique');
        const clip = firstGraphic.locator('.workshop-stage-photo-clip img');
        assert.equal(await clip.count(), 1, slug + ' first lesson has a photo crop');
        await page.waitForFunction(() => {
          const image = document.querySelector('.workshop-stage-graphic:not([hidden]) .workshop-stage-photo-clip img');
          return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
        }, { timeout: 14000 });
      }
      await page.locator('[data-tutorial-next]').click();
      assert.equal(await page.locator('.workshop-tutorial-step:visible').count(), 1, slug + ' after next');
      assert.equal(await page.locator('[data-workshop-progress-link="2"]').getAttribute('aria-current'), 'step');
      assert.equal(await page.locator('[data-tutorial-counter]').innerText(), 'Étape 2 sur 4');
      if (slug !== 'piler-aromates-au-mortier') {
        assert.equal(await page.locator('.workshop-stage-graphic:visible').getAttribute('data-stage-number'), '2',
          slug + ' second lesson graphic differs from first');
        assert.equal(await page.locator('.workshop-stage-photo-clip:visible').count(), 0,
          slug + ' stage 2 should not merely repeat the stage 1 photograph');
      }

      await page.locator('.workshop-tutorial-step:visible .workshop-tutorial-answer summary').click();
      assert.equal(await page.locator('.workshop-tutorial-step:visible .workshop-tutorial-answer[open]').count(), 1);
      if (slug !== 'piler-aromates-au-mortier') {
        await page.locator('[data-workshop-progress-link="3"]').click();
        assert.equal(await page.locator('.workshop-stage-graphic:visible').getAttribute('data-stage-number'), '3');
      }
      await page.locator('[data-workshop-progress-link="4"]').click();
      assert.equal(await page.locator('[data-workshop-progress-link="4"]').getAttribute('aria-current'), 'step');
      if (slug !== 'piler-aromates-au-mortier') {
        assert.equal(await page.locator('.workshop-stage-graphic:visible').getAttribute('data-stage-number'), '4');
      }
      await page.locator('[data-tutorial-next]').click();
      assert.equal(await page.locator('[data-tutorial-counter]').innerText(), 'Étape 1 sur 4', 'last -> restart');
      if (slug === 'piler-aromates-au-mortier') {
        await page.waitForFunction(() => {
          const image = document.querySelector('.workshop-tutorial-step:not([hidden]) .workshop-tutorial-photo img');
          return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
        }, { timeout: 15000 });
      }
      if (mobile) {
        const firstTab = page.locator('[data-workshop-progress-link="1"]');
        const visibility = await firstTab.evaluate((el) => {
          const nav = el.closest('[data-workshop-progress]');
          if (!nav) return { visible: false };
          const tab = el.getBoundingClientRect();
          const area = nav.getBoundingClientRect();
          return { visible: tab.right > area.left && tab.left < area.right && tab.width > 0 };
        });
        assert.ok(visibility.visible, slug + ' first stage tab must be visible after restart');
      }
      if (['piler-aromates-au-mortier', 'equilibrer-une-sauce'].includes(slug)) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: 'artifacts/v21-' + slug + '-' + width + '.png',
          fullPage: true, animations: 'disabled'
        });
      }
      console.log('V21_ATELIER ' + slug + ' ' + width + ' PASS');
    }
    assert.deepEqual(errors, [], 'Browser errors ' + JSON.stringify(errors));
  } finally { await page.close(); }
}
try {
  await fs.mkdir('artifacts', { recursive: true });
  await ready();
  browser = await chromium.launch({
    headless: true, executablePath: process.env.CHROME_BIN || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  await verify(1440, 900);
  await verify(390, 844);
  console.log('V21 ATELIER BROWSER QA PASS');
} catch (error) {
  console.error('V21 ATELIER BROWSER QA FAIL ' + (error?.stack || error));
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server.pid && process.platform !== 'win32') {
    try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); }
  } else server.kill('SIGTERM');
}
