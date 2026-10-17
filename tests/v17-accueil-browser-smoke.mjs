import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const port=4341;
const base='http://127.0.0.1:'+port;
// Keep the full responsive assertions in CI while avoiding 20-minute
// cinematic recordings. Detailed screenshots/videos remain opt-in locally.
const detailedEvidence=process.env.V17_FULL_EVIDENCE==='1';
// On this already-tested D27 PR, run the previously blocked no-JS gate
// alone. Main always runs all nine responsive widths plus no-JS.
const onlyNoJs=process.env.V17_ONLY_NOJS==='1';
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
  // Native Node watchdog keeps no-JS tests from silently hanging in CI.
  const watchdog=noJs?setTimeout(()=>{
    console.error('V17 NOJS WATCHDOG: no-JavaScript test exceeded 110 seconds');
    process.exit(2);
  },110000):null;
  if(noJs)console.log('V17 NOJS CHECKPOINT: create browser page');
  const page=await browser.newPage({viewport:{width,height},isMobile:width<=430,hasTouch:width<=430,
    javaScriptEnabled:!noJs,reducedMotion:reduced?'reduce':'no-preference'
  });
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
    if(noJs)console.log('V17 NOJS CHECKPOINT: preview loaded');
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
    const photo=await page.evaluate(async()=>{
      const section=document.querySelector('[data-v17-table-editorial]');
      const img=section.querySelector('.v17r-table-fullbleed img');
      // This scene is lazy-loaded several viewports below the fold. Decode the
      // actual responsive picture before reading currentSrc/naturalWidth.
      img.loading='eager';
      await img.decode().catch(()=>{});
      const copy=section.querySelector('.v17r-table-copy');
      const h=copy.querySelector('h2');
      return {img:img?.getAttribute('src'),fit:getComputedStyle(img).objectFit,
        count:section.querySelectorAll('.v17r-table-fullbleed img').length,
        links:[...section.querySelectorAll('.v17r-table-recipe-link')].map(a=>a.getAttribute('href')),
        culture:section.querySelector('.v17r-table-culture')?.getAttribute('href'),
        recipes:section.querySelectorAll('[data-v17-table-recipe]').length,
        source:section.querySelector('.v17r-table-fullbleed picture source')?.getAttribute('srcset'),
        activeImage:img?.currentSrc?.split('/').pop(),
        imageWidth:img?.naturalWidth,
        mobileImages:[...section.querySelectorAll('.v17r-table-recipe-image')]
          .every(i=>i.complete&&i.naturalWidth>0),
        headingOverflow:h.scrollWidth-h.clientWidth};
    });
    assert.ok(photo.count===1&&photo.fit==='cover'&&
      photo.img==='/images/cuisine/v17-tablee-khmere-generee.webp'&&
      photo.headingOverflow<=2&&photo.recipes===4&&
      photo.source==='/images/cuisine/v17-tablee-khmere-mobile.webp'&&
      photo.activeImage===(width<=760?'v17-tablee-khmere-mobile.webp':'v17-tablee-khmere-generee.webp')&&
      photo.imageWidth===(width<=760?941:1672)&&
      JSON.stringify(photo.links)===JSON.stringify([
        '/recettes/amok-trey/','/recettes/lok-lak/',
        '/recettes/num-banh-chok/','/recettes/prahok-ktis/'])&&
      photo.culture==='/culture/construire-repas-cambodgien/',
      'D22 still tabletop, four REAL linked recipes and cultural link: '+JSON.stringify(photo));
    if(width<=760){
      // D24: genuine compact native mobile scroll-snap, not four vertically
      // stacked photographic screens. Swipe works even without JavaScript.
      const carousel=await page.evaluate(()=>{
        const section=document.querySelector('[data-v17-table-editorial]');
        const track=section.querySelector('[data-v17-table-carousel]');
        const controls=section.querySelector('[data-v17-carousel-controls]');
        const cards=[...track.querySelectorAll('[data-v17-table-recipe]')];
        const first=cards[0].getBoundingClientRect();
        const second=cards[1].getBoundingClientRect();
        const cs=getComputedStyle(track);
        return {
          display:cs.display,overflow:cs.overflowX,snap:cs.scrollSnapType,
          tracks:cards.length,hasHorizontalOverflow:track.scrollWidth>track.clientWidth+100,
          firstLeft:first.left,secondLeft:second.left,
          sidePeek:second.left<innerWidth,
          photoStill:getComputedStyle(section.querySelector('.v17r-table-fullbleed img')).transform,
          controls:getComputedStyle(controls).display,
          ready:section.hasAttribute('data-v17-carousel-ready'),
          sectionHeight:section.getBoundingClientRect().height,
          viewportHeight:innerHeight,
          tabStop:track.getAttribute('tabindex')
        };
      });
      assert.ok(carousel.display==='flex' && carousel.overflow==='auto' ||
        carousel.display==='flex' && carousel.overflow==='scroll',
        'D24 mobile recipes must use a native horizontal scroller: '+JSON.stringify(carousel));
      assert.ok(carousel.snap.includes('mandatory')&&
        carousel.tracks===4&&carousel.hasHorizontalOverflow&&
        carousel.firstLeft<carousel.secondLeft&&carousel.sidePeek&&
        carousel.photoStill==='none'&&
        carousel.controls===(noJs?'none':'grid')&&
        carousel.ready!==noJs &&
        carousel.tabStop==='0'&&
        carousel.sectionHeight<carousel.viewportHeight*3,
        'D24 native carousel must stay compact, visible and no-JS safe: '+JSON.stringify(carousel));
      if(width===390&&!noJs&&!reduced){
        const nav=page.locator('[data-v17-carousel-controls]');
        const dots=nav.locator('[data-v17-carousel-dot]');
        assert.equal(await dots.count(),4);
        assert.equal(await nav.locator('[data-v17-carousel-prev]').isDisabled(),true);
        await nav.locator('[data-v17-carousel-next]').click();
        await page.waitForFunction(()=>{
          const scene=document.querySelector('[data-v17-table-editorial]');
          return scene.querySelector('[data-v17-carousel-page]').textContent.trim()==='2 / 4';
        });
        await page.waitForTimeout(600);
        assert.equal(await dots.nth(1).getAttribute('aria-current'),'true');
        await dots.nth(3).click();
        await page.waitForTimeout(650);
        assert.equal(await nav.locator('[data-v17-carousel-page]').innerText(),'4 / 4');
        assert.equal(await nav.locator('[data-v17-carousel-next]').isDisabled(),true);
        const advanced=await page.locator('[data-v17-table-carousel]').evaluate(el=>({
          left:el.scrollLeft,width:el.clientWidth,
          visibleLinks:[...el.querySelectorAll('.v17r-table-recipe-link')]
            .filter(a=>{const r=a.getBoundingClientRect(),t=el.getBoundingClientRect();
              return r.left>=t.left-4&&r.right<=t.right+4}).length
        }));
        assert.ok(advanced.left>advanced.width*2 && advanced.visibleLinks>=1,
          'D24 swipe must reveal a real linked fourth card: '+JSON.stringify(advanced));
        // Keyboard navigation from the focused scroller, not only touch.
        const track=page.locator('[data-v17-table-carousel]');
        await track.focus();
        await page.keyboard.press('Home');
        await page.waitForTimeout(650);
        assert.equal(await nav.locator('[data-v17-carousel-page]').innerText(),'1 / 4');
        // Real user-like scroll gesture via the native horizontal scroll API.
        await track.evaluate(el=>el.scrollBy({left:el.clientWidth,behavior:'instant'}));
        await page.waitForTimeout(650);
        assert.equal(await nav.locator('[data-v17-carousel-page]').innerText(),'2 / 4');
        await dots.nth(0).click();
        await page.waitForTimeout(650);
      }
    }
    // D25: navigation in the horizontal carousel scrolls the document.
    // Restore the initial viewport before the global on-screen glyph audit,
    // or legitimate GSAP hero exits would be counted as clipped text.
    if(width===390&&!noJs&&!reduced){
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      await page.waitForTimeout(1000);
    }
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
          // D24: the other three recipe slides are intentionally offscreen
          // inside a horizontal scroller. Check the active slide text here;
          // the dedicated carousel assertions test links on every slide.
          const rail=el.closest('[data-v17-table-carousel]');
          if(rail){
            const card=el.closest('[data-v17-table-recipe]');
            if(card && card!==rail.querySelector('[data-v17-table-recipe]'))continue;
          }
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
    if(noJs)console.log('V17 NOJS CHECKPOINT: start image readiness');
    for(const selector of ['.v17r-hero-dish img','.v17r-market-visual > img','.v17r-palette-a img','.v17r-palette-b img','.v17r-gestures-main img','.v17r-table-fullbleed img','.v17r-dessert-generated img','.v17r-finale-landscape img']){
      if(!(await page.locator(selector).isVisible()))continue;
      await page.locator(selector).scrollIntoViewIfNeeded();
      if(noJs){
        console.log('V17 NOJS IMAGE: '+selector);
        // Playwright waitForFunction needs an in-page timer, which never fires
        // when scripting is disabled; poll the image from Node instead.
        let loaded=false;
        for(let attempt=0;attempt<50;attempt++){
          loaded=await page.locator(selector).evaluate(img=>img.complete&&img.naturalWidth>0);
          if(loaded)break;
          await new Promise(resolve=>setTimeout(resolve,150));
        }
        assert.ok(loaded,'No-JS photo did not load: '+selector);
      }else{
        await page.waitForFunction(s=>{const img=document.querySelector(s);return img?.complete&&img.naturalWidth>0},selector,{timeout:10000});
      }
    }
    if(noJs)console.log('V17 NOJS CHECKPOINT: images ready');
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
          marketClip:getComputedStyle(document.querySelector('.v17r-market-visual')).clipPath,
          dessertClip:getComputedStyle(document.querySelector('.v17r-dessert-art')).clipPath,
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
      assert.equal(stage.marketClip,'none',
        'Market image must stay full-bleed without an animated green left strip');
      assert.equal(stage.dessertClip,'none',
        'Dessert frame must not reveal a green right strip before its own iris effect');
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
    // D14: all three additional transition seams are purely decorative,
    // zero-height and correctly located between their intended chapters.
    const handoffs=await page.evaluate(()=>{
      return [...document.querySelectorAll('.v17r-handoff')].map(node=>{
        const rect=node.getBoundingClientRect();
        const svg=node.querySelector('svg');
        return {
          cls:node.className,
          height:rect.height,
          svgHeight:svg?.getBoundingClientRect().height??0,
          display:getComputedStyle(node).display,
          hidden:node.getAttribute('aria-hidden'),
          events:getComputedStyle(node).pointerEvents,
          from:node.previousElementSibling?.className??'',
          to:node.nextElementSibling?.className??''
        };
      });
    });
    assert.equal(handoffs.length,3,'D14 must add exactly three restrained bridges');
    for(const [index,from,to] of [[0,'v17r-palette','v17r-gestures'],
      [1,'v17r-table','v17r-dessert'],[2,'v17r-dessert','v17r-finale']]){
      const bridge=handoffs[index];
      assert.ok(bridge.height===0 && bridge.svgHeight===0 &&
        bridge.display==='none' &&
        bridge.hidden==='true' && bridge.events==='none' &&
        bridge.from.includes(from) && bridge.to.includes(to),
        'D14 bridge must not add scroll space or block actions: '+JSON.stringify(bridge));
    }
    if([768,1024].includes(width)){
      // D23: a two-by-two tablet layout must leave real reading room between
      // the heading, the linked recipes and the culture link (not four columns).
      const tabletLayout=await page.evaluate(()=>{
        const scene=document.querySelector('[data-v17-table-editorial]');
        const stage=scene.querySelector('.v17r-table-stage').getBoundingClientRect();
        const heading=scene.querySelector('.v17r-table-copy').getBoundingClientRect();
        const grid=scene.querySelector('.v17r-table-recipes');
        const box=grid.getBoundingClientRect();
        const culture=scene.querySelector('.v17r-table-culture').getBoundingClientRect();
        const cards=[...scene.querySelectorAll('[data-v17-table-recipe]')].map(card=>{
          const rect=card.getBoundingClientRect();
          const link=card.querySelector('a').getBoundingClientRect();
          return {
            cardLeft:rect.left,cardRight:rect.right,
            linkWidth:link.width,linkHeight:link.height,
            linkRight:link.right,linkLeft:link.left
          };
        });
        return {
          tracks:getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
          headingBottom:heading.bottom,gridTop:box.top,gridBottom:box.bottom,
          cultureTop:culture.top,stageTop:stage.top,stageBottom:stage.bottom,
          cards,viewport:innerWidth
        };
      });
      assert.ok(tabletLayout.tracks===2 &&
        tabletLayout.gridTop>=tabletLayout.headingBottom+6 &&
        tabletLayout.gridBottom<=tabletLayout.cultureTop-6 &&
        tabletLayout.gridBottom<=tabletLayout.stageBottom &&
        tabletLayout.cards.length===4 &&
        tabletLayout.cards.every(card=>card.cardLeft>=-2 &&
          card.cardRight<=tabletLayout.viewport+2 &&
          card.linkLeft>=card.cardLeft-2 &&
          card.linkRight<=card.cardRight+2 &&
          card.linkWidth>=44&&card.linkHeight>=44),
        'D23 tablet feast must be a readable two-column grid with 44px links: '+
        JSON.stringify(tabletLayout));
    }
    if([768,1024].includes(width)&&!noJs&&!reduced){
      // Tablet should display readable copy even before ScrollTrigger animates.
      // The two lines use opposite vertical entrance vectors, unlike desktop.
      const tablet=await page.evaluate(async()=>{
        const section=document.querySelector('[data-v17-table-editorial]');
        const top=scrollY+section.getBoundingClientRect().top-innerHeight*1.15;
        scrollTo({top:Math.max(0,top),behavior:'instant'});
        await new Promise(resolve=>setTimeout(resolve,750));
        const first=section.querySelector('.v17r-table-copy h2 span');
        const second=section.querySelector('.v17r-table-copy h2 em');
        const firstRecipe=section.querySelector('[data-v17-table-recipe]');
        return {
          firstOpacity:Number(getComputedStyle(first).opacity),
          secondOpacity:Number(getComputedStyle(second).opacity),
          linksOpacity:Number(getComputedStyle(firstRecipe).opacity),
          firstY:new DOMMatrixReadOnly(getComputedStyle(first).transform).m42,
          secondY:new DOMMatrixReadOnly(getComputedStyle(second).transform).m42
        };
      });
      assert.ok(tablet.firstOpacity>=.65&&tablet.secondOpacity>=.65&&
        tablet.linksOpacity>=.7&&tablet.firstY< -12&&tablet.secondY>12,
        'D21 tablet text must remain readable and converge vertically from opposite directions: '+
        JSON.stringify(tablet));
    }
    if([390,768,1024,1440].includes(width)&&!noJs&&!reduced){
      const motion=await page.evaluate(async(width)=>{
        const section=document.querySelector('[data-v17-table-editorial]');
        const heading=section.querySelector('h2 em');
        const actions=section.querySelectorAll('[data-v17-table-recipe]');
        const img=section.querySelector('.v17r-table-fullbleed img');
        // Match the ScrollTrigger range; sampling after section.top is too late:
        // typography has already reached its reading state at that point.
        const top=scrollY+section.getBoundingClientRect().top-innerHeight*.81;
        const end=width===390?
          scrollY+section.getBoundingClientRect().top-innerHeight*.16:
          scrollY+section.getBoundingClientRect().bottom-innerHeight*.91;
        const points=[];
        for(const t of [.025,.42,.92]){
          scrollTo({top:Math.max(0,top+(end-top)*t),behavior:'instant'});
          await new Promise(r=>setTimeout(r,850));
          points.push({heading:Number(getComputedStyle(heading).opacity),
            actions:Number(getComputedStyle(actions[0]).opacity),
            photoTransform:getComputedStyle(img).transform});
        }
        return {points,loaded:img.naturalWidth===(width<=760?941:1672),
          stagePosition:getComputedStyle(section.querySelector('.v17r-table-stage')).position};
      },width);
      assert.ok(motion.loaded&&motion.stagePosition==='relative'&&
        motion.points[0].heading<motion.points[2].heading&&
        motion.points[2].heading>.9&&
        (width===390 || (motion.points[0].actions<motion.points[2].actions &&
          motion.points[2].actions>.9))&&
        motion.points.every(x=>x.photoTransform==='none'),
        'D22 four linked recipe chapters over an unmoving feast: '+JSON.stringify(motion));
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    }
    // D25: no artificial blank continuation below the feast scene.
    if([390,768,1024,1440].includes(width)){
      const seam=await page.evaluate(()=>{
        const section=document.querySelector('[data-v17-table-editorial]');
        const stage=section.querySelector('.v17r-table-stage');
        const final=section.querySelector('.v17r-table-culture');
        const desserts=document.querySelector('.v17r-dessert');
        const box=section.getBoundingClientRect();
        const stageBox=stage.getBoundingClientRect();
        const finalBox=final.getBoundingClientRect();
        const dessertsBox=desserts.getBoundingClientRect();
        return {height:box.height,viewport:innerHeight,
          tailSpace:Math.round(box.bottom-finalBox.bottom),
          stageTail:Math.round(box.bottom-stageBox.bottom),
          nextGap:Math.round(dessertsBox.top-box.bottom),
          dessertMargin:Math.round(parseFloat(getComputedStyle(desserts).marginTop))};
      });
      // The desktop link sits above the cream divider; the inset is part
      // of the photographed scene, not an empty section or scroll spacer.
      assert.ok(Math.abs(seam.stageTail)<=3 && seam.tailSpace<=80 &&
        Math.abs(seam.nextGap-seam.dessertMargin)<=3 &&
        (width<761 || seam.height<=seam.viewport*1.12),
        'D25 feast must connect to desserts without empty bottom spacer: '+
        JSON.stringify(seam));
    }
    // D16: measure TRANSLATION IN PIXELS, rather than mere CSS inequality.
    // Source trigger follows the heading itself, so entry/exit occur while
    // it is inside the viewport, unlike the previous offscreen fake pass.
    if([390,1440].includes(width) && !noJs && !reduced){
      const stageMotion=await page.evaluate(async(width)=>{
        scrollTo({top:0,behavior:'instant'});
        await new Promise(r=>setTimeout(r,550));
        const scene=document.querySelector('.v17r-market');
        const title=scene.querySelector('h2');
        const startMatrix=new DOMMatrixReadOnly(getComputedStyle(title).transform);
        const naturalTop=scrollY+title.getBoundingClientRect().top-startMatrix.m42;
        const start=naturalTop-innerHeight*.96;
        const end=naturalTop-innerHeight*.08;
        const samples=[];
        for(const progress of [.08,.50,.92]){
          scrollTo({top:Math.max(0,start+(end-start)*progress),behavior:'instant'});
          await new Promise(r=>setTimeout(r,1120));
          const style=getComputedStyle(title);
          const matrix=new DOMMatrixReadOnly(style.transform);
          const rect=title.getBoundingClientRect();
          samples.push({
            opacity:Number(style.opacity),
            x:Math.round(matrix.m41),y:Math.round(matrix.m42),
            top:Math.round(rect.top),height:Math.round(rect.height),
            progress
          });
        }
        return {start,end,samples,viewport:{w:innerWidth,h:innerHeight}};
      },width);
      const [enter,read,depart]=stageMotion.samples;
      const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
      assert.ok(stageMotion.end>stageMotion.start &&
        read.opacity>.90 && read.opacity>enter.opacity+.26 &&
        read.opacity>depart.opacity+.20 &&
        distance(enter,read)>(width===390?95:130) &&
        distance(depart,read)>(width===390?70:80) &&
        read.top>=0 && read.top<height &&
        depart.top>-(depart.height*.8) && depart.top<height,
        'D16 viewport choreography requires meaningful onscreen title travel: '+
        JSON.stringify(stageMotion));
      console.log('V17 D16 MEASURED ONSCREEN TITLE MOTION '+width+'px '+
        JSON.stringify(stageMotion));
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    }
    // D17: dessert must fill the entire photographic stage without any
    // rounded rectangular "card", in JS / no-JS / reduced-motion states.
    if([390,1440].includes(width)){
      const dessertStage=await page.evaluate(()=>{
        const scene=document.querySelector('.v17r-dessert');
        const art=scene?.querySelector('.v17r-dessert-art');
        const figure=scene?.querySelector('.v17r-dessert-generated');
        const image=figure?.querySelector('img');
        const a=scene?.getBoundingClientRect();
        const b=art?.getBoundingClientRect();
        const c=figure?.getBoundingClientRect();
        return {
          sceneWidth:a?.width, sceneHeight:a?.height,
          artWidth:b?.width, artHeight:b?.height,
          // Offset geometry is stable while GSAP intentionally scales the
          // reveal image; boundingClientRect includes the animation scale.
          figureWidth:figure?.offsetWidth, figureHeight:figure?.offsetHeight,
          borderRadius:image?getComputedStyle(image).borderTopLeftRadius:'',
          imageFit:image?getComputedStyle(image).objectFit:'',
          loaded:!!image?.naturalWidth,
          link:!!scene?.querySelector('a[href="/recettes/chek-ktis/"]'),
        };
      });
      assert.ok(dessertStage.sceneWidth>0 &&
        Math.abs(dessertStage.sceneWidth-dessertStage.artWidth)<3 &&
        Math.abs(dessertStage.sceneHeight-dessertStage.artHeight)<3 &&
        Math.abs(dessertStage.figureWidth-dessertStage.artWidth)<3 &&
        Math.abs(dessertStage.figureHeight-dessertStage.artHeight)<3 &&
        dessertStage.borderRadius==='0px' && dessertStage.imageFit==='cover' &&
        dessertStage.loaded && dessertStage.link,
        'D17 desserts must be a full-bleed cinematic scene, not a photo card: '+
        JSON.stringify(dessertStage));
    }
    if([390,1440].includes(width) && !noJs && !reduced){
      const flower=await page.evaluate(async()=>{
        const scene=document.querySelector('.v17r-dessert');
        const figure=scene.querySelector('.v17r-dessert-generated');
        const top=scrollY+scene.getBoundingClientRect().top;
        const samples=[];
        for(const diff of [.84,.30]){
          scrollTo({top:Math.max(0,top-innerHeight*diff),behavior:'instant'});
          await new Promise(resolve=>setTimeout(resolve,950));
          samples.push(getComputedStyle(figure).clipPath);
        }
        return samples;
      });
      assert.ok(flower[0].startsWith('circle(') && flower[1].startsWith('circle(') &&
        flower[0]!==flower[1],
        'D17 dessert photograph must visibly blossom open under scrolling: '+
        JSON.stringify(flower));
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
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
      // D16 mortar proof: the first word actually flies in/out across
      // the screen while visible, not the previous imperceptible 26px.
      const gesture=await page.evaluate(async()=>{
        scrollTo({top:0,behavior:'instant'});
        await new Promise(r=>setTimeout(r,500));
        const scene=document.querySelector('[data-v17-mortar-scene]');
        const word=scene.querySelector('.v17r-gesture-word');
        const initial=new DOMMatrixReadOnly(getComputedStyle(word).transform);
        const naturalTop=scrollY+word.getBoundingClientRect().top-initial.m42;
        const start=naturalTop-innerHeight*.96;
        const end=naturalTop-innerHeight*.08;
        const measures=[];
        for(const progress of [.14,.52,.91]){
          scrollTo({top:Math.max(0,start+(end-start)*progress),behavior:'instant'});
          await new Promise(r=>setTimeout(r,1050));
          const style=getComputedStyle(word);
          const matrix=new DOMMatrixReadOnly(style.transform);
          measures.push({x:Math.round(matrix.m41),y:Math.round(matrix.m42),
            opacity:Number(style.opacity),progress});
        }
        return measures;
      });
      const delta=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
      assert.ok(gesture[1].opacity>.90 && gesture[1].opacity>gesture[0].opacity+.15 &&
        delta(gesture[0],gesture[1])>100 && delta(gesture[2],gesture[1])>75,
        'D16 mortar words must really fly and leave: '+JSON.stringify(gesture));
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
      console.log('V17 NOJS CHECKPOINT: final static headings');
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
    // The text-scale probe belongs after all ScrollTrigger movement and screenshot
    // checks; temporary reflow must not alter later scroll range assertions.
    if([320,390,430].includes(width)){
      // D23 text-enlargement regression. This simulates 200% text sizing;
      // an actual 200% browser zoom and a physical phone still require QA.
      const enlarged=await page.evaluate(async(disableJavaScript)=>{
        const root=document.documentElement;
        const previous=root.style.fontSize;
        root.style.fontSize='200%';
        try {
          // requestAnimationFrame never runs on a scripting-disabled page.
          // A synchronous layout read is enough to measure 200% text sizing.
          if(!disableJavaScript){
            await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          }else{
            void root.offsetHeight;
          }
          const scene=document.querySelector('[data-v17-table-editorial]');
          const copy=scene.querySelector('.v17r-table-copy').getBoundingClientRect();
          const grid=scene.querySelector('.v17r-table-recipes').getBoundingClientRect();
          const cards=[...scene.querySelectorAll('[data-v17-table-recipe]')].map(card=>{
            const parent=card.getBoundingClientRect();
            const text=card.querySelector('.v17r-table-recipe-text');
            const words=text.getBoundingClientRect();
            const anchor=card.querySelector('.v17r-table-recipe-link').getBoundingClientRect();
            return {
              top:parent.top,bottom:parent.bottom,left:parent.left,right:parent.right,
              textTop:words.top,textBottom:words.bottom,
              textLeft:words.left,textRight:words.right,
              anchorTop:anchor.top,anchorBottom:anchor.bottom,
              anchorLeft:anchor.left,anchorRight:anchor.right,
              anchorWidth:anchor.width,anchorHeight:anchor.height,
              overflow:text.scrollHeight-text.clientHeight
            };
          });
          return {copyBottom:copy.bottom,gridTop:grid.top,
            scrollWidth:scene.scrollWidth,clientWidth:scene.clientWidth,cards};
        } finally {root.style.fontSize=previous;}
      },noJs);
      assert.ok(enlarged.cards.length===4 &&
        enlarged.copyBottom<=enlarged.gridTop+2 &&
        enlarged.scrollWidth<=enlarged.clientWidth+2 &&
        enlarged.cards.every(card=>
          card.textTop>=card.top-2 && card.textBottom<=card.bottom+2 &&
          card.textLeft>=card.left-2 && card.textRight<=card.right+2 &&
          card.anchorTop>=card.top-2 && card.anchorBottom<=card.bottom+2 &&
          card.anchorLeft>=card.left-2 && card.anchorRight<=card.right+2 &&
          card.anchorWidth>=44 && card.anchorHeight>=44 &&
          card.overflow<=2),
        'D23 mobile recipe copy and touch targets must remain within fluid panels at enlarged text: '+
        JSON.stringify(enlarged));
    }
    console.log('V17 D2 preview '+width+' × '+height+(noJs?' noJS':'')+(reduced?' reduced':'')+' PASS');
  }finally{
    if(watchdog)clearTimeout(watchdog);
    await page.close();
  }
  // Video comes from an untouched page: full-page screenshots temporarily
  // resize CDP capture surfaces and distort recordings made on that page.
  // D25: requested evidence is ONE focused movie per device.
  // Avoid re-recording six legacy reels on every minor V17 correction:
  // they consume CI minutes and are not needed to validate the feast.
  if(captureVideo)await recordD21TableStory(width,height);
}
async function recordCleanScroll(width,height){
  const page=await browser.newPage({
    viewport:{width,height},
    isMobile:width<=430,
    hasTouch:width<=430,
    reducedMotion:'no-preference',
    recordVideo:{dir:'artifacts',size:width===1440?{width:720,height:450}:{width:390,height:844}}
  });
  const video=page.video();
  try{
    const response=await page.goto(base+'/v17-accueil-preview/',{waitUntil:'networkidle',timeout:30000});
    assert.equal(response?.status(),200);
    const total=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
    const step=height*.20;
    for(let offset=0;offset<=total;offset+=step){
      await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),offset);
      await page.waitForTimeout(120);
    }
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),total);
    await page.waitForTimeout(500);
  }finally{
    await page.close();
    if(video){
      await video.saveAs('artifacts/v17-accueil-'+width+'-scroll.webm');
      console.log('V17 D13 clean scroll video recorded: '+width+'px');
    }
  }
}
/**
 * Human-review evidence: an actual slow, uninterrupted scroll of ONLY the
 * mortar chapter. Browser-generated footage, not a video of real Khmer cooking.
 * This runs independently of full-page screenshot and regression assertions.
 */
