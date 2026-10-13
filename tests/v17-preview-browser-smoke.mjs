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
    assert.equal(await page.locator('[data-v17-scene]').count(),6);
    assert.equal(await page.locator('[data-v17-title]').count(),6);
    assert.equal(await page.locator('.v17-connector').count(),2);
    assert.equal(await page.locator('[data-v17-ingredient]').count(),3);
    assert.equal(await page.locator('[data-v17-sweet]').count(),2);
    assert.equal(await page.locator('.v17-sweets-bottom a').getAttribute('href'),'/recettes/chek-ktis/');
    assert.equal(await page.locator('.v17-actions a').count(),2);
    assert.equal(await page.locator('.v17-actions a').first().getAttribute('href'),'/recettes/');
    assert.equal(await page.locator('.v17-actions a').last().getAttribute('href'),'/apprendre/');
    assert.equal(await page.locator('.v17-finale-cards a').count(),2);
    assert.equal(await page.locator('.v17-gesture-study ol li').count(),3);
    assert.equal(await page.locator('[data-v17-parallax]').count(),2);
    assert.equal(await page.locator('.v17-illustration[aria-hidden="true"]').count(),1);
    assert.equal(await page.locator('.v17-hero-chili').count(),1);
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

    // V17.2: check that documentary photos form a clean editorial composition,
    // without heavy frames, rotation or overlapping market photos.
    const photoLayout = await page.evaluate(() => {
      const selectors=['.v17-hero-photo','.v17-market-large','.v17-market-small','.v17-gesture-paste','.v17-table-photo'];
      const items=selectors.map((selector)=>{
        const el=document.querySelector(selector);
        const cs=getComputedStyle(el);
        const transform=cs.transform;
        const m=transform.match(/^matrix\\(([^)]+)\\)$/);
        const angle=m?Math.atan2(Number(m[1].split(',')[1]),Number(m[1].split(',')[0])):0;
        const r=el.getBoundingClientRect();
        return {selector,border:parseFloat(cs.borderTopWidth),angle,shadow:cs.boxShadow,x:r.x,y:r.y,w:r.width,h:r.height};
      });
      const [large,small]=[items[1],items[2]];
      const intersect=Math.max(0,Math.min(large.x+large.w,small.x+small.w)-Math.max(large.x,small.x))
        *Math.max(0,Math.min(large.y+large.h,small.y+small.h)-Math.max(large.y,small.y));
      return {items,intersect};
    });
    assert.ok(photoLayout.items.every(p=>p.border<=1),
      'Photos must not have visible Polaroid borders: '+JSON.stringify(photoLayout));
    assert.ok(photoLayout.items.every(p=>Math.abs(p.angle)<0.025),
      'Photos must not be tilted like Polaroids: '+JSON.stringify(photoLayout));
    assert.equal(photoLayout.intersect,0,'Market photographs should not overlap');
    if(width===1440&&!options.reduced&&!options.noJs) {
      const stage=page.locator('[data-v17-ingredient-stage]');
      const top=await stage.evaluate(el=>window.scrollY+el.getBoundingClientRect().top);
      await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),top-850);
      await page.waitForTimeout(450);
      const beginning=await stage.locator('[data-v17-ingredient="left"]').evaluate(el=>getComputedStyle(el).transform);
      await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),top+170);
      await page.waitForTimeout(950);
      const ending=await stage.locator('[data-v17-ingredient="left"]').evaluate(el=>getComputedStyle(el).transform);
      assert.notEqual(beginning,ending,'Ingredient choreography must change during scrolling');
    }
    // V17.4 regression: editorial photography must not slip back to square cards.
    const ratios = await page.evaluate(() => {
      const selectors=['.v17-hero-photo','.v17-market-large','.v17-market-small',
        '.v17-gesture-paste img','.v17-table-photo',
        '.v17-sweets-feature img','.v17-sweets-secondary img'];
      return selectors.map(selector=>{
        const rect=document.querySelector(selector).getBoundingClientRect();
        return {selector,w:rect.width,h:rect.height,ratio:rect.width/rect.height};
      });
    });
    assert.ok(ratios.every(r=>r.w>0&&r.h>0&&Math.abs(r.ratio-1)>=.23),
      'V17.4 forbids near-square editorial photos: '+JSON.stringify(ratios));
    if(width===390) {
      const dessertOverlay = await page.evaluate(() => {
        const icon = document.querySelector('.v17-sweets-coconut').getBoundingClientRect();
        const title = document.querySelector('.v17-sweets h2').getBoundingClientRect();
        return { iconBottom: icon.bottom, titleTop: title.top };
      });
      assert.ok(dessertOverlay.iconBottom <= dessertOverlay.titleTop - 2,
        'Dessert coconut decoration must not overlap headline: '+JSON.stringify(dessertOverlay));
    }
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
    for(const selector of ['.v17-market','.v17-pantry','.v17-gesture','.v17-table','.v17-sweets','.v17-finale']) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForTimeout(options.noJs?50:220);
    }
    await page.waitForFunction(()=>{
      return ['.v17-market-large img','.v17-gesture-paste img','.v17-table-photo img',
        '.v17-pantry-galangal img','.v17-pantry-chili img',
        '.v17-sweets-feature img','.v17-sweets-secondary img']
        .every(sel=>{const el=document.querySelector(sel);return el?.complete&&el.naturalWidth>0;});
    },null,{timeout:12000});
    if(options.noJs) {
      assert.ok(await page.locator('.v17-market h2').isVisible(),'Market readable without JS');
      assert.ok(await page.locator('.v17-gesture h2').isVisible(),'Gesture readable without JS');
      assert.ok(await page.locator('.v17-pantry h2').isVisible(),'Ingredient scene readable without JS');
      assert.ok(await page.locator('.v17-sweets h2').isVisible(),'Dessert scene readable without JS');
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

/** Short real-browser motion proof. Not a fabricated storyboard video. */
async function recordScrollStory() {
  await fs.mkdir('artifacts',{recursive:true});
  const context=await browser.newContext({
    viewport:{width:1280,height:720},deviceScaleFactor:1,
    reducedMotion:'no-preference',
    recordVideo:{dir:'artifacts',size:{width:1280,height:720}}
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push('video: '+error.message));
  try {
    const response=await page.goto(base+'/v17-preview/',{waitUntil:'networkidle'});
    assert.equal(response?.status(),200);
    await page.evaluate(async()=>{
      await new Promise(resolve=>{
        const duration=18000;
        const start=performance.now();
        const maxScroll=Math.max(0,document.documentElement.scrollHeight-innerHeight);
        function frame(time) {
          const p=Math.min(1,(time-start)/duration);
          window.scrollTo({top:maxScroll*p,behavior:'instant'});
          if(p<1)requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
    });
    await page.waitForTimeout(250);
  } finally {
    const video=page.video();
    await page.close();
    await context.close();
    if(video) {
      await video.saveAs('artifacts/v17-story-scroll.webm');
      const stat=await fs.stat('artifacts/v17-story-scroll.webm');
      assert.ok(stat.size>50000,'Motion video must not be empty');
      console.log('V17 real-browser motion recording: PASS, '+stat.size+' bytes');
    }
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
  if(process.env.CI) await recordScrollStory();
  assert.deepEqual(errors,[],'No JavaScript runtime errors');
  console.log('V17 Fresh & Bold full browser gate PASS');
} catch(error) {
  console.error('V17 Fresh & Bold browser gate FAIL: '+(error?.stack||error));
  process.exitCode=1;
} finally {
  if(browser)await browser.close();
  if(server.pid&&process.platform!=='win32'){try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')}}else server.kill('SIGTERM');
}
