import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const workshop=JSON.parse(readFileSync('src/data/atelier-recette-guides/kroeung-jaune.json','utf8'));
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const port=4407, base='http://127.0.0.1:'+port;
const cli=fileURLToPath(new URL('../node_modules/astro/astro.js',import.meta.url));
const server=spawn(process.execPath,[cli,'preview','--host','127.0.0.1','--port',String(port)],{
  stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'
});
let logs='';
for(const stream of [server.stdout,server.stderr]) stream.on('data',chunk=>{logs+=String(chunk)});
const wait=ms=>new Promise(done=>setTimeout(done,ms));
let browser;
try {
  let ready=false;
  for(let i=0;i<70;i++){
    if(server.exitCode!==null)throw Error('Astro preview exited: '+logs);
    try{if((await fetch(base+'/apprendre/pratique/kroeung-jaune/')).ok){ready=true;break}}catch{}
    await wait(300);
  }
  if(!ready)throw Error('Pilot preview unavailable: '+logs);
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const width of [360,390,768,1440]){
    const mobile=width<768;
    const page=await browser.newPage({viewport:{width,height:mobile?812:900},
      hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try{
      const res=await page.goto(base+'/apprendre/pratique/kroeung-jaune/',{waitUntil:'networkidle'});
      assert.equal(res?.status(),200);
      assert.match(await page.locator('h1').innerText(),/kroeung jaune/i);
      assert.equal(await page.locator('.fca-checks li').count(),6);
      assert.equal(await page.locator('[data-workshop-servings-root]').getAttribute('data-workshop-portion-kind'),'pot','Kroeung retains pot yield');
      await page.locator('[data-workshop-serving-preset="2"]').click();
      assert.match(await page.locator('[data-workshop-servings-summary]').innerText(),/2 petits pots/,'Kroeung yields pots, not persons');
      assert.match(await page.locator('[data-workshop-servings-hero]').innerText(),/2 petits pots/);
      await page.locator('[data-workshop-serving-preset="1"]').click();
      assert.equal(await page.locator('.fca-step').count(),6);
      assert.equal(await page.locator('.fca-steps-nav a').count(),6);
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content').then(s=>s?.includes('noindex')),workshop.status!=='release_ready');
      const audioCount=await page.locator('[data-cooking-audio]').count();
      assert.ok(audioCount===0||audioCount===1);
      if(audioCount===1){
        assert.equal(await page.locator('[data-cooking-chapter]').count(),7);
        if(mobile){
          assert.equal(await page.locator('[data-cooking-mobile-dock]').isVisible(),true,'Kroeung mini-player visible before playback');
          assert.equal(await page.locator('.guided-cooking-audio-head').isVisible(),false,'Large mobile audio block hidden');
          await page.locator('[data-cooking-mobile-steps]').click();
          assert.equal(await page.locator('[data-cooking-mobile-chapter]').count(),7);
          await page.locator('[data-cooking-mobile-tab="transcript"]').click();
          assert.ok((await page.locator('[data-cooking-mobile-transcript]').innerText()).length>90);
          await page.locator('[data-cooking-mobile-close]').click();
          await page.locator('[data-cooking-audio]').evaluate(el=>el.dispatchEvent(new Event('play')));
          assert.equal(await page.locator('[data-cooking-mobile-follow]').getAttribute('aria-pressed'),'true','Kroeung auto-follow enabled by MP3 playback');
          await page.locator('[data-cooking-audio]').evaluate(el=>{
            const c=JSON.parse(el.closest('[data-cooking-chapters]').dataset.cookingChapters);
            el.currentTime=c[2].startSec+0.2;
            el.dispatchEvent(new Event('timeupdate'));
          });
          const current=await page.locator('#phase-'+workshop.phases[1].id).evaluate(el=>({top:el.getBoundingClientRect().top,height:window.innerHeight}));
          assert.ok(current.top>=0&&current.top<current.height*.7,'Kroeung page advances with MP3 phase 2: '+JSON.stringify(current));
          await page.evaluate(()=>window.dispatchEvent(new WheelEvent('wheel',{deltaY:120})));
          assert.equal(await page.locator('[data-cooking-mobile-follow]').getAttribute('aria-pressed'),'false','Kroeung free scrolling disables following');
          await page.locator('[data-cooking-mobile-steps]').click();
          await page.locator('[data-cooking-mobile-tab="chapters"]').click();
          await page.locator('[data-cooking-mobile-chapter]').nth(4).click();
          assert.equal(await page.locator('[data-cooking-mobile-sheet]').isVisible(),false);
          const selected=await page.locator('#phase-'+workshop.phases[3].id).evaluate(el=>({top:el.getBoundingClientRect().top,height:innerHeight}));
          assert.ok(selected.top>=-2&&selected.top<selected.height*.72,'Kroeung selected chapter 4 must scroll page: '+JSON.stringify(selected));
          assert.equal(await page.locator('[data-cooking-mobile-follow]').getAttribute('aria-pressed'),'false','Manual chapter jump preserves disabled auto-follow');
        }else{
          assert.equal(await page.locator('.guided-cooking-audio-head').isVisible(),true);
          assert.equal(await page.locator('[data-cooking-mobile-dock]').isVisible(),false);
        }
      }
      else assert.equal(await page.locator('audio').count(),0,'No fake MP3 in draft');
      // The MP3 following test deliberately scrolled the page to a recipe
      // phase. Restore the top before checking the breadcrumb under the header.
      await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
      const topGap=await page.evaluate(()=>{
        const header=document.querySelector('[data-site-header]');
        const breadcrumb=document.querySelector('.fca-breadcrumb');
        return breadcrumb.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
      });
      assert.ok(topGap>=-1, 'Breadcrumb obscured by fixed SiteHeader at '+width+'px: '+topGap);
      assert.equal(await page.locator('.fca-hero-photo img').evaluate(el=>el instanceof HTMLImageElement&&el.complete&&el.naturalWidth>0),true,'Original recipe image loads');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      assert.ok(overflow<=3,'Horizontal overflow at '+width+'px: '+overflow+'px');
      await page.locator('.fca-checks input').first().check();
      assert.equal(await page.locator('.fca-checks input').first().isChecked(),true);
      await page.locator('.fca-observe details summary').first().click();
      assert.equal(await page.locator('.fca-observe details[open]').count(),1,'Rattrapage accessible');
      assert.deepEqual(errors,[]);
      console.log('KROEUNG_REAL_WORKSHOP_PASS '+width);
    }finally{await page.close();}
  }
}catch(error){
  console.error('KROEUNG_REAL_WORKSHOP_FAIL '+(error?.stack||error));
  process.exitCode=1;
}finally{
  await browser?.close();
  if(server.pid&&process.platform!=='win32'){try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')}}
  else server.kill('SIGTERM');
}
