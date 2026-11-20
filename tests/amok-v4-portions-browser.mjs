import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';
import { chromium } from 'playwright-core';

const dist = resolve('dist');
const reference = resolve('releases/amok-trey-v4');
const manifest = JSON.parse(readFileSync(join(reference, 'manifest.json'), 'utf8'));
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.png':'image/png' };
const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const asset = manifest.runtime.find(item => '/' + item.path === url.pathname);
  const file = url.pathname === '/reference/' ? join(reference, 'recipe-before.html')
    : asset ? join(reference, asset.file)
    : resolve(dist, url.pathname.slice(1), url.pathname.endsWith('/') ? 'index.html' : '');
  if ((!file.startsWith(dist + sep) && !file.startsWith(reference + sep)) || !existsSync(file)) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'content-type':types[extname(file)] ?? 'application/octet-stream' });
  response.end(readFileSync(file));
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
const expected = new Map([
  [1, { ingredients:['150','62,5','¾','½','¼','¼','2','8'], reserve:'environ 4 ml', milk:'62,5 ml', paste:'¾ c. à soupe' }],
  [2, { ingredients:['300','125','1 ½','1','½','½','2','8'], reserve:'7,5 ml', milk:'125 ml', paste:'1 ½ c. à soupe' }],
  [4, { ingredients:['600','250','3','2','1','1','2','8'], reserve:'15 ml', milk:'250 ml', paste:'3 c. à soupe' }],
  [8, { ingredients:['1200','500','6','4','2','2','2','8'], reserve:'30 ml', milk:'500 ml', paste:'6 c. à soupe' }],
  [12, { ingredients:['1800','750','9','6','3','3','2','8'], reserve:'45 ml', milk:'750 ml', paste:'9 c. à soupe' }]
]);
const urls = [origin + '/reference/', origin + '/recettes/amok-trey/'];
if (process.argv.includes('--live')) urls.push('https://www.cuisine-du-cambodge.com/recettes/amok-trey/');
const observations = [];
try {
  browser = await chromium.launch(process.env.CHROME_BIN
    ? { executablePath:process.env.CHROME_BIN }
    : { channel:'chrome' });
  for (const url of urls) {
    const page = await browser.newPage();
    const allowed = new URL(url).origin;
    await page.route(location => location.origin !== allowed, route => route.abort());
    await page.goto(url, { waitUntil:'domcontentloaded', timeout:30000 });
    const current = page.locator('[data-serving-current]').first();
    // A real click confirms that the page module has attached its handlers.
    await page.locator('[data-serving-action="increase"]').click();
    await page.waitForFunction(() => document.querySelector('[data-serving-current]').textContent === '5');
    const states = [];
    for (const [servings, values] of expected) {
      while (Number(await current.textContent()) !== servings) {
        const count = Number(await current.textContent());
        await page.locator(count > servings ? '[data-serving-action="decrease"]' : '[data-serving-action="increase"]').click();
        await page.waitForFunction(value => Number(document.querySelector('[data-serving-current]').textContent) === value, count > servings ? count - 1 : count + 1);
      }
      const state = await page.evaluate(() => ({
        ingredients:Array.from(document.querySelectorAll('[data-ingredient-quantity]'), element => element.textContent.replace(/[\u00a0\u202f]/g, '').trim()),
        instructions:Array.from(document.querySelectorAll('[data-portion-slot]'), element => element.textContent.trim())
      }));
      const containers = servings + ' ramequin' + (servings > 1 ? 's' : '');
      assert.deepEqual(state.ingredients, values.ingredients, url + ' ingredients for ' + servings);
      assert.deepEqual(state.instructions, [containers, values.reserve, values.milk, values.paste, containers, 'la réserve de lait de coco (' + values.reserve + ')'], url + ' instructions for ' + servings);
      states.push(state);
      console.log('PORTIONS_PASS', servings, url);
    }
    observations.push(states);
    await page.close();
  }
  for (const states of observations) assert.deepEqual(states, observations[0]);
  console.log('AMOK_PORTIONS_PARITY_PASS reference/source' + (urls.length === 3 ? '/public' : ''));
} finally {
  await browser?.close();
  server.closeAllConnections();
  server.close();
}
