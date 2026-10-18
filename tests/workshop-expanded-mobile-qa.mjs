import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const base = 'http://127.0.0.1:4397';
const cli = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
const server = spawn(process.execPath, [cli, 'preview', '--host', '127.0.0.1', '--port', '4397'], {
  stdio:['ignore','pipe','pipe'], detached:process.platform!=='win32'
});
let logs='';
for (const stream of [server.stdout,server.stderr]) stream.on('data', part=>{logs+=String(part)});
let browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready() {
  for(let i=0;i<75;i++){
    if(server.exitCode!==null)throw Error('Astro preview stopped '+logs);
    try {if((await fetch(base+'/apprendre/piler-aromates-au-mortier/')).ok)return;}catch{}
    await sleep(280);
  }
  throw Error('Astro preview unavailable '+logs);
}
const workshops=[
  'piler-aromates-au-mortier',
  'equilibrer-une-sauce',
  'saisir-viande-poele',
  'fraicheur-herbes-agrumes',
  'bouillon-leger-savoureux',
  'composer-repas-cambodgien'
];
async function player(page){
  return page.locator('[data-player-audio]').evaluate(a=>({paused:a.paused,currentTime:a.currentTime}));
}
try{
  await ready();
  browser=await chromium.launch({
    headless:true,executablePath:process.env.CHROME_BIN||undefined,
    args:['--no-sandbox','--disable-dev-shm-usage']
  });
  // Every one of the six routes uses exactly the same mobile component.
  for(const width of [320,390,1440]){
    const mobile=width<761;
    const page=await browser.newPage({
      viewport:{width,height:mobile?844:900},
      isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'
    });
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try{
      for(const slug of (width===390?workshops:['piler-aromates-au-mortier'])){
        const response=await page.goto(base+'/apprendre/'+slug+'/',{waitUntil:'domcontentloaded'});
        assert.equal(response?.status(),200,slug+' route');
        assert.equal(await page.locator('[data-player-audio]').count(),1,'One audio element');
        const dock=page.locator('[data-player-mobile-dock]');
        const chapter=page.locator('[data-mobile-chapter]');
        assert.equal(await dock.count(),1);
        assert.equal(await chapter.count(),5);
        assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=3,'No horizontal overflow');
        if(mobile) {
          await page.locator('[data-workshop-tutorial]').scrollIntoViewIfNeeded();
          await page.waitForFunction(()=>document.querySelector('[data-player-mobile-dock]')?.dataset.dockVisible==='true');
          assert.ok(await dock.isVisible());
          assert.equal(await page.locator('.workshop-player-chapters').isVisible(),false,'No long chapter block in mobile page');
          assert.equal(await page.locator('.workshop-player-heading').isVisible(),false,'No oversized heading card in mobile page');
          assert.ok((await page.locator('[data-workshop-chapter-player]').evaluate(el=>el.getBoundingClientRect().height))<2);
          assert.equal(await page.locator('[data-mobile-panel]').isVisible(),false,'Closed by default');
          const expand=page.locator('[data-mobile-expand]');
          assert.equal(await expand.getAttribute('aria-expanded'),'false');
          await expand.click();
          assert.equal(await expand.getAttribute('aria-expanded'),'true');
          assert.ok(await page.locator('[data-mobile-panel]').isVisible());
          assert.ok(await page.locator('[data-mobile-backdrop]').isVisible());
          const geo=await dock.evaluate(el=>{
            const r=el.getBoundingClientRect();
            return {bottom:r.bottom,height:r.height,viewport:innerHeight};
          });
          assert.ok(Math.abs(geo.bottom-geo.viewport)<=3,'Sheet fixed bottom');
          assert.ok(geo.height<geo.viewport*.86,'Sheet not full screen');
          assert.ok(geo.height>300,'Sheet reveals chapter navigation');
          assert.ok((await page.locator('[data-mobile-transcript]').textContent())?.length>80);
          await chapter.nth(2).click();
          assert.equal(await expand.getAttribute('aria-expanded'),'false','Selecting chapter collapses the sheet');
          assert.equal(await page.locator('[data-mobile-panel]').isVisible(),false);
          assert.ok((await player(page)).currentTime>=20,'Player seeks into the selected narrated chapter');
          await expand.click();
          await page.keyboard.press('Escape');
          assert.equal(await expand.getAttribute('aria-expanded'),'false','Escape closes sheet');
          // A drag on the grip (not the seek slider) opens/closes navigation.
          const grip=await expand.boundingBox();
          assert.ok(grip);
          const x=grip.x+grip.width/2;
          const y=grip.y+grip.height/2;
          await page.mouse.move(x,y);await page.mouse.down();
          await page.mouse.move(x,y-65,{steps:4});await page.mouse.up();
          assert.equal(await expand.getAttribute('aria-expanded'),'true','Swipe up expands');
          const down=await expand.boundingBox();
          const dx=down.x+down.width/2,dy=down.y+down.height/2;
          await page.mouse.move(dx,dy);await page.mouse.down();
          await page.mouse.move(dx,dy+65,{steps:4});await page.mouse.up();
          assert.equal(await expand.getAttribute('aria-expanded'),'false','Swipe down collapses');
          await page.locator('[data-mobile-stop]').click();
          const audio=await player(page);
          assert.equal(audio.paused,true);
          assert.ok(audio.currentTime<.05,'Stop resets time');
        } else {
          assert.equal(await dock.isVisible(),false,'Desktop keeps dock hidden');
          assert.ok(await page.locator('.workshop-player-heading').isVisible());
          assert.ok(await page.locator('.workshop-player-chapters').isVisible());
        }
        console.log('AUDIO_SHEET_PASS',slug,width);
      }
      assert.deepEqual(errors,[],'No script errors');
    }finally{await page.close();}
  }
}catch(error){console.error('AUDIO_SHEET_FAIL',error?.stack||error);process.exitCode=1;}
finally {
  await browser?.close();
  if(server.pid && process.platform!=='win32'){
    try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')}
  }else server.kill('SIGTERM');
}
