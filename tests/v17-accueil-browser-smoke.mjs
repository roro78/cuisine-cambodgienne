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
  // Lab telemetry only. Not a substitute for Lighthouse or real-user Core Web Vitals.
  if(!noJs && !reduced && [390,1440].includes(width)){
    await page.addInitScript(() => {
      window.__v17Lab = {lcpMs:null,cls:0};
      if(!('PerformanceObserver' in window))return;
      try {
        new PerformanceObserver(list => {
          for(const entry of list.getEntries())window.__v17Lab.lcpMs=entry.startTime;
        }).observe({type:'largest-contentful-paint',buffered:true});
      } catch {}
      try {
        new PerformanceObserver(list => {
          for(const entry of list.getEntries()){
            if(!entry.hadRecentInput)window.__v17Lab.cls+=entry.value;
          }
        }).observe({type:'layout-shift',buffered:true});
      } catch {}
    });
  }
  page.setDefaultTimeout(17000);
  page.on('pageerror',e=>errors.push(width+': '+e.message));
  try{
    const res=await page.goto(base+'/v17-accueil-preview/',{waitUntil:'networkidle',timeout:30000});
    assert.equal(res?.status(),200);
    // Snapshot before the scripted full-page scroll. LCP measured after scrolling
    // would describe the test journey rather than the page's initial render.
    const initialLoad=(!noJs && !reduced && [390,1440].includes(width))
      ? await page.evaluate(()=>({
          lcpMs:window.__v17Lab?.lcpMs ?? null,
          cls:window.__v17Lab?.cls ?? null,
          navigationMs:performance.getEntriesByType('navigation')[0]?.duration??null
        }))
      : null;
    assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
    // Preview must not accidentally claim the canonical or social URL of /.
    // When D8 is approved, the public route receives its own SEO contract.
    if(width===1440 && !noJs && !reduced){
      const seo=await page.evaluate(()=>{
        const meta=(name)=>document.querySelector(name)?.getAttribute('content')??null;
        const canonical=document.querySelector('link[rel="canonical"]')?.href??null;
        const schemas=[...document.querySelectorAll('script[type="application/ld+json"]')]
          .map(el=>JSON.parse(el.textContent));
        return {
          canonical,
          ogUrl:meta('meta[property="og:url"]'),
          ogImage:meta('meta[property="og:image"]'),
          title:document.title,
          description:meta('meta[name="description"]'),
          schemas:schemas.map(item=>({type:item['@type'],url:item.url}))
        };
      });
      assert.equal(new URL(seo.canonical).pathname,'/v17-accueil-preview/');
      assert.equal(new URL(seo.ogUrl).pathname,'/v17-accueil-preview/');
      assert.ok(seo.ogImage?.endsWith('/images/cuisine/v17-hero-amok-genere.webp'));
      assert.ok(seo.title.includes('V17')&&seo.description.length>50);
      assert.deepEqual(seo.schemas.map(x=>x.type),['WebSite','WebPage']);
      assert.equal(new URL(seo.schemas[1].url).pathname,'/v17-accueil-preview/');
    }
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('.v17r h2').count(),6);
    const chapters=['hero','market','palette','gestures','table','dessert','finale'];
    for(const chapter of chapters)assert.equal(await page.locator('.v17r-'+chapter).count(),1);
    const links=['/recettes/','/ingredients/','/glossaire/','/apprendre/','/recettes/chek-ktis/','/apprendre/piler-aromates-au-mortier/'];
    for(const href of links)assert.ok(await page.locator('a[href="'+href+'"]').count()>0,'Missing '+href);
    const angkorImage=page.locator('.v17r-finale-landscape img');
    assert.equal(await angkorImage.getAttribute('src'),'/images/cuisine/v17-angkor-sunset-1600.jpg');
    assert.match(await angkorImage.getAttribute('alt'),/Angkor Wat.*soleil couchant/);
    assert.equal(await page.locator('.v17r-finale-credit').count(),0,
      'Photographer credit line must be kept on the dedicated credits page');
    // D7 accessibility: every primary CTA remains a genuine 44px touch target.
    // Check actual layout bounds, not just the presence of a CSS declaration.
    if([390,1440].includes(width) && !noJs && !reduced){
      const targets=await page.locator('.v17r-pill').evaluateAll(nodes =>
        nodes.map(el => {
          const box=el.getBoundingClientRect();
          return {text:el.textContent?.trim(),width:box.width,height:box.height};
        })
      );
      assert.ok(targets.length>=7 && targets.every(t=>t.width>=44 && t.height>=44),
        'V17 primary CTAs must be at least 44×44 CSS px: '+JSON.stringify(targets));
      // WCAG AA text contrast on solid-colour primary buttons. This does not
      // claim a full contrast audit of text over the photographic backgrounds.
      const ctaContrast=await page.locator('.v17r-pill:not(.v17r-pill-outline)').evaluateAll(nodes=>{
        const channels=(css)=>{
          if(!css.startsWith('rgb'))return null;
          const from=css.indexOf('('),to=css.indexOf(')',from+1);
          if(from<0||to<0)return null;
          const values=css.slice(from+1,to).split(',').slice(0,3)
            .map(x=>Number(x.trim())/255);
          return values.length===3&&values.every(Number.isFinite)?values:null;
        };
        const luminance=(rgb)=>rgb.reduce((sum,v,i)=>{
          const linear=v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
          return sum+linear*[.2126,.7152,.0722][i];
        },0);
        return nodes.map(el=>{
          const st=getComputedStyle(el);
          const fore=channels(st.color),back=channels(st.backgroundColor);
          const ratio=fore&&back?(Math.max(luminance(fore),luminance(back))+.05)/
            (Math.min(luminance(fore),luminance(back))+.05):0;
          return {label:el.textContent?.trim(),color:st.color,background:st.backgroundColor,ratio};
        });
      });
      assert.ok(ctaContrast.length>=6 && ctaContrast.every(x=>x.ratio>=4.5),
        'Primary CTA labels must meet 4.5:1 solid colour contrast: '+JSON.stringify(ctaContrast));
    }
    if(width===390 && !noJs && !reduced){
      // The skip link must be first in keyboard order, before the shared header.
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.v17r-skip').evaluate(el=>el===document.activeElement),
        true,'Keyboard must reach the skip-to-content link first');
      const skipStyle=await page.locator('.v17r-skip').evaluate(el=>{
        const style=getComputedStyle(el);
        return {background:style.backgroundColor,color:style.color,top:el.getBoundingClientRect().top};
      });
      assert.notEqual(skipStyle.background,'rgba(0, 0, 0, 0)',
        'Focused skip link needs an opaque contrasting background: '+JSON.stringify(skipStyle));
      assert.ok(skipStyle.top>=-1,'Focused skip link should be on screen: '+JSON.stringify(skipStyle));
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(()=>location.hash),'#v17r-main',
        'Skip link should navigate directly to main content');
    }
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

    // The page itself may have no horizontal scroll while an oversized H2 is
    // silently cut by .v17r{overflow:clip}. Measure actual WORD glyph boxes.
    // Only meaningful visible content, not decorative / aria-hidden typography.
    if([320,360,390,430].includes(width)){
      const clippedWords=await page.evaluate(()=>{
        const offenders=[];
        const content=document.querySelector('.v17r');
        const nodes=content.querySelectorAll('h1,h2,p,a,figcaption');
        for(const el of nodes){
          if(el.closest('[aria-hidden="true"]')||el.getClientRects().length===0)continue;
          const st=getComputedStyle(el);
          if(st.display==='none'||st.visibility==='hidden')continue;
          // Accessibility-only figcaptions deliberately use a 1px clipped box.
          // Their DOM text extends beyond that box, but no glyph is painted.
          const elBox=el.getBoundingClientRect();
          if(st.clipPath==='inset(50%)' ||
            (elBox.width<=2 && elBox.height<=2 && st.overflow==='hidden'))continue;
          // Avoid passing a JS filter callback to native TreeWalker: Chromium
          // may reclaim it during long scroll QA runs ('no longer runnable').
          const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
          let node;
          while((node=walker.nextNode())){
            if(node.parentElement?.closest('[aria-hidden="true"]') ||
              !node.nodeValue?.trim())continue;
            for(const match of node.nodeValue.matchAll(/\S+/g)){
              const range=document.createRange();
              range.setStart(node,match.index);
              range.setEnd(node,match.index+match[0].length);
              const rect=range.getBoundingClientRect();
              if(rect.width>.5 && (rect.left < -2 || rect.right > innerWidth+2)){
                offenders.push({
                  element:el.tagName.toLowerCase(),
                  text:match[0],
                  section:el.closest('section')?.className||'unknown',
                  left:Math.round(rect.left),
                  right:Math.round(rect.right),
                  viewport:innerWidth
                });
              }
              range.detach();
            }
          }
        }
        return offenders.slice(0,20);
      });
      assert.deepEqual(clippedWords,[],
        'Visible text glyphs must not be cut off-screen at '+width+'px: '+JSON.stringify(clippedWords));
    }
    for(const selector of ['.v17r-hero-dish img','.v17r-market-visual > img','.v17r-palette-a img','.v17r-palette-b img','.v17r-gestures-main img','.v17r-table-amok img','.v17r-dessert-generated img','.v17r-finale-landscape img']){
      if(!(await page.locator(selector).isVisible()))continue;
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForFunction(s=>{const img=document.querySelector(s);return img?.complete&&img.naturalWidth>0},selector,{timeout:10000});
    }
    const decorativeAssets=await page.evaluate(()=>{
      const selected=['.v17r-hero-green-corner','.v17r-hero-flower-dish',
        '.v17r-lemongrass','.v17r-palette-lime',
        '.v17r-palette-foliage-left','.v17r-palette-foliage-right',
        '.v17r-gestures-kroeung img',
        '.v17r-dessert-generated img'];
      return selected.map(selector=>{
        const node=document.querySelector(selector);
        return {
          selector,
          exists:!!node,
          hidden:!!node && getComputedStyle(node).display==='none',
          loaded:!!node?.complete && node.naturalWidth>0
        };
      });
    });
    // A deliberately hidden responsive ornament is not fetched by Chromium
    // when loading="lazy". That is a bandwidth win, not a missing resource.
    assert.ok(decorativeAssets.every(x=>x.exists && (x.hidden || x.loaded)),
      'Every visible botanical or food photograph must load: '+JSON.stringify(decorativeAssets));
    // The approved AI market is mandatory; no fallback to documentary photos.
    assert.equal(await page.locator('.v17r-market-visual--generated').count(),1,
      'The approved fictional land-market illustration must be the active scene');
    const marketImage=page.locator('.v17r-market-visual > img').first();
    assert.equal(await marketImage.getAttribute('src'),
      '/images/cuisine/v17-marche-cambodgien-ia.webp');
    assert.match(await marketImage.getAttribute('alt'),/Illustration générée par IA/);
    const marketCaption=await page.locator('.v17r-market-visual figcaption').innerText();
    assert.match(marketCaption,/marché imaginaire/i);
    assert.match(marketCaption,/inspiré du Cambodge/i);
    assert.equal(await page.locator('.v17r-hero-disclosure a[href="/credits-photos/#illustrations-ia"]').count(),1,
      'AI disclosure should link to existing credits without repeated scene labels');
    assert.equal(await page.locator('.v17r-table-clarity').count(),0,
      'Remove the intrusive source note on the table illustration');
    assert.equal(await page.locator('.v17r-market-postcard').count(),0,
      'The new illustrated market must not overlay old documentary photography');
    if([390,1440].includes(width) && !noJs && !reduced){
      const stage=await page.evaluate(()=>{
        const market=document.querySelector('.v17r-market').getBoundingClientRect();
        const photo=document.querySelector('.v17r-market-visual').getBoundingClientRect();
        const copy=document.querySelector('.v17r-market-copy');
        const gesture=document.querySelector('.v17r-gestures');
        return {
          marketWidth:market.width,
          photoWidth:photo.width,
          photoHeight:photo.height,
          marketHeight:market.height,
          copyBackground:getComputedStyle(copy).backgroundColor,
          gestureCols:getComputedStyle(gesture).gridTemplateColumns,
          duplicateGestures:document.querySelectorAll('.v17r-gestures-steps li').length,
          decorativeNotes:document.querySelectorAll('.v17r-handnote,.v17r-calligraphy,.v17r-label').length
        };
      });
      assert.ok(stage.photoWidth>=stage.marketWidth-2 &&
        Math.abs(stage.photoHeight-stage.marketHeight)<3,
        'Market artwork must span the WHOLE scene, not end at a green side panel: '+JSON.stringify(stage));
      assert.equal(stage.copyBackground,'rgba(0, 0, 0, 0)',
        'Market text must overlay photography without a solid green card');
      assert.equal(stage.duplicateGestures,0,'No repeated Couper Piler Sentir pictograms');
      assert.equal(stage.decorativeNotes,0,'No micro decorative text overlapping headlines');
    }
    const marketDimensions=await marketImage.evaluate(el=>({
      loaded:el.complete&&el.naturalWidth>0,
      width:el.naturalWidth,height:el.naturalHeight
    }));
    assert.deepEqual(marketDimensions,{loaded:true,width:1672,height:941},
      'The approved market must load at its native verified dimensions');
    // Shared stage checks: no CSS regression to mortar or ingredients.
    if([390,1440].includes(width) && !noJs && !reduced){
      const stage=await page.evaluate(()=>{
        const mortar=document.querySelector('.v17r-gestures-main');
        const caption=document.querySelector('.v17r-market-visual figcaption');
        const ingredients=document.querySelectorAll('.v17r-palette-media figure img');
        return {
          mortarShape:getComputedStyle(mortar).borderTopLeftRadius,
          captionVisible:getComputedStyle(caption).display!=='none',
          photographedIngredients:ingredients.length,
          botanicalLayers:document.querySelectorAll('.v17r-palette-foliage-left,.v17r-palette-foliage-right').length,
          seamCount:document.querySelectorAll('.v17r-wave svg').length
        };
      });
      // D13: no more floating rounded card — photography is now full bleed.
      assert.equal(stage.mortarShape,'0px',
        'Mortar main photo must be a cinematic stage, not a rounded card: '+JSON.stringify(stage));
      assert.ok(stage.captionVisible && stage.photographedIngredients===2 &&
        stage.botanicalLayers===2 && stage.seamCount===3,
        'V17 ingredients, market attribution and scene seams: '+JSON.stringify(stage));
    }
    if([390,1440].includes(width) && !noJs && !reduced){
      const cinema=await page.evaluate(()=>{
        const section=document.querySelector('[data-v17-mortar-scene]');
        const photo=section?.querySelector('.v17r-gestures-main');
        const copy=section?.querySelector('.v17r-gestures-copy');
        const words=section?.querySelectorAll('.v17r-gesture-word');
        const shade=section?.querySelector('.v17r-gestures-shade');
        const rect=section?.getBoundingClientRect();
        const photoRect=photo?.getBoundingClientRect();
        const copyRect=copy?.getBoundingClientRect();
        return {
          width:rect?.width,photoWidth:photoRect?.width,
          height:rect?.height,photoHeight:photoRect?.height,
          wordCount:words?.length,copyWidth:copyRect?.width,
          shade:shade?getComputedStyle(shade).backgroundImage:'',
          articleLink:!!copy?.querySelector('a[href="/apprendre/piler-aromates-au-mortier/"]')
        };
      });
      assert.ok(cinema.width>0 && Math.abs(cinema.photoWidth-cinema.width)<3 &&
        Math.abs(cinema.photoHeight-cinema.height)<3 && cinema.wordCount===3 &&
        cinema.copyWidth>0 && cinema.shade.includes('linear-gradient') && cinema.articleLink,
        'Mortar must be a full-bleed, readable three-beat stage: '+JSON.stringify(cinema));
    }
    if(width===1440){
      const immersive=await page.evaluate(()=>({
        hero:document.querySelector('.v17r-hero').getBoundingClientRect().height,
        market:document.querySelector('.v17r-market').getBoundingClientRect().height,
        palette:document.querySelector('.v17r-palette').getBoundingClientRect().height,
        gestures:document.querySelector('.v17r-gestures').getBoundingClientRect().height,
        table:document.querySelector('.v17r-table').getBoundingClientRect().height,
        dessert:document.querySelector('.v17r-dessert').getBoundingClientRect().height,
        viewport:innerHeight
      }));
      // The full-screen chapter sizing is intentional: each scene has room for
      // its independent GSAP scroll animation. Verify heights rather than force
      // an editorial "short/long" hierarchy on the approved experience.
      assert.ok(immersive.hero>=immersive.viewport*.78 &&
        immersive.market>=immersive.viewport*.9 &&
        immersive.palette>=immersive.viewport*.9 &&
        immersive.gestures>=immersive.viewport*.85 &&
        immersive.table>=immersive.viewport*.9,
        'Desktop scenes keep their deliberate immersive viewport presence: '+JSON.stringify(immersive));
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
      assert.ok(heroFidelity && heroFidelity.firstLineRight<=heroFidelity.photoLeft+heroFidelity.photoWidth*.22,
        'The headline must remain outside the opaque part of the hero photo: '+JSON.stringify(heroFidelity));
      assert.ok(heroFidelity.photoWidth>=heroFidelity.mediaWidth*.96 &&
        heroFidelity.ratio>=.8 && heroFidelity.ratio<=1.8 &&
        heroFidelity.clip==='none' && heroFidelity.mask.includes('linear-gradient'),
        'Hero food photo must fill the chapter edge with a soft fade, not an image square: '+JSON.stringify(heroFidelity));
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
      // D12: the gesture headline should visibly settle into place as its
      // scene enters the viewport; never conceal essential copy.
      const entry=await page.evaluate(async()=>{
        const scene=document.querySelector('.v17r-gestures');
        const heading=scene.querySelector('.v17r-gesture-word--accent');
        const top=scrollY+scene.getBoundingClientRect().top;
        scrollTo({top:Math.max(0,top-innerHeight*.40),behavior:'instant'});
        await new Promise(r=>setTimeout(r,850));
        const from={transform:getComputedStyle(heading).transform,
          opacity:Number(getComputedStyle(heading).opacity)};
        scrollTo({top:Math.max(0,top+innerHeight*.12),behavior:'instant'});
        await new Promise(r=>setTimeout(r,950));
        const to={transform:getComputedStyle(heading).transform,
          opacity:Number(getComputedStyle(heading).opacity)};
        return {from,to};
      });
      assert.ok(entry.from.transform!==entry.to.transform &&
        entry.from.opacity>=.8 && entry.to.opacity>=.8 &&
        entry.to.opacity>entry.from.opacity,
        'D13 mortar word entrance must be perceptible and readable: '+JSON.stringify(entry));
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    }
    const rhythm=await page.evaluate(()=>{
      const items=['hero','market','palette','gestures','table','dessert','finale'];
      return items.map(key=>{const el=document.querySelector('.v17r-'+key);return {
        key,height:Math.round(el.getBoundingClientRect().height),cols:getComputedStyle(el).gridTemplateColumns
      }});
    });
    if(width>=1024){
      // User-approved viewport chapters are intentionally immersive, not
      // artificially alternated short/long sections.
      assert.ok(rhythm.every((scene,index)=>scene.height>=height*(index===0?.84:.94)),
        'Every desktop chapter must occupy at least one useful screen: '+JSON.stringify(rhythm));
    }else{
      assert.ok(Math.max(...rhythm.map(x=>x.height))-Math.min(...rhythm.map(x=>x.height))>100,
        'Mobile/tablet chapters must remain content-adaptive: '+JSON.stringify(rhythm));
    }
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
        for(const scene of ['hero','market','palette','gestures','table','dessert']){
          await page.locator('.v17r-'+scene).screenshot({
            path:'artifacts/v17-accueil-'+width+'-'+scene+'.png',
            animations:'disabled',
          });
        }
      }
    }
    // Evidence is gathered on the same two viewports as the recorded scroll.
    // LCP/CLS are synthetic Chromium values affected by CI hardware and scripted
    // scrolling. They are reported, never treated as field performance scores.
    if(!noJs && !reduced && [390,1440].includes(width)){
      const metrics=await page.evaluate((initialLoad) => {
        const resource=performance.getEntriesByType('resource');
        const images=resource.filter(x=>x.initiatorType==='img');
        const paints=performance.getEntriesByType('paint');
        return {
          viewport:{width:innerWidth,height:innerHeight},
          observedAtMs:Math.round(performance.now()),
          initialLoad,
          postScrollLcpMs:window.__v17Lab?.lcpMs ?? null,
          postScrollCls:window.__v17Lab?.cls ?? null,
          firstContentfulPaintMs:paints.find(x=>x.name==='first-contentful-paint')?.startTime??null,
          imageRequests:images.length,
          knownImageTransferBytes:images.reduce((sum,x)=>sum+(x.transferSize||0),0),
          note:'Initial-load LCP is captured before scripted scrolling; post-scroll LCP/CLS are not field CWV. Chromium CI lab only.'
        };
      },initialLoad);
      await fs.mkdir('artifacts',{recursive:true});
      await fs.writeFile('artifacts/v17-accueil-d7-metrics-'+width+'.json',
        JSON.stringify(metrics,null,2)+String.fromCharCode(10));
      console.log('V17 D7 lab metrics '+width+'px '+JSON.stringify(metrics));
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
    // D8: the public / is the real V17 site, with indexable canonical SEO.
    // The preview stays noindex and has its own /v17-accueil-preview/ canonical.
    if(width===390||width===1440){
      const homeRes=await page.request.get(base+'/');
      assert.equal(homeRes.status(),200);
      const html=await homeRes.text();
      assert.match(html,/id="v17r-hero-title"/,'Public / must render V17');
      assert.match(html,/name="robots" content="index,follow/,'Public / must be indexable');
      assert.doesNotMatch(html,/Prévisualisation technique V17 — non publiée/);
      const canonical=html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1];
      assert.ok(canonical,'Public homepage canonical missing');
      assert.equal(new URL(canonical).pathname,'/');
      const ogUrl=html.match(/<meta[^>]+property="og:url"[^>]+content="([^"]+)"/)?.[1];
      assert.equal(new URL(ogUrl).pathname,'/');
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
    // At the top of the real page, the sticky header must not artificially
    // obscure the heading in the screenshot. Full page for mobile is also
    // useful to spot defects below the fold in guided recipe steps.
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(220);
    if(width<=430){
      await page.screenshot({
        path:'artifacts/v17-recipe-'+slug+'-'+width+'.png',
        fullPage:true,
        animations:'disabled'
      });
    }else{
      await page.locator('.recipe-v15-hero').screenshot({
        path:'artifacts/v17-recipe-'+slug+'-'+width+'.png',
        animations:'disabled'
      });
    }
    console.log('V17 generated recipe '+slug+' '+width+'px PASS');
  }finally{await page.close()}
}
try{
  await waitForServer();
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  // 1920 = wide desktop. 640 = responsive layout reflow corresponding to
  // 1280 CSS px at 200% browser zoom; this is not a substitute for actual zoom QA.
  for(const [w,h] of [[1920,1080],[1440,900],[1024,768],[768,1024],[640,720],[430,932],[390,844],[360,800],[320,640]]){
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
