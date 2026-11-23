import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const port = 4357;
const base = `http://127.0.0.1:${port}`;
const astroCli = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
const server = spawn(process.execPath, [astroCli, 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: process.platform !== 'win32',
  env: process.env
});
let logs = '';
for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => { logs += chunk.toString(); });
let browser;

const slugs = [
  'le-riz-symbole-de-vie-au-cambodge',
  'poivre-de-kampot',
  'comprendre-le-kroeung',
  'comprendre-amok',
  'kep-marche-crabe-poivre',
  'prahok-fermentation-umami',
  'construire-repas-cambodgien',
  'sucre-de-palme-kampong-speu'
];
const viewports = [
  { name: 'android', width: 390, height: 844, deviceScaleFactor: 1 },
  { name: 'desktop', width: 1366, height: 900, deviceScaleFactor: 1 }
];
const errors = [];
const assertions = [];

async function waitForServer() {
  for (let attempt=0; attempt<75; attempt++) {
    if (server.exitCode !== null) throw new Error('Astro preview failed: '+logs);
    try {
      const response = await fetch(base+'/culture/',{signal:AbortSignal.timeout(1200)});
      if (response.ok) return;
    } catch { /* waiting for offline preview */ }
    await new Promise(resolve => setTimeout(resolve,350));
  }
  throw new Error('Astro preview did not start: '+logs);
}

