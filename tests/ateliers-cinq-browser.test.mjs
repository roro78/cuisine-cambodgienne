import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const port=4411,base='http://127.0.0.1:'+port;
const cli=fileURLToPath(new URL('../node_modules/astro/astro.js',import.meta.url));
const server=spawn(process.execPath,[cli,'preview','--host','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'});
let log='';for(const stream of [server.stdout,server.stderr])stream.on('data',part=>{log+=String(part)});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const routes=[
 ['lok-lak-de-la-poele-a-l-assiette',10],
 ['samlor-machu-soupe-acidulee-guidee',7],
 ['num-banh-chok-sauce-et-herbes-fraiches',6],
 ['kuy-teav-bouillon-et-nouilles',7],
 ['bai-sach-chrouk-porc-riz-et-pickles',7]
];
let browser;
try{
  let ready=false;
  for(let i=0;i<65;i++){
    if(server.exitCode!==null)throw Error('Astro preview unavailable '+log);
    try{if((await fetch(base+'/apprendre/pratique/'+routes[0][0]+'/')).ok){ready=true;break}}catch{}
    await pause(400);
  }
  if(!ready)throw Error('Preview not ready '+log);
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const width of [360,390,768,1440]){
    const mobile=width<768;
    const page=await browser.newPage({viewport:{width,height:mobile?812:900},hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
    try{
      const jsErrors=[];page.on('pageerror',e=>jsErrors.push(e.message));
      for(const [slug,count] of routes){
        const response=await page.goto(base+'/apprendre/pratique/'+slug+'/',{waitUntil:'domcontentloaded'});
        assert.equal(response?.status(),200,'Route '+slug);
        assert.equal(await page.locator('h1').count(),1,'H1 '+slug);
        assert.equal(await page.locator('.fca-checks li').count(),count,'Ingredients '+slug);
        if(slug==='lok-lak-de-la-poele-a-l-assiette') {
          const servings=page.locator('[data-workshop-servings-root]');
          assert.equal(await servings.count(),1,'Lok Lak : pilot scaling visible');
          await page.locator('[data-workshop-serving-preset="2"]').click();
          assert.match(await page.locator('[data-workshop-servings-summary]').innerText(),/2 personnes/);
          assert.equal((await page.locator('[data-workshop-ingredient-quantity]').first().innerText()).trim(),'300','Boeuf for 2');
          assert.equal((await page.locator('[data-workshop-ingredient-quantity]').nth(7).innerText()).trim(),'½','Half a tomato for 2');
          await page.locator('[data-workshop-serving-preset="4"]').click();
          assert.equal((await page.locator('[data-workshop-ingredient-quantity]').first().innerText()).trim(),'600','Restore canonical quantity');
          assert.equal(await page.locator('[data-cooking-audio]').count(),0,'Superseded Lok Lak MP3 cannot accompany V2 script');
        }
        assert.equal(await page.locator('.fca-step').count(),6,'Phases '+slug);
        assert.equal(await page.locator('.fca-steps-nav a').count(),6,'Navigation '+slug);
        assert.equal(await page.locator('meta[name="robots"]').getAttribute('content').then(v=>v?.includes('noindex')),true,'Pilot noindex '+slug);
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        assert.ok(overflow<=3,'Horizontal scroll at '+width+' '+slug+': '+overflow);
        const overlap=await page.evaluate(()=>document.querySelector('.fca-breadcrumb').getBoundingClientRect().top-document.querySelector('[data-site-header]').getBoundingClientRect().bottom);
        assert.ok(overlap>=-2,'Fixed header overlaps breadcrumb '+slug+' '+width);
        const audioCount=await page.locator('[data-cooking-audio]').count();
        assert.ok(audioCount===0||audioCount===1,'At most one recording per atelier '+slug);
        if(audioCount===1){
          assert.equal(await page.locator('[data-cooking-chapter]').count(),7,'Intro + six genuine chapters');
          assert.match(await page.locator('[data-cooking-audio]').getAttribute('src'),/\/audio\/workshops\/[^/]+\/atelier-coral[.]mp3$/);
          const chapterOne=page.locator('[data-cooking-chapter]').nth(1);
          await chapterOne.click();
          assert.equal(await chapterOne.getAttribute('aria-current'),'true','Selecting phase updates the active audio chapter');
          const follow=page.locator('[data-cooking-follow]');
          await follow.click();
          assert.equal(await follow.getAttribute('aria-pressed'),'true','Following enabled');
          await page.locator('[data-cooking-chapter]').nth(3).click();
          assert.equal(await page.locator('#phase-assembler').count(),1,'Large phase target exists');
          await page.evaluate(()=>window.dispatchEvent(new WheelEvent('wheel',{deltaY:130})));
          assert.equal(await follow.getAttribute('aria-pressed'),'false','Manual scrolling stops following');
          assert.equal(await page.locator('[data-cooking-audio]').count(),1,'Playback element retained');
          if (mobile) {
            // Simulate the media play notification independently of Chromium audio decoding.
            await page.locator('[data-cooking-audio]').evaluate(el=>el.dispatchEvent(new Event('play')));
            assert.equal(await page.locator('[data-cooking-mobile-dock]').getAttribute('data-visible'),'true','Mobile controls stay on-screen during a phase');
            await page.locator('[data-cooking-mobile-stop]').click();
            assert.equal(await page.locator('[data-cooking-mobile-dock]').getAttribute('data-visible'),'false','Mobile dock can be dismissed');
          }
          assert.equal(await page.locator('[data-cooking-chapter]').first().getAttribute('aria-current'),null,'Introduction is deselected');
          await page.locator('.guided-cooking-transcript summary').click();
          assert.ok((await page.locator('[data-cooking-transcript]').innerText()).length>90,'Opened chapter transcription remains accessible');
          if(width===360){
            const url=await page.locator('[data-cooking-audio]').getAttribute('src');
            const audioResponse=await page.request.get(base+url,{headers:{Range:'bytes=0-1023'}});
            assert.ok([200,206].includes(audioResponse.status()),'Recorded MP3 is served by the built site: '+slug);
            await audioResponse.dispose();
          }
        }else{
          assert.equal(await page.locator('audio').count(),0,'Do not fabricate an MP3 '+slug);
        }
        assert.equal(await page.locator('.fca-hero-photo img').evaluate(e=>e instanceof HTMLImageElement&&e.complete&&e.naturalWidth>0),true,'Editorial photo '+slug);

        await page.locator('.fca-checks input').first().check();
        assert.equal(await page.locator('.fca-checks input').first().isChecked(),true);
        await page.locator('.fca-observe details summary').first().click();
        assert.equal(await page.locator('.fca-observe details[open]').count(),1);
        assert.deepEqual(jsErrors,[]);
      }
      console.log('FIVE_COMPLETE_WORKSHOPS_BROWSER_PASS '+width);
    }finally{await page.close()}
  }
}catch(error){
  console.error('FIVE_COMPLETE_WORKSHOPS_BROWSER_FAIL '+(error?.stack||error));
  process.exitCode=1;
}finally{
  await browser?.close();
  if(server.pid&&process.platform!=='win32'){try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')}}else server.kill('SIGTERM');
}
