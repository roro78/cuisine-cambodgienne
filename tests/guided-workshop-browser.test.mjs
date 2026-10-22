import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const port = 4399;
const base = 'http://127.0.0.1:' + port;
const cli = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
const server = spawn(process.execPath, [cli, 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32'
});
let logs = '';
for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => { logs += String(chunk); });
let browser;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function ready() {
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw Error('Preview exited: ' + logs);
    try { if ((await fetch(base + '/apprendre/pratique/sauce-tamarin/')).ok) return; } catch {}
    await sleep(350);
  }
  throw Error('Preview not available: ' + logs);
}

try {
  await ready();
  browser = await chromium.launch({
    headless: true, executablePath: process.env.CHROME_BIN || undefined,
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  for (const width of [360, 390, 768, 1440]) {
    const mobile = width < 768;
    const page = await browser.newPage({
      viewport: { width, height: mobile ? 812 : 900 },
      hasTouch: mobile, isMobile: mobile, reducedMotion: 'reduce'
    });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    try {
      const response = await page.goto(base + '/apprendre/pratique/sauce-tamarin/', { waitUntil: 'networkidle' });
      assert.equal(response?.status(), 200, 'Pilot route status');
      assert.equal(await page.locator('h1').count(), 1, 'Exactly one visible H1');
      assert.match(await page.locator('h1').innerText(), /sauce au tamarin/i);
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content').then(s=>s.includes('noindex')), true);
      assert.equal(await page.locator('.guided-ingredients > li').count(), 6, 'Core and optional ingredients');
      assert.equal(await page.locator('.guided-step').count(), 6, 'Six cooking stages');
      assert.equal(await page.locator('[data-guided-done]').count(), 6, 'Six completion controls');
      assert.equal(await page.locator('[data-guided-meter]').evaluate(el => el.value), 0);
      assert.doesNotMatch(await page.locator('.guided-context').innerText(), /Source vérifiée|Cambodia Recipe|Autres références|fabriquer/i, 'No public documentary sources or banned wording');
      assert.equal(await page.locator('summary:text("Lire le brouillon de narration")').count(), 0,
        'Private voice drafts must not appear in public page');
      assert.equal(await page.locator('[data-workshop-chapter-player]').count(), 0,
        'No historical Coral player reused for the guided atelier');
      assert.equal(await page.locator('[data-guided-audio]').count(), 1, 'Dedicated guide MP3 must be present');
      assert.equal(await page.locator('[data-guided-chapter]').count(), 7, 'Intro + 6 independently accessible guided chapters');
      assert.equal(await page.locator('[data-guided-audio]').getAttribute('src'), '/audio/workshops/pratique-sauce-tamarin/atelier-coral.mp3');
      assert.match(await page.locator('.guided-audio-review').innerText(), /préécoute/i, 'Preview has not received acoustic approval');
      assert.equal(await page.locator('[data-guided-chapter="0"]').getAttribute('aria-current'), 'true');
      await page.locator('[data-guided-chapter="2"]').click();
      assert.equal(await page.locator('[data-guided-chapter="2"]').getAttribute('aria-current'), 'true');
      await page.locator('.guided-audio-text summary').click();
      assert.match(await page.locator('[data-guided-audio-transcript]').innerText(), /Faites chauffer en remuant/i);
      assert.equal(await page.locator('.guided-ingredient-image img').evaluate(img =>
        img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0), true, 'Hero ingredient image');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 3, 'Horizontal viewport overflow ' + overflow + 'px at width ' + width);
      const first = page.locator('[data-guided-done]').first();
      await first.check();
      assert.equal(await page.locator('[data-guided-meter]').evaluate(el => el.value), 1);
      assert.match(await page.locator('[data-guided-count]').innerText(), /1 étape sur 6 terminée/);
      await page.locator('[data-guided-done]').last().check();
      assert.equal(await page.locator('[data-guided-meter]').evaluate(el => el.value), 2);
      assert.match(await page.locator('[data-guided-count]').innerText(), /2 étapes sur 6 terminées/);
      await first.uncheck();
      assert.equal(await page.locator('[data-guided-meter]').evaluate(el => el.value), 1);
      await page.locator('.guided-step details summary').first().click();
      assert.equal(await page.locator('.guided-step details[open]').count(), 1, 'Chef tips expand');
      assert.equal(await page.locator('a.guided-next').count(), 5);
      assert.deepEqual(errors, [], 'Browser errors at width '+width);
      console.log('GUIDED_TAMARIND_BROWSER_PASS '+width);
    } finally {
      await page.close();
    }
  }
} catch (err) {
  console.error('GUIDED_TAMARIND_BROWSER_FAIL ' + (err?.stack || err));
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server.pid && process.platform !== 'win32') {
    try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); }
  } else server.kill('SIGTERM');
}
