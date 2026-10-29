import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn, execFileSync} from 'node:child_process';
import {createServer} from 'node:net';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';

const php=process.env.PHP_BIN||'php';
const root=await mkdtemp(path.join(tmpdir(),'cdc-studio-browser-'));
let server,browser,logs='';
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
try{
  const fixture=JSON.parse(execFileSync(php,['tests/php/fixtures/editorial-studio-server.php',root,path.resolve('dist')],{encoding:'utf8'}));
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
  await context.route('**/*',route=>{
    if(new URL(route.request().url()).origin===origin)return route.continue();
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
  for(const id of fixture.categories){
    await page.goto(origin+'/gestion-contenus/?id='+encodeURIComponent(id));
    assert.equal(await page.locator('#cms-fields').count(),1,id);
    await sections();await noOverflow(id);
  }
  await page.goto(origin+'/gestion-contenus/?kind=atelier');
  const link=page.locator(`a[href*="${encodeURIComponent(fixture.id)}"]`).first();
  assert.equal(await link.count(),1,'library workshop entry');await link.click();
  await sections();await noOverflow('published workshop');
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
  assert.equal(await page.locator('[data-atelier-seven-scripts] textarea[name$="[text]"]').count(),7);
  assert.equal(await page.locator('#cms-quality [data-coral-prereception]').count(),1);
  assert.equal(await page.locator('[data-coral-human-visas]').count(),1);
  const input=page.locator('[name="fields[learningGoal]"]');
  const changed=(await input.inputValue())+' — modification synthétique locale';await input.fill(changed);
  await page.locator('.editor-shortcuts a[href="#cms-quality"]').click();
  await page.locator('.editor-shortcuts a[href="#cms-new-content"]').click();
  assert.equal(await input.inputValue(),changed,'anchor navigation retains input');
  await page.locator('button[name=create_save]').click();
  await page.waitForURL(/saved_new=1/);
  assert.equal(await input.inputValue(),changed,'saved bound edit');
  const privateDir=path.join(root,'.cuisine-asset-portal','editorial-drafts','new-content');
  const record=JSON.parse(await readFile(path.join(privateDir,cid+'.0002.json'),'utf8'));
  assert.equal(record.source_binding.source_id,fixture.id);
  assert.equal(record.version,2);
  assert.equal(await hash(fixture.legacy),original);
  await page.goto(origin+'/gestion-contenus/?id='+encodeURIComponent(fixture.id));
  assert.equal(new URL(page.url()).searchParams.get('cid'),cid,'published entry reopens bound draft');
  await page.locator('a[href*="history=1"]').first().click();
  assert.equal(await page.locator('#cms-fields').count(),0,'historical editor is read-only');
  assert.ok((await page.locator('#cms-preview').innerText()).includes('PRIVATE_HISTORY_ONLY'));
  await page.goto(linkedUrl);
  await page.locator('[data-coral-human-visas] > summary').click();
  assert.equal(await page.locator('button[name=review_action]').count(),0,'no premature human visas');
  await page.locator('.editor-shortcuts a[href="#cms-quality"]').click();
  await noOverflow('linked workshop 390');
  await mkdir('artifacts/cms-unified-review',{recursive:true});
  await page.screenshot({path:'artifacts/cms-unified-review/mobile-390.png'});
  await page.setViewportSize({width:360,height:800});await noOverflow('linked workshop 360');
  await page.setViewportSize({width:1440,height:1000});await noOverflow('desktop');
  await page.screenshot({path:'artifacts/cms-unified-review/desktop.png'});
  await page.goto(origin+'/gestion-contenus/?calendar=1');
  assert.equal(await page.locator('#editorial-calendar').count(),1);
  assert.equal(await page.locator(`a[href*="cid=${cid}"]`).count(),1,'calendar retains linked project');
  await page.locator(`a[href*="cid=${cid}"]`).click();
  assert.equal(new URL(page.url()).searchParams.get('cid'),cid);
  response=await context.request.post(origin+'/gestion-contenus/?id='+encodeURIComponent(fixture.id),{form:post,maxRedirects:0});
  assert.equal(response.status(),409,'replay does not create another linked draft');
  const firstVersions=(await readdir(privateDir)).filter(n=>n.endsWith('.0001.json')&&n.startsWith('c-'));
  assert.equal(firstVersions.length,2,'only calendar fixture and one linked draft');
  const canonicalPath=path.join(root,'editorial-source-index.json');
  const canonical=JSON.parse(await readFile(canonicalPath,'utf8'));
  canonical.items.find(item=>item.id===fixture.id).fingerprint='f'.repeat(64);
  const {writeFile}=await import('node:fs/promises');await writeFile(canonicalPath,JSON.stringify(canonical));
  await page.goto(linkedUrl);
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
  console.log('UNIFIED_STUDIO_BROWSER_PASS mobile 360/390, desktop, real login/CSRF, transition, save, history, five categories and calendar');
}finally{
  if(browser)await browser.close();
  if(server){server.kill();await new Promise(r=>server.exitCode!==null?r():server.once('exit',r));}
  await rm(root,{recursive:true,force:true});
}