async function inspect(view) {
  const page = await browser.newPage({ viewport:view, reducedMotion:'reduce', serviceWorkers:'block' });
  page.on('pageerror',err => errors.push(view.name+': '+err.message));
  page.setDefaultNavigationTimeout(30000);
  try {
    const overview = await page.goto(base+'/culture/',{waitUntil:'domcontentloaded'});
    assert.equal(overview?.status(),200,'Carnets index must render');
    assert.equal(await page.locator('main.v16-journals a.v16-journal-lead-card, main.v16-journals a.v16-journal-card').count(),slugs.length,'All Carnets must be discoverable');
    assert.equal(await page.locator('main.v16-journals a[href^="/recettes/"], main.v16-journals a[href^="/apprendre/"]').count(),0,'No recipe/workshop CTA in Carnets home');
    const filterButtons = page.locator('[data-carnets-filters] button[data-carnets-filter]');
    await filterButtons.first().waitFor({ state: 'visible' });
    assert.equal(await filterButtons.count(),4,'All + three non-empty universes');
    assert.equal(await page.locator('[data-carnets-universe]:not([hidden])').count(),slugs.length,'All stories remain unfiltered by default');
    for (const [universe,expected] of [['Vie quotidienne',2],['Terroirs et marchés',3],['Mémoire culinaire',3]]) {
      // Press the exact data value rather than matching translated labels.
      await page.locator('[data-carnets-filter]').evaluateAll((nodes,key) => {
        const target = nodes.find(node => node.getAttribute('data-carnets-filter') === key);
        if (!target) throw new Error('Missing filter '+key);
        target.click();
      },universe);
      assert.equal(await page.locator('[data-carnets-universe]:not([hidden])').count(),expected,'Filter results (independent of scroll reveal) '+universe);
      assert.equal(await page.locator('[data-carnets-filter="'+universe+'"]').getAttribute('aria-pressed'),'true','Accessible filter state '+universe);
    }
    await page.locator('[data-carnets-filter="all"]').click();
    assert.equal(await page.locator('[data-carnets-universe]:not([hidden])').count(),slugs.length,'All filter restores the unfiltered stories');
    assert.equal(await page.locator('[data-carnets-universe][hidden]').count(),0,'No hidden story left after reset');
    await assertNoOverflow(page,'index '+view.name);
    if (view.name==='desktop') await capture(page,'index-desktop');

    for(const slug of slugs) {
      const url=base+'/culture/'+slug+'/';
      const res=await page.goto(url,{waitUntil:'domcontentloaded'});
      assert.equal(res?.status(),200,'Carnet route status: '+slug);
      assert.equal(await page.locator('main.culture-article h1').count(),1,'H1 missing: '+slug);
      assert.equal(await page.locator('main.culture-article .culture-copy h2').count(),
        slug==='le-riz-symbole-de-vie-au-cambodge'?7:slug==='comprendre-le-kroeung'?5:slug==='poivre-de-kampot'?7:6,
        'Chapter count regression: '+slug);
      assert.equal(await page.locator('main.culture-article .culture-related, main.culture-article .rice-workshop-link').count(),0,'Practical funnel leaked: '+slug);
      const links = await page.locator('main.culture-article a[href^="/recettes/"], main.culture-article a[href^="/apprendre/"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
      const isPalmSugar = slug === 'sucre-de-palme-kampong-speu';
      assert.deepEqual(links, isPalmSugar ? ['/recettes/chek-ktis/', '/recettes/num-plae-ai/'] : [], 'Related recipes: '+slug);
      if (isPalmSugar) {
        const photographs = page.locator('main.culture-article .carnet-feature');
        assert.equal(await photographs.count(),4,'Four documentary photographs');
        for (const figure of await photographs.all()) {
          const photo = figure.locator('img');
          await photo.scrollIntoViewIfNeeded();
          await photo.evaluate(image => image.decode());
          const caption = await figure.locator('figcaption').boundingBox();
          const bounds = await figure.boundingBox();
          assert.ok(caption && bounds && caption.x >= bounds.x && caption.x + caption.width <= bounds.x + bounds.width, 'Credit fits within figure');
          assert.ok((await figure.locator('figcaption').textContent()).includes('Wikimedia Commons'));
        }
        assert.equal(await page.locator('.carnet-nav a').count(),6);
        assert.equal(await page.locator('.carnet-flow li').count(),7);
        assert.deepEqual(await page.locator('.carnet-geography dd').allTextContents(),['Oudong','Samrong Torng','Ang Snuol']);
      }
      const otherCarnets = page.locator('main.culture-article nav.culture-next-stories a[href^="/culture/"]');
      assert.equal(await otherCarnets.count(),['poivre-de-kampot','kep-marche-crabe-poivre','sucre-de-palme-kampong-speu','comprendre-le-kroeung','comprendre-amok','prahok-fermentation-umami'].includes(slug)?2:1,
        'Cultural cross-link expected within each non-empty universe: '+slug);
      assert.equal(await page.locator(`main.culture-article nav.culture-next-stories a[href="/culture/${slug}/"]`).count(),0,
        'Current story must not link to itself: '+slug);
      await assertNoOverflow(page,slug+' '+view.name);
      const heroImage = isPalmSugar ? 'main.culture-article .carnet-hero img' : 'main.culture-article .culture-visual img';
      const img=page.locator(heroImage);
      await img.waitFor({state:'attached',timeout:15000});
      // External Wikimedia heroes must be checked as strictly as local assets.
      try {
        await page.waitForFunction(selector => {
          const el=document.querySelector(selector);
          return !!el && el.complete;
        },heroImage,{timeout:13000});
      } catch { /* naturalWidth check reports the image failure below */ }
      const image=await img.evaluate(el => ({src:el.currentSrc,width:el.naturalWidth,height:el.naturalHeight,complete:el.complete}));
      assert.ok(image.complete&&image.width>0&&image.height>0,'Broken hero photo: '+slug+' at '+view.name+' -> '+image.src);
      assertions.push({slug,viewport:view.name,image:image.width+'x'+image.height});
      if(slug==='kep-marche-crabe-poivre'&&view.name==='android') await capture(page,'kep-mobile');
      if(slug==='construire-repas-cambodgien'&&view.name==='desktop') await capture(page,'table-desktop');
    }
    if(view.name==='android') await page.goto(base+'/culture/',{waitUntil:'domcontentloaded'}).then(async()=>capture(page,'index-mobile'));
  } finally {
    await page.close();
  }
}

async function assertNoOverflow(page,label){
  const x=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(x.scroll<=x.viewport+2,'Horizontal scroll on '+label+': '+x.scroll+'px > '+x.viewport+'px');
}
async function capture(page,name){
  await fs.mkdir('artifacts/carnets-review',{recursive:true});
  await page.screenshot({path:`artifacts/carnets-review/${name}.png`,fullPage:true,animations:'disabled'});
}
async function main(){
  await waitForServer();
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const viewport of viewports) await inspect(viewport);
  assert.deepEqual(errors,[],'Browser JS exceptions must be absent');
  console.log('CARNETS_QA_PASS 7/7 x 2 viewports, 14 article hero images decoded.');
  console.log(JSON.stringify(assertions));
}
try { await main(); }
finally {
  if(browser) await browser.close();
  if (process.platform==='win32') server.kill();
  else { try { process.kill(-server.pid,'SIGTERM'); } catch { server.kill(); } }
}
