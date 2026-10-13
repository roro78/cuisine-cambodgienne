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
  const captureVideo=screenshot && !noJs && !reduced && [390,1440].includes(width);
  if(captureVideo)await fs.mkdir('artifacts',{recursive:true});
  const page=await browser.newPage({viewport:{width,height},isMobile:width<=430,hasTouch:width<=430,
    javaScriptEnabled:!noJs,reducedMotion:reduced?'reduce':'no-preference',
    ...(captureVideo?{recordVideo:{dir:'artifacts',size:width===1440?{width:720,height:450}:{width:390,height:844}}}:{})
  });
  const video=page.video();
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
    for(const selector of ['.v17r-hero-dish img','.v17r-market-visual > img','.v17r-palette-a img','.v17r-palette-b img','.v17r-gestures-main img','.v17r-table-amok img','.v17r-dessert-generated img','.v17r-finale-landscape img']){
      if(!(await page.locator(selector).isVisible()))continue;
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForFunction(s=>{const img=document.querySelector(s);return img?.complete&&img.naturalWidth>0},selector,{timeout:10000});
    }
    const decorativeAssets=await page.evaluate(()=>{
      const selected=['.v17r-hero-green-corner','.v17r-hero-flower-dish',
        '.v17r-lemongrass','.v17r-palette-lime','.v17r-gestures-kroeung img',
        '.v17r-dessert-generated img'];
      return selected.map(selector=>{
        const node=document.querySelector(selector);
        return {selector,exists:!!node,loaded:!!node?.complete&&node.naturalWidth>0}
      });
    });
    assert.ok(decorativeAssets.every(x=>x.exists&&x.loaded),
      'All botanical SVG and genuine texture layers must load: '+JSON.stringify(decorativeAssets));
    const marketPostcard=await page.evaluate(()=>{
      const frame=document.querySelector('.v17r-market-visual')?.getBoundingClientRect();
      const card=document.querySelector('.v17r-market-postcard')?.getBoundingClientRect();
      const photo=document.querySelector('.v17r-market-postcard img');
      return {frame:frame&&{x:frame.x,y:frame.y,right:frame.right,bottom:frame.bottom},
        card:card&&{x:card.x,y:card.y,right:card.right,bottom:card.bottom},
        photoLoaded:!!photo?.complete&&photo.naturalWidth>0};
    });
    assert.ok(marketPostcard.photoLoaded && marketPostcard.frame && marketPostcard.card,
      'Market must include the separately sourced fruit photograph: '+JSON.stringify(marketPostcard));
    assert.ok(marketPostcard.card.x>=marketPostcard.frame.x-1 &&
      marketPostcard.card.y>=marketPostcard.frame.y-1 &&
      marketPostcard.card.right<=marketPostcard.frame.right+1 &&
      marketPostcard.card.bottom<=marketPostcard.frame.bottom+1,
      'Market postcard must stay inside the photographed market frame: '+JSON.stringify(marketPostcard));
    if(width===1440){
      const immersive=await page.evaluate(()=>({
        hero:document.querySelector('.v17r-hero').getBoundingClientRect().height,
        market:document.querySelector('.v17r-market').getBoundingClientRect().height,
        viewport:innerHeight
      }));
      assert.ok(immersive.hero>=immersive.viewport*.78 && immersive.market>=immersive.viewport*.9,
        'Key chapters should have full-screen editorial presence: '+JSON.stringify(immersive));
    }
    const heroLines=await page.evaluate(()=>{
      const el=document.querySelector('#v17r-hero-title');
      return {viewport:innerWidth,font:getComputedStyle(el).fontSize,
        width:el.getBoundingClientRect().width,
        scrollWidth:el.scrollWidth,clientWidth:el.clientWidth};
    });
    assert.ok(heroLines.scrollWidth-heroLines.clientWidth<=2,
      'Headline must not be clipped on small screens: '+JSON.stringify(heroLines));
    // Geometric contract derived from the accepted hero composition:
    // the headline stays on the left, clear of the main food photograph.
    if(width===1440){
      const heroFidelity=await page.evaluate(()=>{
        const title=document.querySelector('#v17r-hero-title');
        const image=document.querySelector('.v17r-hero-dish');
        const media=document.querySelector('.v17r-hero-media');
        const first=title?.firstChild;
        if(!first||!image||!media)return null;
        const line=document.createRange();
        line.selectNodeContents(first);
        return {firstLineRight:line.getBoundingClientRect().right,
          photoLeft:image.getBoundingClientRect().left,
          photoWidth:image.getBoundingClientRect().width,
          mediaWidth:media.getBoundingClientRect().width,
          ratio:image.getBoundingClientRect().width/image.getBoundingClientRect().height,
          clip:getComputedStyle(image).clipPath,
          mask:getComputedStyle(image).maskImage};
      });
      assert.ok(heroFidelity && heroFidelity.firstLineRight<=heroFidelity.photoLeft,
        'Hero heading must not touch the food photograph: '+JSON.stringify(heroFidelity));
      assert.ok(heroFidelity.photoWidth>=heroFidelity.mediaWidth &&
        heroFidelity.ratio>=1.2 && heroFidelity.ratio<=1.5 &&
         (heroFidelity.clip!=='none'||heroFidelity.mask!=='none'),
        'Hero food photograph must be monumental and non-elliptical: '+JSON.stringify(heroFidelity));
      const dessertComposition=await page.evaluate(()=>{
        const art=document.querySelector('.v17r-dessert-art')?.getBoundingClientRect();
        const scene=document.querySelector('.v17r-dessert-generated')?.getBoundingClientRect();
        const image=document.querySelector('.v17r-dessert-generated img');
        const inset=document.querySelector('.v17r-dessert-main,.v17r-dessert-second');
        return art&&scene&&image?{
          mainShare:scene.width/art.width,
          imageLoaded:image.complete&&image.naturalWidth>0,
          imageWidth:image.naturalWidth,
          extraInserts:inset?1:0
        }:null;
      });
      assert.ok(dessertComposition && dessertComposition.mainShare>=.88 &&
        dessertComposition.imageLoaded && dessertComposition.imageWidth>=1200 &&
        dessertComposition.extraInserts===0,
        'Desserts must use one premium full-width generated composition: '+JSON.stringify(dessertComposition));
    }
    if(width===1440 && !noJs && !reduced){
      const tableScene=await page.evaluate(()=>{
        const frame=document.querySelector('.v17r-table');
        const main=document.querySelector('.v17r-table-amok img');
        const inset=document.querySelector('.v17r-table-detail');
        return {
          frameWidth:frame?.getBoundingClientRect().width,
          mainWidth:main?.getBoundingClientRect().width,
          insetCount:inset?1:0,
          mainLoaded:!!main?.complete&&main.naturalWidth>0
        };
      });
      assert.ok(tableScene.mainLoaded&&tableScene.insetCount===0&&
        tableScene.mainWidth>=tableScene.frameWidth*.98,
        'Table must be immersive, with one editorial image and no oval collage: '+JSON.stringify(tableScene));
      const anim=await page.evaluate(async()=>{
        const scene=document.querySelector('.v17r-palette');
        const node=scene.querySelector('.v17r-palette-a');
        const offset=scrollY+scene.getBoundingClientRect().top;
        scrollTo({top:Math.max(0,offset-innerHeight+30),behavior:'instant'});
        await new Promise(r=>setTimeout(r,300));
        const initial=getComputedStyle(node).transform;
        scrollTo({top:offset+scene.getBoundingClientRect().height*.2,behavior:'instant'});
        await new Promise(r=>setTimeout(r,650));
        return {initial,current:getComputedStyle(node).transform};
      });
      assert.notEqual(anim.initial,anim.current,
        'Desktop ingredients must converge during native scroll: '+JSON.stringify(anim));
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
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
      if([390,1440].includes(width)){
        for(const scene of ['hero','table','dessert']){
          await page.locator('.v17r-'+scene).screenshot({
            path:'artifacts/v17-accueil-'+width+'-'+scene+'.png',
            animations:'disabled',
          });
        }
      }
    }
    // Record the actual browser while it scrolls through the complete preview.
    // Video is evidence, not a visual comparison against the approved PNG.
    if(captureVideo){
      const total=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
      const step=height*.28;
      for(let offset=0;offset<=total;offset+=step){
        await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),offset);
        await page.waitForTimeout(110);
      }
      await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),total);
      await page.waitForTimeout(450);
    }
    // The preview must never be confused with the public homepage.
    if(width===390||width===1440){
      const homeRes=await page.request.get(base+'/');
      assert.equal(homeRes.status(),200);
      assert.doesNotMatch(await homeRes.text(),/v17r-hero/);
    }
    console.log('V17 D2 preview '+width+' × '+height+(noJs?' noJS':'')+(reduced?' reduced':'')+' PASS');
  }finally{
    await page.close();
    if(video){
      await video.saveAs('artifacts/v17-accueil-'+width+'-scroll.webm');
      console.log('V17 D7 browser video recorded: '+width+'px');
    }
  }
}
/* Generated recipe artwork must also work on the real V16 recipe routes.
 * This is a read-only browser check; the V17 preview remains isolated. */
