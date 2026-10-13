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
for (const stream of [server.stdout, server.stderr]) stream.on('data', (data) => { logs += data.toString(); });
let browser;
const errors = [];

async function waitForServer() {
  for (let i=0;i<65;i++) {
    if (server.exitCode !== null) throw new Error('Astro preview exited: '+logs);
    try {
      const res=await fetch(base+'/v17-preview/',{signal:AbortSignal.timeout(1500)});
      if(res.ok)return;
    } catch {}
    await new Promise(resolve=>setTimeout(resolve,300));
  }
  throw new Error('Astro preview timeout: '+logs);
}

async function inspect(width,height,screenshotPath,options={}) {
  const page=await browser.newPage({
    viewport:{width,height},isMobile:width<761,hasTouch:width<761,
    reducedMotion:options.reduced?'reduce':'no-preference',
    javaScriptEnabled:!options.noJs
  });
  page.setDefaultTimeout(14000);
  page.on('pageerror',error=>errors.push(width+': '+error.message));
  try {
    const response=await page.goto(base+'/v17-preview/',{waitUntil:'networkidle'});
    assert.equal(response?.status(),200,'V17 route HTTP 200');
    assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
    assert.equal(await page.locator('h1').count(),1);
    assert.ok(await page.locator('.v17-hero-stage').isVisible());
    assert.equal(await page.locator('[data-v17-scene]').count(),4);
    assert.equal(await page.locator('.v17-actions a').count(),2);
    assert.equal(await page.locator('.v17-actions a').first().getAttribute('href'),'/recettes/');
    assert.equal(await page.locator('.v17-actions a').last().getAttribute('href'),'/apprendre/');
    assert.equal(await page.locator('.v17-finale-cards a').count(),2);
    assert.equal(await page.locator('.v17-gesture-study ol li').count(),3);
    assert.equal(await page.locator('[data-v17-parallax]').count(),2);
    assert.equal(await page.locator('.v17-illustration[aria-hidden="true"]').count(),2);
    assert.ok(await page.locator('.v17-preview-legal a[href="/credits-photos/"]').count());

    const colors=await page.evaluate(()=>({
      hero:getComputedStyle(document.querySelector('.v17-hero')).backgroundColor,
      market:getComputedStyle(document.querySelector('.v17-market')).backgroundColor,
      gesture:getComputedStyle(document.querySelector('.v17-gesture')).backgroundColor,
      table:getComputedStyle(document.querySelector('.v17-table')).backgroundColor
    }));
    assert.equal(colors.hero,'rgb(255, 253, 247)');
    assert.equal(colors.market,'rgb(217, 241, 109)');
    assert.equal(colors.table,'rgb(255, 99, 57)');

    const geometry=await page.evaluate(()=>({
      scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,
      title:document.querySelector('.v17-hero-title').getBoundingClientRect().width,
      viewport:window.innerWidth
    }));
    assert.ok(geometry.scroll-geometry.client<=2,'No horizontal overflow '+width+': '+JSON.stringify(geometry));

    await page.waitForFunction(()=>{
      const image=document.querySelector('.v17-hero-photo img');
      return image?.complete && image.naturalWidth>0;
    });
    const buttons=await page.locator('.v17-actions a').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height));
    assert.ok(buttons.every(h=>h>=42),'CTA tap targets >=42px');

    if(width===390) {
      const spacing=await page.evaluate(()=>{
        const photo=document.querySelector('.v17-table-photo').getBoundingClientRect();
        const text=document.querySelector('.v17-table-bottom p').getBoundingClientRect();
        return {photoBottom:photo.bottom,textTop:text.top};
      });
      assert.ok(spacing.textTop >= spacing.photoBottom+8,
        'The rotated table photograph must not cover the following paragraph: '+JSON.stringify(spacing));
    }
    if(width===390&&!options.noJs) {
      const menu=page.locator('[data-mobile-menu]');
      await menu.locator('summary').click();
      assert.equal(await menu.evaluate(el=>el.open),true,'Native menu opens');
      await page.keyboard.press('Escape');
      assert.equal(await menu.evaluate(el=>el.open),false,'Escape closes menu');
    }
    if(options.reduced) {
      assert.ok(await page.locator('[data-v17-parallax]').evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).transform==='none')));
    }

    // Request images below the fold before capturing the complete document.
    for(const selector of ['.v17-market','.v17-gesture','.v17-table','.v17-finale']) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForTimeout(options.noJs?50:220);
    }
    await page.waitForFunction(()=>{
      return ['.v17-market-large img','.v17-gesture-paste img','.v17-table-photo img']
        .every(sel=>{const el=document.querySelector(sel);return el?.complete&&el.naturalWidth>0;});
    },null,{timeout:12000});
    if(options.noJs) {
      assert.ok(await page.locator('.v17-market h2').isVisible(),'Market readable without JS');
      assert.ok(await page.locator('.v17-gesture h2').isVisible(),'Gesture readable without JS');
      assert.equal(await page.locator('.v17-market-large').evaluate(el=>getComputedStyle(el).opacity),'1');
    }
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(options.noJs?100:600);
    if(screenshotPath) {
      await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
      await fs.mkdir('artifacts',{recursive:true});
      await page.screenshot({path:screenshotPath,fullPage:true,animations:'disabled'});
    }
    console.log(`V17 fresh bold ${width}×${height} ${options.reduced?'reduced ':''}${options.noJs?'noJS ':''}PASS`);
  } finally {
    await page.close();
  }
}
try{
  await waitForServer();
  browser=await chromium.launch({
    executablePath:process.env.CHROME_BIN||undefined,
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage']
  });
  await inspect(1440,900,'artifacts/v17-preview-1440.png');
  await inspect(390,844,'artifacts/v17-preview-390.png');
  await inspect(768,1024);
  await inspect(360,800);
  await inspect(320,640);
  await inspect(390,844,null,{reduced:true});
  await inspect(390,844,null,{noJs:true});
  assert.deepEqual(errors,[],'No JavaScript runtime errors');
  console.log('V17 Fresh & Bold full browser gate PASS');
} catch(error) {
  console.error('V17 Fresh & Bold browser gate FAIL: '+(error?.stack||error));
  process.exitCode=1;
} finally {
  if(browser)await browser.close();
  if(server.pid&&process.platform!=='win32'){try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')}}else server.kill('SIGTERM');
}