async function recordMortarSequence(width,height){
  const page=await browser.newPage({
    viewport:{width,height},
    isMobile:width<=430,
    hasTouch:width<=430,
    reducedMotion:'no-preference',
    recordVideo:{dir:'artifacts',size:width===1440?{width:960,height:600}:{width:390,height:844}}
  });
  const video=page.video();
  try{
    const response=await page.goto(base+'/v17-accueil-preview/',{waitUntil:'networkidle',timeout:30000});
    assert.equal(response?.status(),200);
    const bounds=await page.locator('[data-v17-mortar-scene]').evaluate(el=>{
      const box=el.getBoundingClientRect();
      return {start:scrollY+box.top,height:box.height};
    });
    const max=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
    const from=Math.min(max,Math.max(0,bounds.start-height*.92));
    const to=Math.min(max,Math.max(from,bounds.start+bounds.height-height*.12));
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),from);
    await page.waitForTimeout(450);
    const steps=70;
    for(let i=0;i<=steps;i++){
      const ratio=i/steps;
      // Slow in/out makes the three typographic beats visibly distinct.
      const eased=ratio<.5?2*ratio*ratio:1-((-2*ratio+2)**2)/2;
      await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),from+(to-from)*eased);
      await page.waitForTimeout(110);
    }
    await page.waitForTimeout(500);
  }finally{
    await page.close();
    if(video){
      await video.saveAs('artifacts/v17-accueil-mortier-cinema-'+width+'.webm');
      console.log('V17 D13 dedicated mortar scroll recorded: '+width+'px');
    }
  }
}
/**
 * D14 art-direction evidence: review all six chapter joins slowly with
 * deliberately framed cuts between joins. Native scrolling is unchanged;
 * the test recorder is the only script that sets the scroll position.
 */
