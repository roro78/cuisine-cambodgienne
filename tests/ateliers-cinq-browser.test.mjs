import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const port=4411,base='http://127.0.0.1:'+port;
const cli=fileURLToPath(new URL('../node_modules/astro/astro.js',import.meta.url));
const server=spawn(process.execPath,[cli,'preview','--host','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'});
let log='';for(const stream of [server.stdout,server.stderr])stream.on('data',part=>{log+=String(part)});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const routes=[
 ['lok-lak-de-la-poele-a-l-assiette',11],
 ['samlor-machu-soupe-acidulee-guidee',9],
 ['num-banh-chok-sauce-et-herbes-fraiches',8],
 ['kuy-teav-bouillon-et-nouilles',9],
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
        let blueprint;
        if(true) {
          const servings=page.locator('[data-workshop-servings-root]');
          assert.equal(await servings.count(),1,'Every complete V2 course must expose a portion selector');
          await page.locator('[data-workshop-serving-preset="2"]').click();
          assert.match(await page.locator('[data-workshop-servings-summary]').innerText(),/2 personnes/);
          if (slug==='lok-lak-de-la-poele-a-l-assiette') assert.equal((await page.locator('[data-workshop-ingredient-quantity]').first().innerText()).trim(),'300','Boeuf for 2');
          if (slug==='lok-lak-de-la-poele-a-l-assiette') assert.equal((await page.locator('[data-workshop-ingredient-quantity]').nth(7).innerText()).trim(),'½','Half a tomato for 2');
          await page.locator('[data-workshop-serving-preset="4"]').click();
          if (slug==='lok-lak-de-la-poele-a-l-assiette') assert.equal((await page.locator('[data-workshop-ingredient-quantity]').first().innerText()).trim(),'600','Restore canonical quantity');
          const recipeslug=({ 'lok-lak-de-la-poele-a-l-assiette':'lok-lak','samlor-machu-soupe-acidulee-guidee':'samlor-machu','num-banh-chok-sauce-et-herbes-fraiches':'num-banh-chok','kuy-teav-bouillon-et-nouilles':'kuy-teav','bai-sach-chrouk-porc-riz-et-pickles':'bai-sach-chrouk' })[slug];
          blueprint=JSON.parse(readFileSync('src/data/atelier-recette-guides/'+recipeslug+'.json','utf8'));
          const expectedRecording=blueprint.audio.status==='script_only'?0:1;
          assert.equal(await page.locator('[data-cooking-audio]').count(),expectedRecording,
            'Never show a previous MP3 with a corrected script; the exact active asset must be present');
          if(expectedRecording===1){
            const activeSrc=await page.locator('[data-cooking-audio]').getAttribute('src');
            assert.equal(activeSrc,blueprint.audio.asset.audioUrl,'Serve only the exact active MP3 matching the approved script');
            assert.match(activeSrc,/atelier-coral-v[23][.]mp3$/,'Never serve obsolete V1');
          }
        }
        assert.equal(await page.locator('.fca-step').count(),6,'Phases '+slug);
        assert.equal(await page.locator('.fca-steps-nav a').count(),6,'Navigation '+slug);
        assert.equal(await page.locator('meta[name="robots"]').getAttribute('content').then(v=>v?.includes('noindex')),blueprint.status!=='release_ready','Pilot noindex '+slug);
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        assert.ok(overflow<=3,'Horizontal scroll at '+width+' '+slug+': '+overflow);
        // Portion selectors above scroll to the ingredient area on mobile.
        // Header clearance must be checked at the top of the document.
        await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
        const geometry=await page.evaluate(()=>{
          const crumb=document.querySelector('.fca-breadcrumb').getBoundingClientRect();
          const header=document.querySelector('[data-site-header]').getBoundingClientRect();
          const main=document.querySelector('.full-cooking-atelier');
          return {overlap:crumb.top-header.bottom,headerBottom:header.bottom,crumbTop:crumb.top,scrollY:window.scrollY,paddingTop:getComputedStyle(main).paddingTop,hash:location.hash};
        });
        assert.ok(geometry.overlap>=-2,'Fixed header overlaps breadcrumb '+slug+' '+width+' '+JSON.stringify(geometry));
        const audioCount=await page.locator('[data-cooking-audio]').count();
        assert.ok(audioCount===0||audioCount===1,'At most one recording per atelier '+slug);
        if(audioCount===1){
          assert.equal(await page.locator('[data-cooking-chapter]').count(),7,'Intro + six genuine chapters');
          assert.match(await page.locator('[data-cooking-audio]').getAttribute('src'),/atelier-coral-v[23][.]mp3$/);
          const chapterOne=page.locator('[data-cooking-chapter]').nth(1);
          if(mobile){
            assert.equal(await page.locator('[data-cooking-mobile-dock]').getAttribute('data-visible'),'true','Mobile player is visible before playback');
            assert.equal(await page.locator('.guided-cooking-audio-head').isVisible(),false,'Big audio block hidden on mobile');
            assert.equal(await page.locator('[data-cooking-mobile-progress]').count(),1,'Mobile progress exists');
            await page.locator('[data-cooking-mobile-steps]').click();
            await page.locator('[data-cooking-mobile-chapter]').nth(1).click();
          } else {
            assert.equal(await page.locator('.guided-cooking-audio-head').isVisible(),true,'Desktop full audio layout preserved');
            assert.equal(await page.locator('[data-cooking-mobile-dock]').isVisible(),false,'Dock absent on desktop');
            await chapterOne.click();
          }
          assert.equal(await chapterOne.getAttribute('aria-current'),'true','Selecting phase updates active audio chapter');
          const follow=mobile?page.locator('[data-cooking-mobile-follow]'):page.locator('[data-cooking-follow]');
          if(mobile){
            // Playback itself enables automatic page following by default.
            await page.locator('[data-cooking-audio]').evaluate(el=>el.dispatchEvent(new Event('play')));
            assert.equal(await follow.getAttribute('aria-pressed'),'true','Mobile playback auto-enables chapter-to-page scroll');
            // Simulate the moment MP3 reaches the next large section without
            // synthesizing or decoding any new audio.
            await page.locator('[data-cooking-audio]').evaluate(audio=>{
              const chapters=JSON.parse(audio.closest('[data-cooking-chapters]').dataset.cookingChapters);
              audio.currentTime=chapters[3].startSec+0.1;
              audio.dispatchEvent(new Event('timeupdate'));
            });
            const view=await page.locator('#phase-assembler').evaluate(el=>({top:el.getBoundingClientRect().top,viewport:window.innerHeight}));
            assert.ok(view.top>=0 && view.top<view.viewport*0.7,
              'MP3 phase transition must scroll entire mobile recipe page to next section: '+JSON.stringify(view));
            // A manual gesture overrides automatic navigation and resuming
            // playback does not steal the screen back.
            await page.evaluate(()=>window.dispatchEvent(new WheelEvent('wheel',{deltaY:130})));
            assert.equal(await follow.getAttribute('aria-pressed'),'false','Manual scroll cancels automatic page following');
            await page.locator('[data-cooking-audio]').evaluate(el=>el.dispatchEvent(new Event('play')));
            assert.equal(await follow.getAttribute('aria-pressed'),'false','Playback does not undo manual user opt-out');
            await page.locator('[data-cooking-mobile-steps]').click();
            await follow.click();
            assert.equal(await follow.getAttribute('aria-pressed'),'true','Following can be explicitly restored');
            assert.equal(await page.locator('[data-cooking-mobile-sheet]').isVisible(),false,'Following closes sheet to show recipe');
            await page.locator('[data-cooking-mobile-steps]').click();
            await page.locator('[data-cooking-mobile-chapter]').nth(3).click();
          } else {
            await follow.click();
            assert.equal(await follow.getAttribute('aria-pressed'),'true','Desktop following remains manual');
            await page.locator('[data-cooking-chapter]').nth(3).click();
          }
          assert.equal(await page.locator('#phase-assembler').count(),1,'Large phase target exists');
          await page.evaluate(()=>window.dispatchEvent(new WheelEvent('wheel',{deltaY:130})));
          assert.equal(await follow.getAttribute('aria-pressed'),'false','Manual scrolling stops following');
          assert.equal(await page.locator('[data-cooking-audio]').count(),1,'Only one audio element');
          assert.equal(await page.locator('[data-cooking-chapter]').first().getAttribute('aria-current'),null,'Introduction deselected');
          if(mobile){
            await page.locator('[data-cooking-audio]').evaluate(el=>el.dispatchEvent(new Event('play')));
            assert.equal(await page.locator('[data-cooking-mobile-dock]').getAttribute('data-visible'),'true','Mobile player stays fixed during playback');
            await page.locator('[data-cooking-mobile-steps]').click();
            assert.equal(await page.locator('[data-cooking-mobile-sheet]').isVisible(),true,'Sliding sheet opens');
            assert.equal(await page.locator('[data-cooking-mobile-chapter]').count(),7,'Seven chapters in sheet');
            await page.locator('[data-cooking-mobile-tab="transcript"]').click();
            assert.equal(await page.locator('[data-cooking-mobile-transcript]').isVisible(),true,'Mobile transcript is accessible');
            assert.ok((await page.locator('[data-cooking-mobile-transcript]').innerText()).length>90);
            const transcriptAuto=page.locator('[data-cooking-mobile-transcript-follow]');
            assert.equal(await transcriptAuto.getAttribute('aria-pressed'),'true','Transcript auto-scroll is on by default');
            if(width===360 && slug==='lok-lak-de-la-poele-a-l-assiette'){
              // Drive playback to the middle of chapter three from the actual
              // approved timeline. No MP3 synthesis or network generation.
              await page.locator('[data-cooking-audio]').evaluate(audio=>{
                const root=audio.closest('[data-cooking-chapters]');
                const c=JSON.parse(root.dataset.cookingChapters)[3];
                audio.currentTime=c.startSec+(c.endSec-c.startSec)*.7;
                audio.dispatchEvent(new Event('timeupdate'));
              });
              const scroll=await page.locator('[data-cooking-mobile-transcript-scroll]').evaluate(el=>({top:el.scrollTop,height:el.clientHeight,total:el.scrollHeight}));
              assert.ok(scroll.total>scroll.height,'Long spoken transcript has an independently scrollable area');
              assert.ok(scroll.top>2,'Transcript must automatically scroll at actual chapter playback time');
              await page.locator('[data-cooking-mobile-transcript-scroll]').evaluate(el=>el.dispatchEvent(new WheelEvent('wheel',{deltaY:160,bubbles:true})));
              assert.equal(await transcriptAuto.getAttribute('aria-pressed'),'false','Manual transcript scrolling disengages auto-scroll');
              await transcriptAuto.click();
              assert.equal(await transcriptAuto.getAttribute('aria-pressed'),'true','Transcript following can be reenabled');
            }
            await page.locator('[data-cooking-mobile-tab="chapters"]').click();
            assert.equal(await page.locator('[data-cooking-mobile-chapter]').nth(3).getAttribute('aria-current'),'true','Current spoken chapter highlighted in mobile sheet');
            await page.locator('[data-cooking-mobile-chapter]').nth(2).click();
            assert.equal(await page.locator('[data-cooking-chapter]').nth(2).getAttribute('aria-current'),'true','Chapter selection updates original track');
            assert.equal(await page.locator('[data-cooking-mobile-sheet]').isVisible(),false,'Sheet closes after selecting chapter');
            await page.locator('[data-cooking-mobile-steps]').click();
            await follow.click();
            assert.equal(await follow.getAttribute('aria-pressed'),'true','Follow can be reenabled');
            assert.equal(await page.locator('[data-cooking-mobile-sheet]').isVisible(),false,'Recipe stays visible in following mode');
            await page.locator('[data-cooking-mobile-transcript]').evaluate(el=>el.dispatchEvent(new Event('touchmove',{bubbles:true})));
            assert.equal(await follow.getAttribute('aria-pressed'),'false','Manual touch stops page follow without pausing');
            await page.locator('[data-cooking-mobile-steps]').click();
            await page.locator('[data-cooking-mobile-stop]').click();
            assert.equal(await page.locator('[data-cooking-mobile-dock]').getAttribute('data-visible'),'true','Player remains ready after Stop');
          } else {
            await page.locator('.guided-cooking-transcript summary').click();
            assert.ok((await page.locator('[data-cooking-transcript]').innerText()).length>90,'Desktop transcript remains accessible');
          }
          if(width===360){
            const url=await page.locator('[data-cooking-audio]').getAttribute('src');
            const audioResponse=await page.request.get(base+url,{headers:{Range:'bytes=0-1023'}});
            assert.ok([200,206].includes(audioResponse.status()),'Recorded MP3 is served by built site: '+slug);
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
