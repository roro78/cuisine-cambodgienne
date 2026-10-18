import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

// Exercises the real compiled Astro site with the same single existing Coral MP3.
const base = 'http://127.0.0.1:4397';
const cli = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
const server = spawn(process.execPath, [cli, 'preview', '--host', '127.0.0.1', '--port', '4397'], {
  stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32'
});
let log = '';
for (const stream of [server.stdout, server.stderr]) stream.on('data', c => { log += String(c); });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
const workshops = [
  ['piler-aromates-au-mortier', 19.512],
  ['equilibrer-une-sauce', 19.008],
  ['saisir-viande-poele', 20.544],
  ['fraicheur-herbes-agrumes', 23.328],
  ['bouillon-leger-savoureux', 24.816],
  ['composer-repas-cambodgien', 21.648]
];

async function ready() {
  for (let i = 0; i < 65; i++) {
    if (server.exitCode !== null) throw Error('Astro preview stopped: ' + log);
    try {if ((await fetch(base + '/apprendre/')).ok) return;} catch {}
    await sleep(300);
  }
  throw Error('Astro preview failed to start: ' + log);
}
async function drag(page, selector, pixels) {
  const rect = await page.locator(selector).boundingBox();
  assert.ok(rect, 'Drag element exists');
  const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + pixels, { steps: 6 });
  await page.mouse.up();
}
try {
  await ready();
  browser = await chromium.launch({
    headless: true, executablePath: process.env.CHROME_BIN || undefined,
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  for (const [slug, start] of workshops) {
    for (const width of [390, 1440]) {
      const mobile = width === 390;
      const page = await browser.newPage({
        viewport: {width, height: mobile ? 844 : 900}, isMobile: mobile, hasTouch: mobile,
        reducedMotion: 'reduce'
      });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      try {
        const response = await page.goto(base + '/apprendre/' + slug + '/', {waitUntil:'domcontentloaded'});
        assert.equal(response?.status(), 200);
        assert.equal(await page.locator('[data-player-audio]').count(), 1);
        assert.equal(await page.locator('[data-mobile-chapter]').count(), 5);
        const mp3 = await page.request.get(base + '/audio/workshops/' + slug + '/atelier-coral.mp3');
        assert.equal(mp3.status(), 200);
        assert.match(mp3.headers()['content-type'] || '', /audio\/mpeg/i);
        const dock = page.locator('[data-player-mobile-dock]');
        assert.equal(await dock.count(), 1);
        if (mobile) {
          await page.locator('[data-workshop-tutorial]').scrollIntoViewIfNeeded();
          await page.waitForFunction(() =>
            document.querySelector('[data-player-mobile-dock]')?.getAttribute('data-dock-visible') === 'true'
          );
          assert.equal(await page.locator('.workshop-player-heading').isVisible(), false);
          assert.equal(await page.locator('.workshop-player-chapters').isVisible(), false);
          assert.equal(await page.locator('.workshop-player-transcript').isVisible(), false);
          assert.equal(await page.locator('.workshop-player-main-controls').isVisible(), false);
          assert.ok(await dock.isVisible());
          const box = await dock.boundingBox();
          assert.ok(box && Math.abs(box.y + box.height - 844) < 4 && box.height < 185);
          assert.equal(await page.locator('[data-mobile-sheet]').isVisible(), false);
          await page.locator('[data-mobile-toggle]').click();
          assert.equal(await page.locator('[data-mobile-toggle]').getAttribute('aria-expanded'),'true');
          assert.ok(await page.locator('[data-mobile-sheet]').isVisible());
          assert.ok(await page.locator('[data-mobile-backdrop]').isVisible());
          assert.ok(await page.evaluate(() => document.documentElement.classList.contains('workshop-sheet-open')));
          assert.equal(await page.locator('[data-mobile-chapter]').count(), 5);
          assert.ok((await page.locator('[data-mobile-transcript]').innerText()).length > 80);
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('[data-mobile-sheet]').isVisible(), false);
          assert.equal(await page.locator('[data-mobile-toggle]').getAttribute('aria-expanded'), 'false');

          // Actual pointer swipe upward from the compact handle; downward closes it.
          await drag(page, '[data-mobile-toggle]', -65);
          assert.equal(await page.locator('[data-mobile-sheet]').isVisible(), true);
          await drag(page, '[data-mobile-sheet-gesture]', 65);
          assert.equal(await page.locator('[data-mobile-sheet]').isVisible(), false);

          // Chapter selection from the expanded sheet uses the original audio element.
          await page.locator('[data-mobile-toggle]').click();
          await page.locator('[data-mobile-chapter="1"]').click();
          assert.equal(await page.locator('[data-mobile-sheet]').isVisible(), false);
          assert.equal((await page.locator('[data-mobile-chapter-count]').innerText()).toLocaleLowerCase('fr-FR'),'étape 1/4');
          assert.equal(await page.locator('[data-tutorial-step="1"]').isVisible(), true);
          assert.ok(await page.locator('[data-player-audio]').evaluate(a => a.currentTime) >= start - 0.05);
          assert.equal(await page.locator('[data-player-audio]').evaluate(a => a.paused),false);
          await page.locator('[data-mobile-toggle]').click();
          assert.equal(await page.locator('[data-player-audio]').evaluate(a => a.paused),false,
            'Opening navigation cannot pause narration');
          assert.equal(await page.locator('[data-mobile-chapter="1"]').getAttribute('aria-current'),'step');
          await page.locator('[data-mobile-sheet-close]').click();
          assert.equal(await page.locator('[data-player-audio]').evaluate(a => a.paused),false);
          await page.locator('[data-mobile-stop]').click();
          assert.equal(await page.locator('[data-player-audio]').evaluate(a => a.paused),true);
        } else {
          assert.equal(await dock.isVisible(),false);
          assert.equal(await page.locator('.workshop-player-heading').isVisible(),true);
          assert.equal(await page.locator('.workshop-player-chapters').isVisible(),true);
          assert.equal(await page.locator('.workshop-player-main-controls').isVisible(),true);
        }
        assert.deepEqual(errors, [], 'No JS page errors');
        console.log('BOTTOM_SHEET_PASS',slug,width);
      } finally {await page.close();}
    }
  }
  const small = await browser.newPage({viewport:{width:320,height:640},isMobile:true,hasTouch:true});
  try {
    await small.goto(base+'/apprendre/piler-aromates-au-mortier/',{waitUntil:'domcontentloaded'});
    await small.locator('[data-workshop-tutorial]').scrollIntoViewIfNeeded();
    await small.waitForFunction(() => document.querySelector('[data-player-mobile-dock]')?.dataset.dockVisible==='true');
    await small.locator('[data-mobile-toggle]').click();
    const overflow = await small.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 3, 'No horizontal overflow at 320px');
    assert.ok(await small.locator('[data-mobile-chapter]').first().isVisible());
    console.log('BOTTOM_SHEET_PASS 320px');
  } finally {await small.close();}
} catch (error) {
  console.error('BOTTOM_SHEET_FAIL',error?.stack || error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server.pid && process.platform !== 'win32') {
    try {process.kill(-server.pid, 'SIGTERM');} catch {server.kill('SIGTERM');}
  } else server.kill('SIGTERM');
}