async function recordHandoffReel(width,height){
  const page=await browser.newPage({
    viewport:{width,height},
    isMobile:width<=430,hasTouch:width<=430,
    reducedMotion:'no-preference',
    recordVideo:{dir:'artifacts',size:width===1440?{width:960,height:600}:{width:390,height:844}}
  });
  const video=page.video();
  try{
    const response=await page.goto(base+'/v17-accueil-preview/',{waitUntil:'networkidle',timeout:30000});
    assert.equal(response?.status(),200);
    const joins=['market','palette','gestures','table','dessert','finale'];
    for(const chapter of joins){
      const top=await page.locator('.v17r-'+chapter).evaluate(el=>
        scrollY+el.getBoundingClientRect().top);
      const max=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
      const start=Math.max(0,Math.min(max,top-height*.98));
      const end=Math.min(max,Math.max(start,top+height*.30));
      await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),start);
      await page.waitForTimeout(240);
      const frames=23;
      for(let frame=0;frame<=frames;frame++){
        const t=frame/frames;
        const eased=t<.5?2*t*t:1-((-2*t+2)**2)/2;
        await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),start+(end-start)*eased);
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(160);
    }
  }finally{
    await page.close();
    if(video){
      await video.saveAs('artifacts/v17-accueil-d14-transitions-'+width+'.webm');
      console.log('V17 D14 all six boundary clips recorded: '+width+'px');
    }
  }
}
/**
 * D15 proof, not a 2-second jump cut: one full, uninterrupted seven-act
 * scroll. Roughly a minute of actual browser motion, including readable holds
 * at every chapter's centre and footer. Recorded for both 390 and 1440 px.
 */
