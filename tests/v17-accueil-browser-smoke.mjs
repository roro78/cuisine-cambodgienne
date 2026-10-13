import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const port=4341;
const base='http://127.0.0.1:'+port;
const astroCli=fileURLToPath(new URL('../node_modules/astro/astro.js',import.meta.url));
const server=spawn(process.execPath,[astroCli,'preview','--host','127.0.0.1','--port',String(port)],{
  stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32',env:process.env
});
let logs='';for(const stream of [server.stdout,server.stderr])stream.on('data',d=>{logs+=String(d)});
let browser;
const errors=[];
async function waitForServer(){
  for(let i=0;i<70;i++){
    if(server.exitCode!==null)throw Error('Astro server ended: '+logs);
    try{const response=await fetch(base+'/v17-accueil-preview/',{signal:AbortSignal.timeout(1700)});if(response.ok)return;}catch{}
    await new Promise(r=>setTimeout(r,350));
  }
  throw Error('Astro server timeout: '+logs);
}
async function run(width,height,{noJs=false,reduced=false,screenshot=false}={}){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<=430,hasTouch:width<=430,
    javaScriptEnabled:!noJs,reducedMotion:reduced?'reduce':'no-preference'});
  page.setDefaultTimeout(17000);
  page.on('pageerror',e=>errors.push(width+': '+e.message));
  try{
    const res=await page.goto(base+'/v17-accueil-preview/',{waitUntil:'networkidle',timeout:30000});
    assert.equal(res?.status(),200);
    assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('.v17r h2').count(),6);
    const chapters=['hero','market','palette','gestures','table','dessert','finale'];
    for(const chapter of chapters)assert.equal(await page.locator('.v17r-'+chapter).count(),1);
    const links=['/recettes/','/ingredients/','/glossaire/','/apprendre/','/recettes/chek-ktis/','/apprendre/piler-aromates-au-mortier/'];
    for(const href of links)assert.ok(await page.locator('a[href="'+href+'"]').count()>0,'Missing '+href);
    const photoContrast=await page.evaluate(()=>{
      const scene=document.querySelector('.v17r-table');
      const media=document.querySelector('.v17r-table-media');
      const shade=getComputedStyle(scene,'::before');
      const heroText=scene.querySelector('h2');
      return {
        photoZ:Number(getComputedStyle(media).zIndex),
        shadeZ:Number(shade.zIndex),
        titleZ:Number(getComputedStyle(scene.querySelector('.v17r-table-copy')).zIndex),
        titleOverflow:heroText.scrollWidth-heroText.clientWidth
      };
    });
    assert.ok(photoContrast.photoZ>=0 && photoContrast.shadeZ>photoContrast.photoZ &&
      photoContrast.titleZ>photoContrast.shadeZ,
      'Photo under a readable overlay, not behind the scene background: '+JSON.stringify(photoContrast));
    assert.ok(photoContrast.titleOverflow<=2,'Table title must fit even on small screens: '+JSON.stringify(photoContrast));
    const dimension=await page.evaluate(()=>({
      html:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,
      w:innerWidth
    }));
    assert.ok(dimension.html-dimension.client<=2,'Horizontal overflow '+JSON.stringify(dimension));
    for(const selector of ['.v17r-hero-dish img','.v17r-market-visual img','.v17r-palette-a img','.v17r-palette-b img','.v17r-table-amok img','.v17r-dessert-main img','.v17r-dessert-second img','.v17r-finale-landscape img']){
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForFunction(s=>{const img=document.querySelector(s);return img?.complete&&img.naturalWidth>0},selector,{timeout:10000});
    }
    const rhythm=await page.evaluate(()=>{
      const items=['hero','market','palette','gestures','table','dessert','finale'];
      return items.map(key=>{const el=document.querySelector('.v17r-'+key);return {
        key,height:Math.round(el.getBoundingClientRect().height),cols:getComputedStyle(el).gridTemplateColumns
      }});
    });
    assert.ok(Math.max(...rhythm.map(x=>x.height))-Math.min(...rhythm.map(x=>x.height))>100,
      'Scenes must be different heights: '+JSON.stringify(rhythm));
    if(width===390 && !noJs){
      const menu=page.locator('[data-mobile-menu]');
      await menu.locator('summary').click();
      assert.equal(await menu.evaluate(el=>el.open),true);
      await page.keyboard.press('Escape');
      assert.equal(await menu.evaluate(el=>el.open),false);
    }
    if(noJs){
      assert.ok(await page.locator('.v17r-gestures h2').isVisible());
      assert.ok(await page.locator('.v17r-dessert h2').isVisible());
    }
    if(screenshot){
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      await page.waitForTimeout(400);
      await fs.mkdir('artifacts',{recursive:true});
      await page.screenshot({path:'artifacts/v17-accueil-'+width+'.png',fullPage:true,animations:'disabled'});
    }
    // The preview must never be confused with the public homepage.
    if(width===390||width===1440){
      const homeRes=await page.request.get(base+'/');
      assert.equal(homeRes.status(),200);
      assert.doesNotMatch(await homeRes.text(),/v17r-hero/);
    }
    console.log('V17 D2 preview '+width+' × '+height+(noJs?' noJS':'')+(reduced?' reduced':'')+' PASS');
  }finally{await page.close()}
}
try{
  await waitForServer();
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const [w,h] of [[1440,900],[390,844],[320,640],[360,800],[430,932],[768,1024],[1024,768]]){
    await run(w,h,{screenshot:w===1440||w===390});
  }
  await run(390,844,{reduced:true});
  await run(390,844,{noJs:true});
  assert.deepEqual(errors,[],'No browser JS errors');
  console.log('V17 D2 browser gate: PASS');
}catch(e){console.error('V17 D2 browser gate FAIL:',e?.stack||e);process.exitCode=1}
finally{if(browser)await browser.close();if(server.pid&&process.platform!=='win32'){
  try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')}}else server.kill('SIGTERM');}