async function checkGeneratedRecipe(slug,filename,width,height){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<=430,hasTouch:width<=430});
  try{
    const response=await page.goto(base+'/recettes/'+slug+'/',{waitUntil:'networkidle',timeout:30000});
    assert.equal(response?.status(),200,'Recipe URL '+slug);
    const cover=page.locator('.recipe-v15-cover img');
    await cover.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{
      const img=document.querySelector('.recipe-v15-cover img');
      return img?.complete && img.naturalWidth>1000 && img.naturalHeight>700;
    },undefined,{timeout:15000});
    const src=await cover.getAttribute('src');
    assert.equal(src,'/images/cuisine/'+filename);
    assert.match(await cover.getAttribute('alt'),/Illustration culinaire générée/);
    const recipeHero=page.locator('.recipe-v16[data-generated-artwork="true"] .recipe-v15-hero');
    assert.equal(await recipeHero.count(),1,'Generated recipe must have a scoped style variant');
    const background=await recipeHero.evaluate(el=>getComputedStyle(el).backgroundImage);
    if(width>=901)assert.match(background,/linear-gradient\(90deg/i,
      'Generated recipe desktop text must not be crossed by a diagonal background');
    else assert.equal(background,'none','Mobile recipe keeps one cream background');
    const dimension=await page.evaluate(()=>({
      html:document.documentElement.scrollWidth,
      client:document.documentElement.clientWidth
    }));
    assert.ok(dimension.html-dimension.client<=2,'Recipe horizontal overflow: '+slug+' '+width+'px '+JSON.stringify(dimension));
    await fs.mkdir('artifacts',{recursive:true});
    await page.locator('.recipe-v15-hero').screenshot({
      path:'artifacts/v17-recipe-'+slug+'-'+width+'.png',
      animations:'disabled'
    });
    console.log('V17 generated recipe '+slug+' '+width+'px PASS');
  }finally{await page.close()}
}
try{
  await waitForServer();
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const [w,h] of [[1440,900],[390,844],[320,640],[360,800],[430,932],[768,1024],[1024,768]]){
    await run(w,h,{screenshot:true});
  }
  await run(390,844,{reduced:true});
  await run(390,844,{noJs:true});
  for(const [slug,file] of [
    ['lok-lak','v17-lok-lak-genere.webp'],
    ['num-banh-chok','v17-nom-banh-chok-genere.webp']
  ]){
    await checkGeneratedRecipe(slug,file,1440,900);
    await checkGeneratedRecipe(slug,file,390,844);
  }
  assert.deepEqual(errors,[],'No browser JS errors');
  console.log('V17 D2 browser gate: PASS');
}catch(e){console.error('V17 D2 browser gate FAIL:',e?.stack||e);process.exitCode=1}
finally{if(browser)await browser.close();if(server.pid&&process.platform!=='win32'){
  try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')}}else server.kill('SIGTERM');}