async function recordContinuousStory(width,height){
  const page=await browser.newPage({
    viewport:{width,height},
    isMobile:width<=430,hasTouch:width<=430,
    reducedMotion:'no-preference',
    recordVideo:{dir:'artifacts',
      size:width===1440?{width:960,height:600}:{width:390,height:844}}
  });
  const video=page.video();
  try{
    const response=await page.goto(base+'/v17-accueil-preview/',{waitUntil:'networkidle',timeout:30000});
    assert.equal(response?.status(),200);
    const timeline=await page.evaluate(()=>{
      const chapters=['hero','market','palette','gestures','table','dessert','finale'];
      const centres=chapters.map(name=>{
        const el=document.querySelector('.v17r-'+name);
        const box=el.getBoundingClientRect();
        return Math.round(scrollY+box.top+box.height*.5-innerHeight*.5);
      });
      return {
        total:document.documentElement.scrollHeight-innerHeight,
        centres
      };
    });
    const step=Math.max(13,Math.round(height*.018));
    await page.waitForTimeout(1200);
    const held=new Set();
    for(let y=0;y<=timeline.total;y+=step){
      await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);
      await page.waitForTimeout(90);
      for(let i=0;i<timeline.centres.length;i++){
        if(!held.has(i) && y>=timeline.centres[i]){
          held.add(i);
          await page.waitForTimeout(850);
        }
      }
    }
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),timeline.total);
    await page.waitForTimeout(900);
  }finally{
    await page.close();
    if(video){
      await video.saveAs('artifacts/v17-accueil-d15-integral-'+width+'.webm');
      console.log('V17 D15 verified uninterrupted seven-chapter scroll: '+width+'px');
    }
  }
}
/**
 * Evidence D16: actual before / middle / exit stills for TWO distinct scenes.
 * Screenshots show the same scene at three scroll offsets and should never
 * be mistaken for proof of smoothness; the full-scroll videos remain evidence.
 */
