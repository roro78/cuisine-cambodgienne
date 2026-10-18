import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const port = 4385;
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
  for (let i = 0; i < 65; i++) {
    if (server.exitCode !== null) throw Error('Preview stopped: ' + logs);
    try { if ((await fetch(base + '/apprendre/equilibrer-une-sauce/')).ok) return; } catch {}
    await sleep(300);
  }
  throw Error('Astro preview unavailable: ' + logs);
}

async function audioState(page) {
  return page.locator('[data-player-audio]').evaluate(audio => ({
    paused: audio.paused, currentTime: audio.currentTime, duration: audio.duration
  }));
}

try {
  await ready();
  browser = await chromium.launch({
    headless: true, executablePath: process.env.CHROME_BIN || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  for (const width of [390, 1440]) {
    const mobile = width < 761;
    const page = await browser.newPage({
      viewport: { width, height: mobile ? 844 : 900 },
      hasTouch: mobile, isMobile: mobile, reducedMotion: 'reduce'
    });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    try {
      const response = await page.goto(base + '/apprendre/equilibrer-une-sauce/', { waitUntil: 'domcontentloaded' });
      assert.equal(response?.status(), 200);
      const mp3 = await page.request.get(base + '/audio/workshops/equilibrer-une-sauce/atelier-coral.mp3');
      assert.equal(mp3.status(), 200, 'MP3 must be deployed without TTS regeneration');
      assert.match(mp3.headers()['content-type'] || '', /audio\/mpeg/i);
      const dock = page.locator('[data-player-mobile-dock]');
      assert.equal(await dock.count(), 1);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 3,
        'No horizontal overflow at ' + width);
      if (mobile) {
        await page.locator('[data-workshop-tutorial]').scrollIntoViewIfNeeded();
        await page.waitForFunction(() =>
          document.querySelector('[data-player-mobile-dock]')?.getAttribute('data-dock-visible') === 'true'
        );
        assert.ok(await dock.isVisible(), 'Bottom dock visible on mobile inside tutorial');
        const geometry = await dock.evaluate(el => {
          const r = el.getBoundingClientRect();
          return { bottom: r.bottom, width: r.width, height: r.height, viewport: innerHeight };
        });
        assert.ok(Math.abs(geometry.bottom - geometry.viewport) <= 3, 'Dock must touch bottom edge');
        assert.ok(geometry.height < 185, 'Dock should stay compact');
        assert.equal(await page.locator('.workshop-player-main-controls').isVisible(), false,
          'Avoid duplicate mobile playback commands');
        await page.locator('[data-mobile-next]').click();
        await page.waitForTimeout(250);
        assert.equal((await page.locator('[data-mobile-chapter-count]').innerText()).toLocaleLowerCase('fr-FR'), 'étape 1/4');
        assert.equal(await page.locator('[data-tutorial-step="1"]').isVisible(), true);
        assert.ok((await audioState(page)).currentTime >= 19.008, 'Next seeks to true MP3 chapter boundary');
        await page.locator('[data-mobile-follow]').click();
        assert.equal(await page.locator('[data-mobile-follow]').getAttribute('aria-pressed'), 'true');
        await page.mouse.wheel(0, 420);
        await page.waitForTimeout(200);
        assert.equal(await page.locator('[data-mobile-follow]').getAttribute('aria-pressed'), 'false',
          'Manual scroll should disable follow');
        assert.equal((await audioState(page)).paused, false, 'Manual scroll never pauses audio');
        await page.locator('[data-mobile-stop]').click();
        const stopped = await audioState(page);
        assert.equal(stopped.paused, true);
        assert.ok(stopped.currentTime <= .05, 'Stop resets to start');
      } else {
        assert.equal(await dock.isVisible(), false, 'Desktop must not have a floating dock');
        assert.ok(await page.locator('.workshop-player-main-controls').isVisible(),
          'Desktop keeps full-sized existing player');
      }
      const other = await page.goto(base + '/apprendre/saisir-viande-poele/', { waitUntil: 'domcontentloaded' });
      assert.equal(other?.status(), 200);
      assert.equal(await page.locator('[data-workshop-chapter-player]').count(), 0,
        'Third workshop remains locked until independently validated');
      assert.deepEqual(errors, [], 'Uncaught browser errors');
      console.log('WORKSHOP_SAUCE_PASS ' + width);
    } finally {
      await page.close();
    }
  }
} catch (err) {
  console.error('WORKSHOP_SAUCE_FAIL ' + (err?.stack || err));
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server.pid && process.platform !== 'win32') {
    try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); }
  } else server.kill('SIGTERM');
}
