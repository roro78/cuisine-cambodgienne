import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

/* D25 focused evidence: exactly one real Playwright recording per viewport.
   Does not exercise the nine-viewports historical cinematic suite. */
const port=4347,base='http://127.0.0.1:'+port,dir='artifacts';
const cli=fileURLToPath(new URL('../node_modules/astro/astro.js',import.meta.url));
const server=spawn(process.execPath,[cli,'preview','--host','127.0.0.1','--port',String(port)],{
  stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'
});
let output='';
for(const stream of [server.stdout,server.stderr])stream.on('data',data=>output+=String(data));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitReady(){
  for(let attempt=0;attempt<70;attempt++){
    if(server.exitCode!==null)throw Error('Astro exited: '+output);
    try{if((await fetch(base+'/v17-accueil-preview/',{signal:AbortSignal.timeout(1800)})).ok)return}catch{}
    await sleep(300);
  }
  throw Error('Preview server unavailable: '+output);
}
async function transition(page,start,end,frames=28){
  for(let i=0;i<=frames;i++){
    const y=start+(end-start)*i/frames;
    await page.evaluate(top=>window.scrollTo({top,behavior:'instant'}),y);
    await page.waitForTimeout(110);
  }
}
async function capture(browser,width,height){
  const mobile=width<=760;
  const name=mobile?'mobile':'desktop';
  const page=await browser.newPage({
    viewport:{width,height},isMobile:mobile,hasTouch:mobile,
    reducedMotion:'no-preference',
    recordVideo:{dir,size:{width,height}}
  });
  const video=page.video();
  const scriptErrors=[];
  page.on('pageerror',error=>scriptErrors.push(error.message));
  try{
    const response=await page.goto(base+'/v17-accueil-preview/',{waitUntil:'networkidle',timeout:30000});
    assert.equal(response?.status(),200,'V17 preview must respond 200');
    const scene=page.locator('[data-v17-table-editorial]');
    assert.equal(await scene.count(),1);
    await scene.scrollIntoViewIfNeeded();
    await page.waitForTimeout(550);
    const geometry=await page.evaluate(()=>{
      const root=document.querySelector('[data-v17-table-editorial]');
      const stage=root.querySelector('.v17r-table-stage');
      const culture=root.querySelector('.v17r-table-culture');
      const dessert=document.querySelector('.v17r-dessert');
      const box=root.getBoundingClientRect();
      const stageBox=stage.getBoundingClientRect();
      const range=document.createRange();
      range.selectNodeContents(culture.firstChild);
      const cultureTextBottom=range.getBoundingClientRect().bottom;
      const wave=root.nextElementSibling?.querySelector('svg');
      const waveBox=wave?.getBoundingClientRect();
      const waveGone=wave?getComputedStyle(wave.closest('.v17r-handoff,.v17r-wave')).display==='none':false;
      const photo=root.querySelector('.v17r-table-fullbleed').getBoundingClientRect();
      const heading=root.querySelector('#v17r-table-title');
      return {
        viewport:{width:innerWidth,height:innerHeight},
        sectionHeight:Math.round(box.height),
        stageGap:Math.round(box.bottom-stageBox.bottom),
        nextGap:Math.round(dessert.getBoundingClientRect().top-box.bottom),
        cultureBottomInset:Math.round(box.bottom-culture.getBoundingClientRect().bottom),
        cultureTextInset:Math.round(box.bottom-cultureTextBottom),
        backdropSeamless:getComputedStyle(root).backgroundColor===getComputedStyle(stage).backgroundColor,
        cultureTransparent:getComputedStyle(culture).backgroundColor==='rgba(0, 0, 0, 0)',
        photoFullHeight:Math.abs(photo.height-stageBox.height)<=2,
        waveLeft:waveBox?Math.round(waveBox.left):null,
        waveRight:waveBox?Math.round(waveBox.right):null,
        waveGone,
        titleChanged:heading?.querySelector('span')?.textContent?.trim()==='LE GOÛT' &&
          heading?.querySelector('em')?.textContent?.trim()==='DU PARTAGE.',
        horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        slides:root.querySelectorAll('[data-v17-table-recipe]').length,
        imageTransform:getComputedStyle(root.querySelector('.v17r-table-fullbleed img')).transform,
        carouselSnap:getComputedStyle(root.querySelector('[data-v17-table-carousel]')).scrollSnapType,
        boundaryDepth:parseFloat(getComputedStyle(document.querySelector('.v17r')).getPropertyValue('--v17-boundary-depth')) || 0,
        dessertClip:getComputedStyle(dessert).clipPath
      };
    });
    assert.equal(geometry.slides,4,'All four real recipes required');
    assert.ok(geometry.titleChanged,'Updated feast heading should render on mobile and desktop');
    assert.ok(geometry.backdropSeamless,'Stage/background shades must not differ: '+JSON.stringify(geometry));
    assert.ok(geometry.waveGone,
      'D27 opaque SVG backing sheet must stay hidden: '+JSON.stringify(geometry));
    assert.ok(Math.abs(geometry.stageGap)<=3,'No spacer beneath stage: '+JSON.stringify(geometry));
    assert.ok(geometry.nextGap < -30 && geometry.nextGap > -95,
      'D27 next photographic chapter must overlap the feast, not leave a gap: '+JSON.stringify(geometry));
    assert.ok(geometry.dessertClip.startsWith('polygon('),
      'D27 dessert image must receive the curved clip edge: '+JSON.stringify(geometry));
    assert.ok(geometry.horizontalOverflow<=2,'No unintended page-level horizontal overflow: '+JSON.stringify(geometry));
    assert.equal(geometry.imageTransform,'none','Feast background is still photography');
    if(!mobile){
      assert.ok(geometry.sectionHeight<=height*1.12,'No 205vh sticky spacer on desktop: '+JSON.stringify(geometry));
      assert.ok(geometry.cultureBottomInset>=25 && geometry.cultureBottomInset<=95,
        'Cultural link must stay inside photographed stage and above the wave: '+JSON.stringify(geometry));
    } else {
      assert.ok(geometry.cultureTextInset>=58,'Culture link must be above the overlapping wave: '+JSON.stringify(geometry));
      assert.ok(geometry.photoFullHeight && geometry.cultureTransparent,
        'Mobile backdrop must remain photographic to the edge, without a solid rectangle: '+JSON.stringify(geometry));
      assert.ok(geometry.carouselSnap.includes('mandatory'),'Mobile swipe-snap absent: '+JSON.stringify(geometry));
      assert.ok(geometry.sectionHeight<height*2.25,'Mobile section still overlong: '+JSON.stringify(geometry));
    }
    // D27: inspect ALL five scene boundaries, not just the feast.
    // The incoming scene must overlap the outgoing one, with its OWN
    // clipped photographic/solid content instead of an opaque SVG sheet.
    const boundaries=await page.evaluate(()=>{
      const pairs=[
        ['.v17r-market','.v17r-palette'],
        ['.v17r-palette','.v17r-gestures--cinematic'],
        ['.v17r-gestures--cinematic','.v17r-table--editorial'],
        ['.v17r-table--editorial','.v17r-dessert'],
        ['.v17r-dessert','.v17r-finale']
      ];
      return pairs.map(([previous,next])=>{
        const left=document.querySelector(previous),right=document.querySelector(next);
        const rect=left.getBoundingClientRect(),nextRect=right.getBoundingClientRect();
        return {previous,next,overlap:Math.round(rect.bottom-nextRect.top),
          clip:getComputedStyle(right).clipPath,
          margin:getComputedStyle(right).marginTop,
          wave:document.querySelector(previous)?.nextElementSibling?.className||''};
      });
    });
    for(const item of boundaries){
      assert.ok(item.overlap>=30&&item.overlap<=95&&item.clip.startsWith('polygon('),
        'D27 wave must be formed by next chapter itself: '+JSON.stringify(item));
    }
    await fs.writeFile(dir+'/v17-d27-'+name+'-boundaries.json',JSON.stringify(boundaries,null,2)+'\n');
    for(let i=0;i<boundaries.length;i++){
      const pair=boundaries[i];
      await page.evaluate(selector=>{
        const from=document.querySelector(selector);
        const at=window.scrollY+from.getBoundingClientRect().bottom-innerHeight*.53;
        window.scrollTo({top:Math.max(0,at),behavior:'instant'});
      },pair.previous);
      await page.waitForTimeout(250);
      await page.screenshot({
        path:dir+'/v17-d27-'+name+'-boundary-'+(i+1)+'.png',
        animations:'disabled'
      });
    }
    await fs.writeFile(dir+'/v17-d25-'+name+'-geometry.json',JSON.stringify(geometry,null,2)+'\n');
    const bounds=await page.evaluate(()=>{
      const el=document.querySelector('[data-v17-table-editorial]');
      const scroll=document.querySelector('[data-v17-table-carousel]');
      const sectionY=scrollY+el.getBoundingClientRect().top;
      const endY=scrollY+el.getBoundingClientRect().bottom;
      const trackY=scrollY+scroll.getBoundingClientRect().top;
      const max=document.documentElement.scrollHeight-innerHeight;
      return {sectionY,endY,trackY,max};
    });
    if(mobile){
      const from=Math.max(0,bounds.sectionY-height*.63);
      const into=Math.max(0,Math.min(bounds.max,bounds.trackY-height*.15));
      await transition(page,from,into,22);
      for(let index=0;index<4;index++){
        const dot=page.locator('[data-v17-carousel-dot="'+index+'"]');
        await dot.click();
        await page.waitForFunction(n=>{
          const section=document.querySelector('[data-v17-table-editorial]');
          return section.querySelector('[data-v17-carousel-page]')?.textContent?.trim()===(n+1)+' / 4';
        },index,{timeout:4500});
        await page.waitForTimeout(520);
        const link=await page.locator('[data-v17-table-recipe]').nth(index).locator('a').getAttribute('href');
        assert.ok(link?.startsWith('/recettes/'),'Missing recipe '+index);
        await page.screenshot({path:dir+'/v17-d25-mobile-slide-'+(index+1)+'.png',animations:'disabled'});
      }
      assert.equal(await page.locator('[data-v17-carousel-next]').isDisabled(),true);
      await transition(page,Math.min(bounds.max,bounds.trackY-height*.1),Math.min(bounds.max,bounds.endY+height*.18),25);
    }else{
      await transition(page,Math.max(0,bounds.sectionY-height*.70),Math.max(0,bounds.sectionY),31);
      await page.waitForTimeout(500);
      await scene.screenshot({path:dir+'/v17-d25-desktop-section.png',animations:'disabled'});
      await transition(page,Math.max(0,bounds.sectionY),Math.min(bounds.max,bounds.endY+height*.18),42);
    }
    await page.waitForTimeout(320);
    assert.deepEqual(scriptErrors,[],'No browser JavaScript errors: '+JSON.stringify(scriptErrors));
    console.log('V17 D25 '+name.toUpperCase()+' PASS '+JSON.stringify(geometry));
  }finally{
    await page.close();
    if(video)await video.saveAs(dir+'/v17-d25-'+name+'.webm');
  }
}
let browser;
try{
  await fs.mkdir(dir,{recursive:true});
  await waitReady();
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  await capture(browser,390,844);
  await capture(browser,1440,900);
  console.log('V17 D25 VIDEOS PASS');
}catch(e){console.error('V17 D25 evidence FAIL',e?.stack||e);process.exitCode=1}
finally{
  await browser?.close();
  if(server.pid&&process.platform!=='win32'){
    try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')}
  }else server.kill('SIGTERM');
}