async function recordTextArrivalEvidence(width,height){
  const page=await browser.newPage({
    viewport:{width,height},isMobile:width<=430,hasTouch:width<=430,
    reducedMotion:'no-preference'
  });
  try{
    const response=await page.goto(base+'/v17-accueil-preview/',
      {waitUntil:'networkidle',timeout:30000});
    assert.equal(response?.status(),200);
    for(const name of ['market','gestures','dessert']){
      const scene=page.locator('.v17r-'+name);
      const bounds=await scene.evaluate((el,options)=>{
        const {mobile,name}=options;
        const heading=name==='gestures'?
          el.querySelector('.v17r-gesture-word'):el.querySelector('h2');
        const matrix=new DOMMatrixReadOnly(getComputedStyle(heading).transform);
        const naturalTop=scrollY+heading.getBoundingClientRect().top-matrix.m42;
        return {start:naturalTop-innerHeight*.96,end:naturalTop-innerHeight*.08};
      },{name,mobile:width<=760});
      for(const [phase,ratio] of [['entry',.055],['read',.46],['exit',.88]]){
        const y=Math.max(0,bounds.start+(bounds.end-bounds.start)*ratio);
        await page.evaluate(v=>scrollTo({top:v,behavior:'instant'}),y);
        await page.waitForTimeout(1150);
        await page.screenshot({
          path:'artifacts/v17-accueil-d16-'+name+'-'+width+'-'+phase+'.png',
          animations:'allow'
        });
      }
    }
  }finally{
    await page.close();
  }
}
/**
 * D17 editorial evidence: an uninterrupted slow scroll over the immersive
 * dessert, plus desktop-only market -> palette -> mortar travelling motif.
 * Do not present these clips as proof of finished seven-act art direction.
 */
