import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn, execFileSync} from 'node:child_process';
import {createServer} from 'node:net';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';

const php=process.env.PHP_BIN||'php';
const evidence=process.env.STUDIO_EVIDENCE_DIR||'artifacts/cms-unified-review';
const visualTests=process.env.STUDIO_TEST_VISUALS==='1';
const root=await mkdtemp(path.join(tmpdir(),'cdc-studio-browser-'));
let server,browser,logs='';
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
try{
  const fixture=JSON.parse(execFileSync(php,['tests/php/fixtures/editorial-studio-server.php',root,path.resolve('dist'),visualTests?'visuals':''],{encoding:'utf8'}));
  const original=await hash(fixture.legacy);
  const socket=createServer();await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));
  const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
  const origin=`http://127.0.0.1:${port}`;
  server=spawn(php,['-S',`127.0.0.1:${port}`,path.join(root,'router.php')],{stdio:['ignore','pipe','pipe']});
  for(const stream of [server.stdout,server.stderr])stream.on('data',b=>{logs+=b;});
  for(let i=0;i<80;i++){
    try{if((await fetch(origin)).ok)break;}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const external=[];const errors=[];
  const dist=path.resolve('dist');
  await context.route('**/*',async route=>{
    const uri=new URL(route.request().url());
    if(uri.origin===origin){
      if(uri.pathname.startsWith('/gestion-contenus/'))return route.continue();
      // Real built Astro static pages and assets, never a synthetic lookalike.
      const relative=decodeURIComponent(uri.pathname).replace(/^\//,'');
      const file=path.resolve(dist,relative,uri.pathname.endsWith('/')?'index.html':'');
      if(file.startsWith(dist+path.sep)){
        try{
          const body=await readFile(file);
          const ext=path.extname(file).toLowerCase();
          const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript',
            '.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png'};
          return route.fulfill({status:200,body,contentType:types[ext]||'application/octet-stream'});
        }catch{}
      }
      return route.continue();
    }
    external.push(route.request().url());return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',dialog=>dialog.accept());
  await page.goto(origin+'/gestion-contenus/');
  assert.equal(await page.locator('[data-studio-transition]').count(),0);
  await page.locator('[name=username]').fill('fixture-admin');
  await page.locator('[name=password]').fill('synthetic-login-only');
  await page.locator('button[name=login]').click();
  const noOverflow=async label=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label);
  const sections=async()=>{
    for(const id of ['cms-general','cms-content','cms-preview','cms-quality','cms-history'])
      assert.equal(await page.locator('#'+id).count(),1,id);
  };
  assert.equal(await page.locator('.ux-home .ux-tile').count(),4,'four home entries');
  assert.equal(await page.locator('[aria-label="Filtres de la bibliothèque"]').count(),0,'no library filters on home');
  assert.equal(await page.locator('.cards, .create-card').count(),0,'no content or draft list below dashboard');
  for(const width of [360,390,1440]){
    await page.setViewportSize({width,height:1000});
    await noOverflow('dashboard '+width);
    for(const tile of await page.locator('.ux-tile').all()){
      const box=await tile.boundingBox();assert.ok(box.width>200&&box.height>=80,'readable navigation');
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('.ux-home a[href="?publications=1"]').click();
  // The Studio navigates to a new PHP document; wait for its visible section,
  // rather than inspecting the outgoing page during the navigation.
  await page.locator('#cms-publications-status').waitFor({state:'visible'});
  assert.equal(await page.locator('#cms-publications-status').count(),1,'unavailable social route remains inside private Studio');
  assert.equal(await page.locator('.cards, .create-card').count(),0);
  await page.locator('.ux-home a[href="?library=1"]').click();
  await page.locator('[aria-label="Filtres de la bibliothèque"]').waitFor({state:'visible'});
  assert.equal(new URL(page.url()).searchParams.get('library'),'1');
  assert.equal(await page.locator('[aria-label="Filtres de la bibliothèque"]').count(),1);
  assert.ok(await page.locator('.create-card').count()>0,'existing private projects available in library');
  await page.locator('[name="kind"]').selectOption('atelier');
  await page.getByRole('button',{name:'Appliquer les filtres'}).click();
  assert.equal(new URL(page.url()).searchParams.get('library'),'1','filter submit retains library route');
  await page.locator('a[data-library-resume]').first().click();
  await page.getByRole('link',{name:'Retour à la bibliothèque (filtres conservés)'}).click();
  assert.equal(new URL(page.url()).searchParams.get('library'),'1','editor return retains library');
  assert.equal(new URL(page.url()).searchParams.get('kind'),'atelier','editor return retains filters');
  for(const id of fixture.categories){
    await page.goto(origin+'/gestion-contenus/?id='+encodeURIComponent(id));
    assert.equal(await page.locator('#cms-fields').count(),1,id);
    await sections();await noOverflow(id);
    assert.equal(await page.locator('#cms-work-resume').count(),1,'resume card for '+id);
    assert.equal(await page.locator('#cms-work-resume [data-work-resume-action], #cms-work-resume [data-studio-transition] button[name=studio_transition]').count(),1,'primary action for '+id);
  }
  // P1 real-template proof: save one editorial sentence, then verify that the
  // sandbox displays the true built Astro recipe with ONLY that text replaced.
  const manifest=JSON.parse(await readFile(path.join(dist,'editorial-guided-fields.json'),'utf8'));
  const recipe=manifest.items.find(item=>item.model==='recipes');
  assert.ok(recipe,'recipe guided source present');
  await page.goto(origin+'/gestion-contenus/?id='+encodeURIComponent(recipe.id));
  const intro=page.locator('textarea[name="guided[intro]"]');
  const updatedIntro=(await intro.inputValue())+' — vérification visuelle privée';
  await intro.fill(updatedIntro);
  await page.locator('button[name=save]').click();
  await page.waitForURL(/saved=1/);
  assert.equal(await page.locator('[data-visual-preview]').count(),1,'saved proposal has real-template preview');
  await page.locator('[data-visual-preview] iframe').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('[data-visual-status]')?.textContent?.includes('Aperçu comparatif'),null,{timeout:15000});
  const recipeFrame=page.frameLocator('[data-visual-preview] iframe');
  assert.equal(await recipeFrame.locator('main .recipe-intro').innerText(),updatedIntro,'draft text in actual Astro layout');
  assert.equal(await recipeFrame.locator('.recipe-v15-hero').count(),1,'real recipe template retained');
  assert.ok(!(await page.locator('#cms-preview').innerText()).includes('publication autorisée'));
  await page.setViewportSize({width:1440,height:1000});
  assert.ok((await page.locator('[data-visual-preview] iframe').boundingBox()).width>=650,
    'public template has a real desktop reading width');
  await noOverflow('visual preview desktop');
  await page.setViewportSize({width:390,height:844});
  await page.goto(origin+'/gestion-contenus/?kind=atelier');
  const link=page.locator(`a[href*="${encodeURIComponent(fixture.id)}"]`).first();
  assert.equal(await link.count(),1,'library workshop entry');await link.click();
  await sections();await noOverflow('published workshop');
  assert.equal(await page.locator('#cms-work-resume [data-studio-transition]').count(),1,'transition visible at top');
  assert.ok(await page.locator('#cms-work-resume').evaluate(el=>el.getBoundingClientRect().top) <
    await page.locator('#cms-quality').evaluate(el=>el.getBoundingClientRect().top),'transition before quality');
  await page.locator('.editor-shortcuts a[href="#cms-quality"]').click();
  assert.equal(await page.locator('[data-coral-prereception]').count(),1);
  assert.equal(await page.locator('[data-coral-prereception] li').count(),9);
  const fields=await page.locator('[data-studio-transition]').evaluate(form=>Object.fromEntries(new FormData(form)));
  const post={...fields,studio_transition:'1',transition_confirm:'1'};
  let response=await context.request.post(origin+'/gestion-contenus/?id='+encodeURIComponent(fixture.id),{form:{...post,csrf:'invalid'}});
  assert.equal(response.status(),403,'real CSRF gate');
  response=await context.request.post(origin+'/gestion-contenus/?id='+encodeURIComponent(fixture.id),{form:{...post,expected_version:'0'}});
  assert.equal(response.status(),409,'stale legacy version');
  await page.locator('[name=transition_confirm]').check();
  await page.locator('button[name=studio_transition]').click();
  await page.waitForURL(/cid=c-/);
  const linkedUrl=page.url();const cid=new URL(linkedUrl).searchParams.get('cid');
  assert.equal(await hash(fixture.legacy),original,'immutable historical bytes');
  assert.equal(await page.locator('#cms-fields').count(),0,'one active editor');
  assert.equal(await page.locator('#cms-new-editor').count(),1);
  assert.match(await page.locator('#cms-work-resume').innerText(),/Modifications en cours/,'linked draft resume banner');
  assert.equal(await page.locator('#cms-work-resume a[data-work-resume-action][href="#cms-new-content"]').count(),1,'linked draft edit CTA');
  assert.equal(await page.locator('[data-atelier-seven-scripts] textarea[name$="[text]"]').count(),7);
  assert.equal(await page.locator('#cms-quality [data-coral-prereception]').count(),1);
  assert.equal(await page.locator('[data-coral-human-visas]').count(),1);
  assert.equal(await page.locator('[data-studio-advanced]').getAttribute('open'),null,'advanced controls collapsed');
  assert.equal(await page.locator('#cms-audio').getAttribute('open'),null,'audio optional and collapsed');
  const phases=page.locator('[data-create-rows="phases"] > details');
  assert.equal(await phases.count(),6,'six real pedagogical steps');
  assert.ok((await phases.first().locator('summary').innerText()).trim().length>8,'descriptive step title');
  await phases.first().locator('summary').click();
  const step=page.locator('[name="fields[phases][0][learning]"]');
  const stepChanged=(await step.inputValue())+' — consigne de test locale';await step.fill(stepChanged);
  const input=page.locator('[name="fields[learningGoal]"]');
  const changed=(await input.inputValue())+' — modification synthétique locale';await input.fill(changed);
  await page.locator('.editor-shortcuts a[href="#cms-quality"]').click();
  await page.locator('.editor-shortcuts a[href="#cms-new-content"]').click();
  assert.equal(await input.inputValue(),changed,'anchor navigation retains input');
  await page.locator('button[name=create_save]').click();
  await page.waitForURL(/saved_new=1/);
  assert.equal(new URL(page.url()).searchParams.get('kind'),'atelier','library filter survives save');
  assert.equal(await input.inputValue(),changed,'saved bound edit');
  const privateDir=path.join(root,'.cuisine-asset-portal','editorial-drafts','new-content');
  const record=JSON.parse(await readFile(path.join(privateDir,cid+'.0002.json'),'utf8'));
  assert.equal(record.source_binding.source_id,fixture.id);
  assert.equal(record.version,2);
  assert.equal(record.fields.phases[0].learning,stepChanged,'step saved without audio');
  assert.ok(!record.atelier_scripts || record.atelier_scripts.chapters.every(c=>!c.text),'no invented narration');
  assert.equal(await hash(fixture.legacy),original);
  if(visualTests){
    const panel=page.locator('#cms-media');
    assert.equal(await panel.count(),1,'shared private media panel');
    await panel.locator('[name=visual_description]').fill('Illustration pédagogique synthétique pour le test du stockage privé.');
    await panel.locator('[name=visual_rights]').fill('Droits synthétiques de test, non publiables.');
    await panel.locator('[name=visual_transmit_confirm]').check();
    await panel.locator('button[value=generate]').click();
    await page.waitForURL(/visual_saved=1/);
    await page.waitForFunction(()=>{
      const images=[...document.querySelectorAll('#cms-media img')];
      return images.length===2&&images.every(img=>img.complete&&img.naturalWidth>0);
    });
    assert.equal(await panel.locator('img').first().evaluate(img=>img.naturalWidth),800);
    assert.equal(await panel.locator('img').last().evaluate(img=>img.naturalWidth),1080);
    const mediaPath=path.join(root,'.cuisine-asset-portal','editorial-visuals',cid,'v-0001');
    const media=JSON.parse(await readFile(path.join(mediaPath,'meta.json'),'utf8'));
    assert.equal(media.provider,'synthetic-provider');assert.equal(media.publication_authorized,false);
    assert.equal(media.draft_version,2,'visual bound to exact saved draft');
    // A private image must not rotate the text-generation intent of another form.
    await context.request.get(linkedUrl);
    const intentSnapshot=async()=>{
      const names=await readdir(path.join(root,'.cuisine-asset-portal','cms-editorial-session-files'));
      const values=await Promise.all(names.map(name=>readFile(path.join(root,'sessions',name),'utf8')));
      return values.filter(raw=>raw.includes('authenticated_at|')).map(raw=>raw.match(/ai_content_intent\|s:48:"([0-9a-f]+)"/)?.[1]).filter(Boolean).sort();
    };
    const intentsBefore=await intentSnapshot();assert.ok(intentsBefore.length>0);
    const privateImage=await context.request.get(origin+'/gestion-contenus/?new=1&cid='+cid+'&visual_file=site800&visual_version=1');
    assert.equal(privateImage.status(),200);
    assert.match(privateImage.headers()['content-type'],/image\/webp/);
    assert.deepEqual(await intentSnapshot(),intentsBefore,'image GET leaves text AI intent intact');
    const approval=page.locator('#cms-media form:has(button[value=approve])');
    await approval.locator('[name=visual_rights]').fill('Revue humaine synthétique, aucun droit de publication.');
    await approval.locator('[name=visual_review_confirm]').check();
    await approval.locator('button[value=approve]').click();
    await page.waitForFunction(()=>document.querySelector('#cms-media')?.textContent?.includes('Validée pour la revue privée'));
    const review=JSON.parse(await readFile(path.join(mediaPath,'approval.json'),'utf8'));
    assert.equal(review.status,'approved_private_only');assert.equal(review.publication_authorized,false);
    await panel.locator('button[value=select]').click();
    await page.waitForFunction(()=>document.querySelector('#cms-media')?.textContent?.includes('Visuel sélectionné pour ce brouillon : version 1'));
    assert.equal((await readdir(path.dirname(mediaPath))).filter(n=>n.startsWith('selection-')).length,1,'private selection persisted');
    await noOverflow('private visual preview');
    await page.screenshot({path:path.join(evidence,'private-visual-preview.png')});
  }
  await page.goto(origin+'/gestion-contenus/?kind=atelier&status=draft');
  const card=page.locator('.card').filter({has:page.locator(`a[data-library-resume][href*="cid=${cid}"]`)});
  assert.equal(await card.count(),1,'library has one direct link to existing linked draft');
  assert.match(await card.innerText(),/v2/,'library displays current bound version');
  await card.locator('[data-library-resume]').click();
  assert.equal(new URL(page.url()).searchParams.get('cid'),cid,'library direct CTA reopens same draft');
  await page.goto(origin+'/gestion-contenus/?id='+encodeURIComponent(fixture.id));
  assert.equal(new URL(page.url()).searchParams.get('cid'),cid,'published entry reopens bound draft');
  await page.locator('a[href*="history=1"]').first().click();
  assert.equal(await page.locator('#cms-fields').count(),0,'historical editor is read-only');
  assert.ok((await page.locator('#cms-preview').innerText()).includes('PRIVATE_HISTORY_ONLY'));
  await page.goto(linkedUrl);
  await page.locator('.editor-shortcuts a[href="#cms-audio"]').click();
  assert.equal(await page.locator('#cms-audio').evaluate(el=>el.open),true);
  assert.equal(await page.locator('#cms-audio > details').count(),7,'seven chapters available');
  assert.match(await page.locator('#cms-audio > details').first().innerText(),/À rédiger/);
  await page.locator('[data-studio-advanced] > summary').click();
  await page.locator('[data-coral-human-visas] > summary').click();
  assert.equal(await page.locator('button[name=review_action]').count(),0,'no premature human visas');
  await page.locator('.editor-shortcuts a[href="#cms-quality"]').click();
  await noOverflow('linked workshop 390');
  await mkdir(evidence,{recursive:true});
  await page.screenshot({path:path.join(evidence,'mobile-390.png')});
  await page.setViewportSize({width:360,height:800});await noOverflow('linked workshop 360');
  await page.setViewportSize({width:768,height:1024});await noOverflow('tablet');
  await page.setViewportSize({width:1440,height:1000});await noOverflow('desktop');
  await page.screenshot({path:path.join(evidence,'desktop.png')});
  await page.goto(origin+'/gestion-contenus/?calendar=1&month=2026-11');
  assert.equal(await page.locator('#editorial-calendar').count(),1);
  assert.deepEqual(await page.locator('.calendar-weekdays > span').allTextContents(),
    ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],'calendar has Monday-first weekday headings');
  assert.equal(await page.locator('.calendar-month-cell').count(),42,'November 2026 fills six real weeks');
  assert.equal(await page.locator('.calendar-month-cell').first().getAttribute('data-calendar-date'),'2026-10-26');
  assert.equal(await page.locator('.calendar-month-cell').last().getAttribute('data-calendar-date'),'2026-12-06');
  for(const width of [360,390,1440]){
    await page.setViewportSize({width,height:900});
    await noOverflow('monthly calendar '+width);
  }
  await page.goto(origin+'/gestion-contenus/?calendar=1&month=2028-02');
  assert.equal(await page.locator('.calendar-month-cell').count(),35,'February 2028 includes leap day');
  assert.equal(await page.locator('[data-calendar-date="2028-02-29"]').count(),1,'leap day is visible');
  await page.goto(origin+'/gestion-contenus/?calendar=1&month=2026-11');
  assert.equal(await page.locator(`a[href*="cid=${cid}"]`).count(),1,'calendar retains linked project');
  await page.locator(`a[href*="cid=${cid}"]`).click();
  assert.equal(new URL(page.url()).searchParams.get('cid'),cid);
  response=await context.request.post(origin+'/gestion-contenus/?id='+encodeURIComponent(fixture.id),{form:post,maxRedirects:0});
  assert.equal(response.status(),409,'replay does not create another linked draft');
  const firstVersions=(await readdir(privateDir)).filter(n=>n.endsWith('.0001.json')&&n.startsWith('c-'));
  assert.equal(firstVersions.length,2,'only calendar fixture and one linked draft');
  for(const kind of ['recette','atelier','culture','ingredient','technique']){
    await page.goto(origin+'/gestion-contenus/?new=1&kind='+kind);
    assert.equal(await page.locator('#cms-new-editor').count(),1,'new '+kind);
    await noOverflow('new '+kind);
  }
  await page.goto(origin+'/gestion-contenus/?new=1&kind=atelier');
  await page.locator('[name=title]').fill('Atelier synthétique pour recette navigateur');
  await page.locator('[name=angle]').fill('Vérification locale du brouillon sans narration');
  const recipeChoice=page.locator('select[name="atelier_reference[recipeSlug]"]');
  assert.ok(await recipeChoice.locator('option').count()>1,'published recipe titles offered');
  await page.locator('button[name=create_save]').click();
  await page.waitForURL(/saved_new=1/);
  assert.match(await page.locator('#cms-preview').innerText(),/Atelier synthétique/);
  assert.equal(await page.locator('#cms-audio').evaluate(el=>el.open),false);
  await page.goto(linkedUrl);
  await page.locator('.editor-shortcuts a[href="#cms-steps"]').click();
  await page.screenshot({path:path.join(evidence,'steps-desktop.png')});
  await page.setViewportSize({width:390,height:844});
  await page.locator('.editor-shortcuts a[href="#cms-steps"]').click();
  await page.screenshot({path:path.join(evidence,'steps-mobile.png')});
  const canonicalPath=path.join(root,'editorial-source-index.json');
  const canonical=JSON.parse(await readFile(canonicalPath,'utf8'));
  canonical.items.find(item=>item.id===fixture.id).fingerprint='f'.repeat(64);
  const {writeFile}=await import('node:fs/promises');await writeFile(canonicalPath,JSON.stringify(canonical));
  await page.goto(linkedUrl);await page.reload();
  assert.equal(await page.locator('button[name=create_save]').isDisabled(),true,'changed full canonical source blocks saving');
  assert.equal(await page.locator('[data-coral-human-visas]').count(),0,'changed source cannot display active visas');
  const staleForm=await page.locator('#cms-new-editor').evaluate(form=>Object.fromEntries(new FormData(form)));
  response=await context.request.post(linkedUrl,{form:{...staleForm,create_save:'1'},maxRedirects:0});
  assert.equal(response.status(),409,'server rejects stale binding');
  response=await context.request.post(linkedUrl,{form:{csrf:staleForm.csrf,creation_id:cid,expected_version:'2',review_action:'approve',review_chapter:'intro',review_confirm:'1'},maxRedirects:0});
  assert.equal(response.status(),409,'server rejects stale source visas');
  assert.ok(external.every(url=>{
    const item=new URL(url);return item.origin==='https://www.cuisine-du-cambodge.com'
      && /^\/(?:images\/|social-assets\/)/.test(item.pathname);
  }),'no provider/audio/publication request: '+JSON.stringify(external));
  assert.deepEqual(errors,[],'browser JavaScript');
  assert.doesNotMatch(logs,/PHP (?:Fatal|Warning|Parse|Deprecated)/);
  console.log('UNIFIED_STUDIO_BROWSER_PASS mobile 360/390, tablet 768, desktop, real login/CSRF, transition, save, history, five categories and calendar');
}catch(error){ console.error(logs); throw error; }finally{
  if(browser)await browser.close();
  if(server){server.kill();await new Promise(r=>server.exitCode!==null?r():server.once('exit',r));}
  await rm(root,{recursive:true,force:true});
}
