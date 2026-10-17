import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const port = 4393;
const base = 'http://127.0.0.1:' + port;
const cli = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
const server = spawn(process.execPath, [cli, 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32'
});
let logs = '';
for (const stream of [server.stdout, server.stderr]) stream.on('data', c => logs += String(c));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
async function ready() {
  for (let i=0;i<55;i++){
    if(server.exitCode !== null)throw Error('Preview exited: '+logs);
    try { if ((await fetch(base+'/recettes/',{signal:AbortSignal.timeout(1500)})).ok) return; } catch {}
    await delay(350);
  }
  throw Error('Preview not ready: '+logs);
}
function rgb(text) {
  const n = text.match(/\d+(?:\.\d+)?/g)?.slice(0,3).map(Number);
  if (!n || n.length<3) throw Error('Non-rgb color '+text);
  return n;
}
function luminance(n) {
  const lin = n.map(c => (c/255<=.04045 ? c/255/12.92 : ((c/255+.055)/1.055)**2.4));
  return .2126*lin[0]+.7152*lin[1]+.0722*lin[2];
}
function contrast(a,b){
  const l1=luminance(rgb(a)),l2=luminance(rgb(b));
  return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
}
try {
  await fs.mkdir('artifacts',{recursive:true});
  await ready();
  browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const [width,height] of [[390,844],[768,1024],[1440,900]]) {
    const page=await browser.newPage({viewport:{width,height},isMobile:width<500,hasTouch:width<500,reducedMotion:'reduce'});
    const problems=[];page.on('pageerror',e=>problems.push(e.message));
    try {
      const response=await page.goto(base+'/recettes/',{waitUntil:'domcontentloaded'});
      assert.equal(response?.status(),200);
      assert.match(await page.locator('.recipes-journey-copy h1').innerText(),/saveurs du Cambodge/i);
      const lead=await page.locator('.recipes-journey-copy>p:last-of-type').innerText();
      assert.match(lead,/amok de poisson/i);
      assert.doesNotMatch(lead,/portions ajustables|conseils simples au bon moment/i);
      const bg=await page.locator('.recipes-journey-hero').evaluate(el=>getComputedStyle(el).backgroundColor);
      // Background is a CSS gradient, so mobile dark-green is checked using the declared #18382a stop.
      const dark='rgb(24, 56, 42)';
      if(width<=900) {
        const styles=await page.locator('.recipes-journey-copy').evaluate(el=>Object.fromEntries(
          ['h1','.eyebrow','p:last-of-type','.recipes-journey-stamp span'].map(sel=>[sel,getComputedStyle(el.querySelector(sel)).color])
        ));
        for(const [selector,foreground] of Object.entries(styles)) {
          const ratio=contrast(foreground,dark);
          assert.ok(ratio>=4.5,selector+' contrast against dark green failed: '+ratio.toFixed(2)+' '+foreground);
        }
        console.log('MOBILE_CONTRAST_'+width+' PASS '+JSON.stringify(styles));
      }
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      assert.ok(overflow<=3,'recipe listing horizontal overflow '+overflow+' at '+width);
      await page.waitForFunction(()=>{
        const img=document.querySelector('.recipes-journey-visual img');
        return img instanceof HTMLImageElement && img.complete && img.naturalWidth>0;
      });
      if(width===390){
        const top=await page.locator('.recipes-journey-visual').boundingBox();
        assert.ok(top&&top.y<1800,'Hero image too far below the mobile opening '+JSON.stringify(top));
      }
      await page.screenshot({path:'artifacts/editorial-recettes-'+width+'.png',fullPage:false,animations:'disabled'});
      assert.deepEqual(problems,[]);
    } finally {await page.close();}
  }
  const slugs=['piler-aromates-au-mortier','equilibrer-une-sauce','saisir-viande-poele','fraicheur-herbes-agrumes','bouillon-leger-savoureux','composer-repas-cambodgien'];
  for(const slug of slugs){
    const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    try {
      const res=await page.goto(base+'/apprendre/'+slug+'/',{waitUntil:'domcontentloaded'});
      assert.equal(res?.status(),200);
      assert.match(await page.locator('.workshop-learning-lab h2').innerText(),/Essayez le geste/i);
      assert.equal(await page.locator('.workshop-tutorial-step').count(),4);
      const text=await page.locator('.workshop-tutorial').innerText();
      assert.doesNotMatch(text,/un seul axe de goût|grille d’autoévaluation|une bouchée lisible|la texture raconte le geste/i);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      assert.ok(overflow<=3,slug+' horizontal overflow: '+overflow);
      console.log('ATELIER_COPY '+slug+' PASS');
    } finally {await page.close();}
  }
  console.log('EDITORIAL_CUISINE_CONTRAST QA PASS');
}catch(e){
  console.error('EDITORIAL_CUISINE_CONTRAST QA FAIL '+(e?.stack||e));
  process.exitCode=1;
}finally {
  await browser?.close();
  if(server.pid&&process.platform!=='win32'){try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')}}
  else server.kill('SIGTERM');
}