async function recordD17CinematicProof(width,height){
  const mobile=width<=760;
  const kinds=mobile?['dessert']:['aromatic','dessert'];
  for(const kind of kinds){
    const page=await browser.newPage({
      viewport:{width,height},isMobile:mobile,hasTouch:mobile,
      reducedMotion:'no-preference',
      recordVideo:{dir:'artifacts',
        size:mobile?{width:390,height:844}:{width:960,height:600}}
    });
    const video=page.video();
    try{
      const response=await page.goto(base+'/v17-accueil-preview/',
        {waitUntil:'networkidle',timeout:30000});
      assert.equal(response?.status(),200);
      const range=await page.evaluate(kind=>{
        const first=document.querySelector(kind==='dessert'?'.v17r-dessert':'.v17r-market');
        const last=document.querySelector(kind==='dessert'?'.v17r-dessert':'[data-v17-mortar-scene]');
        const a=scrollY+first.getBoundingClientRect().top;
        const b=scrollY+last.getBoundingClientRect().bottom;
        const max=document.documentElement.scrollHeight-innerHeight;
        return {start:Math.min(max,Math.max(0,a-innerHeight*.85)),
          end:Math.min(max,Math.max(0,b-innerHeight*.25))};
      },kind);
      await page.evaluate(v=>scrollTo({top:v,behavior:'instant'}),range.start);
      await page.waitForTimeout(850);
      const frames=kind==='dessert'?105:170;
      for(let frame=0;frame<=frames;frame++){
        const ratio=frame/frames;
        const eased=ratio<.5?2*ratio*ratio:1-((-2*ratio+2)**2)/2;
        const y=range.start+(range.end-range.start)*eased;
        await page.evaluate(v=>scrollTo({top:v,behavior:'instant'}),y);
        await page.waitForTimeout(105);
      }
      await page.waitForTimeout(650);
    }finally{
      await page.close();
      if(video){
        await video.saveAs('artifacts/v17-accueil-d17-'+kind+'-'+width+'.webm');
        console.log('V17 D17 authored visual proof: '+kind+' '+width);
      }
    }
  }
}
/**
 * D18: a focused, uncut table assembly (not a 2-second slideshow).
 * It captures four different arrivals, reading pauses, and the final four
 * genuinely interactive recipe anchors. Both desktop and mobile.
 */
