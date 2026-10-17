import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const port=4412;
const base='http://127.0.0.1:'+port;
const cli=fileURLToPath(new URL('../node_modules/astro/astro.js',import.meta.url));
const proc=spawn(process.execPath,[cli,'preview','--host','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'});
let log='';
for(const stream of [proc.stdout,proc.stderr])stream.on('data',chunk=>{log+=String(chunk)});
let browser;
const sections=['glossaire','recettes','apprendre','culture','ingredients','a-propos','experiences'];
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
  await fs.mkdir('artifacts',{recursive:true});
  let ready=false;
  for(let n=0;n<55;n++){
    if(proc.exitCode!==null)throw Error('Astro preview failed: '+log);
    try{if((await fetch(base+'/glossaire/',{signal:AbortSignal.timeout(1700)})).ok){ready=true;break}}catch{}
    await delay(350);
  }
  if(!ready)throw Error('Astro preview unavailable: '+log);
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const [width,height] of [[390,844],[768,1024],[1440,900]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:width<500,hasTouch:width<500,reducedMotion:'reduce'});
    const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
    let reference;
    try{
      for(const section of sections){
        const response=await page.goto(base+'/'+section+'/',{waitUntil:'domcontentloaded'});
        assert.equal(response?.status(),200,section+' response');
        const hero=page.locator('[data-editorial-hero="glossary-template"]');
        assert.equal(await hero.count(),1,section+' shared opening');
        assert.equal(await hero.locator('h1').count(),1,section+' heading');
        const image=hero.locator('.v19-hero-photo img');
        await page.waitForFunction(()=>{
          const img=document.querySelector('[data-editorial-hero="glossary-template"] .v19-hero-photo img');
          return img instanceof HTMLImageElement && img.complete && img.naturalWidth>0;
        },{timeout:15000});
        const details=await hero.evaluate(el=>{
          const img=el.querySelector('.v19-hero-photo');
          const h=el.querySelector('h1');
          const intro=el.querySelector('p:not(.v16-page-kicker)');
          const box=el.getBoundingClientRect();
          const imageBox=img.getBoundingClientRect();
          return {
            bg:getComputedStyle(el).backgroundImage,
            color:getComputedStyle(el).color,
            titleFont:getComputedStyle(h).fontSize,
            titleFamily:getComputedStyle(h).fontFamily,
            introColor:getComputedStyle(intro).color,
            imageClip:getComputedStyle(img).clipPath,
            imagePosition:getComputedStyle(img).position,
            heroTop:Math.round(box.top),
            imageTop:Math.round(imageBox.top),
            heroBottom:Math.round(box.bottom),
            imageWidth:Math.round(imageBox.width),
            width:Math.round(box.width)
          };
        });
        if(!reference)reference=details;
        for(const key of ['bg','color','titleFont','titleFamily','introColor','imageClip','imagePosition']){
          assert.equal(details[key],reference[key],section+' differs from glossary on '+key+' at '+width);
        }
        if(width<=900)assert.ok(details.imageTop>=details.heroTop,section+' image must follow textual introduction on mobile');
        else assert.ok(details.imageWidth>0,section+' side photograph must render on desktop');
        assert.ok(Math.abs(details.width-width)<=3,section+' hero not full width at '+width+': '+details.width);
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        assert.ok(overflow<=3,section+' horizontal overflow '+overflow+'px at '+width);
        if(section==='recettes'){
          assert.equal(await page.locator('.recipes-journey-hero').count(),0,'old green recipe hero removed');
          assert.equal(await page.locator('[data-recipe-card]').count(),13,'recipe catalog intact');
        }
        if(section==='glossaire')assert.ok(await page.locator('[data-glossary-search]').isVisible());
        if(section==='experiences')assert.ok((await page.locator('.exp-prelaunch-banner').innerText()).includes('ne sont pas encore ouvertes'));
        if(width!==768)await page.screenshot({path:'artifacts/shared-hero-'+section+'-'+width+'.png',animations:'disabled'});
        console.log('SHARED_GLOSSARY_FRAME '+section+' '+width+' PASS');
      }
      await page.goto(base+'/glossaire/',{waitUntil:'domcontentloaded'});
      await page.locator('[data-glossary-search]').fill('combava');
      const glossaryCards = page.locator('[data-glossary-card]:not([hidden])');
      assert.ok((await glossaryCards.count())>0,'glossary search keeps matching entries, regardless of scroll animation');
      const glossaryCount = await page.locator('[data-glossary-card]').count();
      assert.ok((await glossaryCards.count())<glossaryCount,'glossary search excludes nonmatching entries');
      await page.goto(base+'/recettes/',{waitUntil:'domcontentloaded'});
      const count=await page.locator('[data-recipe-card]:not([hidden])').count();
      await page.locator('[data-recipe-filter="dessert"]').click();
      const filtered=await page.locator('[data-recipe-card]:not([hidden])').count();
      assert.ok(filtered>0&&filtered<count,'recipe filtering still works');
      assert.deepEqual(pageErrors,[],'browser JS errors '+JSON.stringify(pageErrors));
    }finally{await page.close()}
  }
  console.log('SHARED_EDITORIAL_GLOSSARY_QA PASS');
}catch(error){
  console.error('SHARED_EDITORIAL_GLOSSARY_QA FAIL '+(error?.stack||error));
  process.exitCode=1;
}finally{
  await browser?.close();
  if(proc.pid&&process.platform!=='win32'){try{process.kill(-proc.pid,'SIGTERM')}catch{proc.kill('SIGTERM')}}else proc.kill('SIGTERM');
}
