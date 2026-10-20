import assert from 'node:assert/strict';
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
      assert.equal(await page.locator('.atelier-checklist li').count(),6);
      assert.equal(await page.locator('.atelier-phase').count(),6);
      assert.equal(await page.locator('.atelier-step-nav a').count(),6);
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content').then(s=>s?.includes('noindex')),true);
      const audioCount=await page.locator('[data-cooking-audio]').count();
      assert.ok(audioCount===0||audioCount===1);
      if(audioCount===1)assert.equal(await page.locator('[data-cooking-chapter]').count(),7);
      else assert.equal(await page.locator('audio').count(),0,'No fake MP3 in draft');
      const topGap=await page.evaluate(()=>{
        const header=document.querySelector('[data-site-header]');
        const breadcrumb=document.querySelector('.atelier-breadcrumb');
        return breadcrumb.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
      });
      assert.ok(topGap>=-1, 'Breadcrumb obscured by fixed SiteHeader at '+width+'px: '+topGap);
      assert.equal(await page.locator('.atelier-hero-photo img').evaluate(el=>el instanceof HTMLImageElement&&el.complete&&el.naturalWidth>0),true,'Original recipe image loads');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      assert.ok(overflow<=3,'Horizontal overflow at '+width+'px: '+overflow+'px');
      await page.locator('.atelier-checklist input').first().check();
      assert.equal(await page.locator('.atelier-checklist input').first().isChecked(),true);
      await page.locator('.atelier-observe details summary').first().click();
      assert.equal(await page.locator('.atelier-observe details[open]').count(),1,'Rattrapage accessible');
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