async function recordD21TableStory(width,height){
  const mobile=width<=760;
  const page=await browser.newPage({
    viewport:{width,height},isMobile:mobile,hasTouch:mobile,
    reducedMotion:'no-preference',
    recordVideo:{dir:'artifacts',size:mobile?{width:390,height:844}:{width:960,height:600}}
  });
  const video=page.video();
  try{
    const response=await page.goto(base+'/v17-accueil-preview/',{waitUntil:'networkidle',timeout:30000});
    assert.equal(response?.status(),200);
    const range=await page.evaluate(()=>{
      const section=document.querySelector('[data-v17-table-editorial]');
      const a=scrollY+section.getBoundingClientRect().top;
      const b=scrollY+section.getBoundingClientRect().bottom;
      const max=document.documentElement.scrollHeight-innerHeight;
      return {a:Math.max(0,a-innerHeight*.12),b:Math.min(max,b-innerHeight*.87)};
    });
    const captures=[{r:.2,name:'entry'},{r:.5,name:'title'},{r:.8,name:'read'},{r:.95,name:'complete'}];
    const seen=new Set();
    for(let frame=0;frame<=100;frame++){
      const t=frame/100;
      await page.evaluate(v=>scrollTo({top:v,behavior:'instant'}),range.a+(range.b-range.a)*t);
      await page.waitForTimeout(94);
      for(const c of captures){
        if(t>=c.r&&!seen.has(c.name)){
          seen.add(c.name);
          await page.waitForTimeout(350);
          await page.screenshot({path:'artifacts/v17-accueil-d21-table-'+width+'-'+c.name+'.png',animations:'allow'});
        }
      }
    }
    if(mobile){
      // D24 visual evidence must ACTUALLY show four horizontal recipe slides.
      // The continuous vertical scroll alone cannot demonstrate a carousel.
      await page.evaluate(()=>{
        const scroller=document.querySelector('[data-v17-table-carousel]');
        const top=scrollY+scroller.getBoundingClientRect().top-innerHeight*.19;
        scrollTo({top:Math.max(0,top),behavior:'instant'});
      });
      await page.waitForTimeout(700);
      for(let slide=0;slide<4;slide++){
        await page.locator('[data-v17-carousel-dot="'+slide+'"]').click();
        await page.waitForTimeout(950);
        await page.screenshot({
          path:'artifacts/v17-accueil-d24-mobile-carousel-'+width+'-slide-'+(slide+1)+'.png',
          animations:'allow'
        });
      }
    }
    // D25: the single evidence video must show the final edge of the feast
    // and the first part of Desserts, proving there is no blank spacer.
    const seamRange=await page.evaluate(()=>{
      const section=document.querySelector('[data-v17-table-editorial]');
      const bottom=scrollY+section.getBoundingClientRect().bottom;
      const max=document.documentElement.scrollHeight-innerHeight;
      return {
        from:Math.min(max,Math.max(0,bottom-innerHeight*.93)),
        to:Math.min(max,Math.max(0,bottom+innerHeight*.18))
      };
    });
    for(let step=0;step<=36;step++){
      const y=seamRange.from+(seamRange.to-seamRange.from)*step/36;
      await page.evaluate(top=>scrollTo({top,behavior:'instant'}),y);
      await page.waitForTimeout(95);
    }
    await page.waitForTimeout(450);
  }finally{
    await page.close();
    if(video)await video.saveAs('artifacts/v17-accueil-d21-table-'+width+'.webm');
  }
}
/* Generated recipe artwork must also work on the real V16 recipe routes.
 * This is a read-only browser check; the V17 preview remains isolated. */
