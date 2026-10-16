import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const port=4369,base='http://127.0.0.1:'+port,dir='artifacts';
const cli=fileURLToPath(new URL('../node_modules/astro/astro.js',import.meta.url));
const server=spawn(process.execPath,[cli,'preview','--host','127.0.0.1','--port',String(port)],{
  stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'
});
let logs='';
for(const stream of [server.stdout,server.stderr])stream.on('data',x=>logs+=String(x));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitReady(){
  for(let i=0;i<65;i++){
    if(server.exitCode!==null)throw Error('Astro exited: '+logs);
    try{if((await fetch(base+'/recettes/',{signal:AbortSignal.timeout(1700)})).ok)return}catch{}
    await sleep(300);
  }
  throw Error('Preview unavailable: '+logs);
}
const routes=[
  ['recettes','/recettes/','.recipes-journey-visual'],
  ['amok','/recettes/amok-trey/','.recipe-v15-cover'],
  ['ateliers','/apprendre/','.v19-hero-photo'],
  ['carnets','/culture/','.v19-hero-photo'],
  ['repas','/culture/construire-repas-cambodgien/','.culture-visual'],
  ['apropos','/a-propos/','.v19-hero-photo'],
  ['glossaire','/glossaire/','.v19-hero-photo']
];
let browser;
async function capture(width,height){
  const mobile=width<760;
  const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile,
    reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  try{
    for(const [label,path,selector] of routes){
      const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:30000});
      assert.equal(response?.status(),200,path+' must exist');
      const cover=page.locator(selector);
      assert.equal(await cover.count(),1,label+' expected one hero image');
      const image=cover.locator('img');
      assert.equal(await image.count(),1,label+' hero image missing');
      await page.waitForFunction(sel=>{
        const img=document.querySelector(sel+' img');
        return Boolean(img?.complete&&img.naturalWidth>0);
      },selector,{timeout:15000});
      const proof=await image.evaluate(img=>{
        const box=img.getBoundingClientRect();
        const panel=img.closest('figure, .recipes-journey-visual')?.getBoundingClientRect();
        return {
          width:box.width,height:box.height,panelWidth:panel?.width,
          fit:getComputedStyle(img).objectFit,
          loaded:img.complete&&img.naturalWidth>0,
          overflow:document.documentElement.scrollWidth-innerWidth
        };
      });
      assert.ok(proof.loaded,label+' photo failed to load: '+JSON.stringify(proof));
      assert.equal(proof.fit,'cover',label+' image must fill its polygon');
      assert.ok(proof.width>width*(mobile?.85:.38),label+' hero width not immersive '+JSON.stringify(proof));
      assert.ok(proof.overflow<=3,label+' viewport overflow: '+JSON.stringify(proof));
      if(!mobile && label!=='repas'){
        const heading=page.locator('h1').first();
        const headingBox=await heading.boundingBox();
        const panelBox=await cover.boundingBox();
        assert.ok(headingBox&&panelBox&&headingBox.x+headingBox.width<=panelBox.x-4,
          label+' heading must remain outside photographic panel: '+JSON.stringify({headingBox,panelBox}));
      }
      if(label==='repas'){
        assert.match(await page.locator('h1').innerText(),/L’art de composer un repas cambodgien/);
        assert.ok((await image.getAttribute('src'))?.includes('table-meal'),'Meal journal must not illustrate only amok');
      }
      if(label==='ateliers'){
        assert.equal(await page.locator('.v19-workshop-steps article').count(),3);
        assert.equal(await page.locator('.v19-workshop-shot img').count(),6);
      }
      if(label==='carnets')assert.equal(await page.locator('.v19-note-image').count(),4);
      if(label==='apropos')assert.equal(await page.locator('.v19-about-interlude img').count(),1);
      if(label==='amok'){
        assert.equal(await page.locator('.recipe-generated-note').count(),0,'AI credit must stay in footer');
        const radius=await cover.evaluate(el=>getComputedStyle(el).borderRadius);
        assert.equal(radius,'0px','No floating rounded photo card');
      }
      if(label==='recettes')assert.equal(await page.locator('.recipe-generated-note').count(),0);
      await page.screenshot({path:dir+'/v19-'+label+'-'+width+'.png',animations:'disabled'});
      console.log('V19 '+label+' '+width+' PASS '+JSON.stringify(proof));
    }
    assert.deepEqual(errors,[],'No browser errors');
  }finally{await page.close()}
}
try{
  await fs.mkdir(dir,{recursive:true});
  await waitReady();
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  await capture(390,844);
  await capture(1440,900);
  console.log('V19 EDITORIAL QA PASS');
}catch(e){console.error('V19 EDITORIAL QA FAIL '+(e?.stack||e));process.exitCode=1}
finally{
  await browser?.close();
  if(server.pid&&process.platform!=='win32'){
    try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')}
  }else server.kill('SIGTERM');
}
