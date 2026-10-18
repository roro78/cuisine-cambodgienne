import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

// Run after "npm run build" with CHROME_BIN set if Chromium is not on PATH.
// Deliberately scope the assertions to the audio dock: the desktop workshop
// design and all other (not yet activated) workshops must remain unchanged.
const port = 4387;
const base = 'http://127.0.0.1:' + port;
const cli = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
const server = spawn(process.execPath, [cli, 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: process.platform !== 'win32'
});
let logs = '';
for (const stream of [server.stdout, server.stderr]) {
  stream.on('data', (chunk) => { logs += String(chunk); });
}
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
let browser;

async function waitForServer() {
  for (let n = 0; n < 50; n++) {
    if (server.exitCode !== null) throw Error('Astro preview exited: ' + logs);
    try {
      if ((await fetch(base + '/apprendre/', { signal: AbortSignal.timeout(1500) })).ok) return;
    } catch {}
    await sleep(350);
  }
  throw Error('Astro preview unavailable: ' + logs);
}

async function verifyMobile(width, height) {
  const page = await browser.newPage({
    viewport: { width, height }, isMobile: true, hasTouch: true,
    reducedMotion: 'reduce'
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    const response = await page.goto(base + '/apprendre/piler-aromates-au-mortier/', { waitUntil: 'domcontentloaded' });
    assert.equal(response?.status(), 200);
    const dock = page.locator('[data-workshop-chapter-player]');
    await page.waitForFunction(() => document.querySelector('[data-workshop-chapter-player]')?.dataset.playerEnhanced === 'true');
    const geometry = await dock.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { position: getComputedStyle(el).position, bottom: rect.bottom, height: rect.height };
    });
    assert.equal(geometry.position, 'fixed', 'mobile dock must stay fixed');
    assert.ok(Math.abs(geometry.bottom - height) <= 2, 'dock should touch bottom of viewport');
    assert.ok(geometry.height < 155, 'collapsed dock must remain compact, got ' + geometry.height);

    assert.equal(await page.locator('[data-player-audio]').count(), 1, 'one audio element only');
    assert.equal(await page.locator('.workshop-player-extras').isVisible(), false, 'options closed initially');
    assert.equal(await page.locator('[data-player-mobile-toggle]').getAttribute('aria-expanded'), 'false');
    await page.locator('[data-player-mobile-toggle]').click();
    assert.equal(await page.locator('.workshop-player-extras').isVisible(), true, 'options should expand');
    assert.equal(await page.locator('[data-player-mobile-toggle]').getAttribute('aria-expanded'), 'true');
    await page.locator('[data-player-chapter="2"]').click();
    assert.equal(await page.locator('[data-player-mobile-toggle]').getAttribute('aria-expanded'), 'false', 'chapter selection closes panel');
    assert.equal(await page.locator('[data-player-mobile-chapter]').innerText(), 'Étape 2 · ' +
      (await page.locator('[data-player-chapter="2"] strong').innerText()));
    assert.equal(await page.locator('[data-workshop-progress-link="2"]').getAttribute('aria-current'), 'step', 'photo and text follow chapter');

    await page.locator('[data-player-mobile-toggle]').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-player-mobile-toggle]').getAttribute('aria-expanded'), 'false', 'Escape closes panel');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const bottomAfterScroll = await dock.evaluate((el) => el.getBoundingClientRect().bottom);
    assert.ok(Math.abs(bottomAfterScroll - height) <= 2, 'dock stays fixed after scroll');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 3, 'no horizontal overflow, got ' + overflow + 'px');
    await page.screenshot({ path: 'artifacts/audio-dock-' + width + '.png', fullPage: false });

    const inactive = await page.goto(base + '/apprendre/equilibrer-une-sauce/', { waitUntil: 'domcontentloaded' });
    assert.equal(inactive?.status(), 200);
    assert.equal(await page.locator('[data-workshop-chapter-player]').count(), 0, 'other workshop audio stays unreleased');
    assert.deepEqual(errors, [], 'browser errors');
    console.log('AUDIO_DOCK_MOBILE ' + width + ' PASS');
  } finally { await page.close(); }
}

async function verifyDesktop() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  try {
    await page.goto(base + '/apprendre/piler-aromates-au-mortier/', { waitUntil: 'domcontentloaded' });
    const dock = page.locator('[data-workshop-chapter-player]');
    await page.waitForFunction(() => document.querySelector('[data-workshop-chapter-player]')?.dataset.playerEnhanced === 'true');
    assert.notEqual(await dock.evaluate((el) => getComputedStyle(el).position), 'fixed', 'desktop layout unchanged');
    assert.equal(await page.locator('[data-player-mobile-toggle]').isVisible(), false, 'mobile toggle hidden on desktop');
    assert.equal(await page.locator('.workshop-player-chapters').isVisible(), true, 'desktop chapter cards remain visible');
    assert.equal(await page.locator('[data-player-play]').isVisible(), true);
    console.log('AUDIO_DOCK_DESKTOP PASS');
  } finally { await page.close(); }
}

try {
  await fs.mkdir('artifacts', { recursive: true });
  await waitForServer();
  browser = await chromium.launch({
    headless: true, executablePath: process.env.CHROME_BIN || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  await verifyMobile(390, 844);
  await verifyMobile(320, 640);
  await verifyDesktop();
  console.log('WORKSHOP_AUDIO_DOCK_PASS');
} catch (error) {
  console.error('WORKSHOP_AUDIO_DOCK_FAIL ' + (error?.stack || error));
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server.pid && process.platform !== 'win32') {
    try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); }
  } else server.kill('SIGTERM');
}