async function checkGeneratedRecipe(slug,filename,altLabel,width,height){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<=430,hasTouch:width<=430});
  try{
    const response=await page.goto(base+'/recettes/'+slug+'/',{waitUntil:'networkidle',timeout:30000});
    assert.equal(response?.status(),200,'Recipe URL '+slug);
    const cover=page.locator('.recipe-v15-cover img');
    await cover.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{
      const img=document.querySelector('.recipe-v15-cover img');
      return Boolean(img?.complete && img.naturalWidth>=480 && img.naturalHeight>=300);
    },undefined,{timeout:15000});
    const src=await cover.getAttribute('src');
    assert.equal(src,'/images/cuisine/'+filename);
    // Browsers may load a smaller actual WebP from srcset: this is expected
    // responsive behavior, not a missing high-resolution image.
    const selected=await cover.evaluate(img=>({
      currentSrc:new URL(img.currentSrc).pathname,
      naturalWidth:img.naturalWidth,
      naturalHeight:img.naturalHeight,
      srcset:img.getAttribute('srcset') ?? ''
    }));
    const baseName=filename.slice(0,-'-1440.webp'.length);
    const widths=[480,800,1200,1440];
    assert.ok(widths.some(size=>selected.currentSrc==='/images/cuisine/'+baseName+'-'+size+'.webp'),
      'Recipe must load a valid responsive V19 WebP: '+JSON.stringify(selected));
    for(const size of widths)assert.ok(
      selected.srcset.includes(baseName+'-'+size+'.webp '+size+'w'),
      'Missing responsive recipe width '+size+': '+slug);
    assert.match(await cover.getAttribute('alt'),new RegExp(altLabel), 'The alternative text describes the food rather than image provenance');
    const recipeHero=page.locator('.recipe-v16[data-generated-artwork="true"] .recipe-v15-hero');
    assert.equal(await recipeHero.count(),1,'Generated recipe must have a scoped style variant');
    const composition=await recipeHero.evaluate(el=>{
      const media=el.querySelector('.recipe-v15-cover')?.getBoundingClientRect();
      const copy=el.querySelector('.recipe-v15-hero-copy')?.getBoundingClientRect();
      return {
        background:getComputedStyle(el).backgroundImage,
        copy:copy?.toJSON(),media:media?.toJSON()
      };
    });
    if(width>=901){
      assert.match(composition.background,/linear-gradient\(90deg/i,
        'Desktop recipe must keep a straight, readable text background');
      assert.ok(composition.copy&&composition.media&&
        composition.media.left>=composition.copy.right+4,
        'Desktop recipe photograph must not enter the reading column: '+JSON.stringify(composition));
    }else{
      assert.equal(composition.background,'none','Mobile recipe keeps one cream background');
      assert.ok(composition.media.top>=composition.copy.bottom-6,
        'Mobile recipe photograph must flow below its text: '+JSON.stringify(composition));
    }
    const dimension=await page.evaluate(()=>({
      html:document.documentElement.scrollWidth,
      client:document.documentElement.clientWidth
    }));
    assert.ok(dimension.html-dimension.client<=2,'Recipe horizontal overflow: '+slug+' '+width+'px '+JSON.stringify(dimension));
    if(detailedEvidence)await fs.mkdir('artifacts',{recursive:true});
    // At the top of the real page, the sticky header must not artificially
    // obscure the heading in the screenshot. Full page for mobile is also
    // useful to spot defects below the fold in guided recipe steps.
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(220);
    if(detailedEvidence){
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
  if(onlyNoJs){
    // Previously captured: all 9 widths and reduced motion PASS on the
    // immediate parent. This run isolates the no-JS gate that hung in CI.
    await run(390,844,{noJs:true});
  }else{
    for(const [w,h] of [[390,844],[430,932],[360,800],[320,640],[768,1024],[1024,768],[640,720],[1440,900],[1920,1080]]){
      await run(w,h,{screenshot:detailedEvidence});
    }
    await run(390,844,{reduced:true});
    await run(390,844,{noJs:true});
    for(const [slug,file,alt] of [
      ['amok-trey','v19-amok-trey-1440.webp','Amok Trey'],
      ['lok-lak','v19-lok-lak-1440.webp','Lok Lak'],
      ['num-banh-chok','v19-num-banh-chok-1440.webp','Num Banh Chok'],
      ['bai-sach-chrouk','v19-bai-sach-chrouk-1440.webp','Bai Sach Chrouk']
    ]){
      await checkGeneratedRecipe(slug,file,alt,1440,900);
      await checkGeneratedRecipe(slug,file,alt,390,844);
    }
  }
  assert.deepEqual(errors,[],'No browser JS errors');
  console.log('V17 D2 browser gate: PASS');
}catch(e){console.error('V17 D2 browser gate FAIL:',e?.stack||e);process.exitCode=1}
finally{if(browser)await browser.close();if(server.pid&&process.platform!=='win32'){
  try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')}}else server.kill('SIGTERM');}
