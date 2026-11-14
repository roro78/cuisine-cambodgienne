import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createServer} from 'node:net';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createJobGateway} from '../scripts/editorial-ai-job-gateway.mjs';

const php=process.env.PHP_BIN||'php';
const root=await mkdtemp(path.join(tmpdir(),'cdc-studio-browser-'));
const evidence=process.env.STUDIO_EVIDENCE_DIR||'artifacts/studio-integrated-browser';
const hash=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
let browser,server,gateway,logs='',release,work;
let calls=0;const gate=new Promise(resolve=>{release=resolve;});
try{
  gateway=await createJobGateway({root:path.join(root,'queue'),token:'synthetic-local-job-token-'.repeat(2),provider:async request=>{
    calls++;if(request.brief.context==='FIXTURE_FAIL')throw Error('SYNTHETIC_FAILURE');
    await gate;return readFile(path.join(root,'candidate.json'),'utf8');
  }});
  await new Promise(r=>gateway.server.listen(0,'127.0.0.1',r));
  const fixture=JSON.parse(execFileSync(php,['tests/php/fixtures/editorial-studio-server.php',root,path.resolve('dist'),'combined',String(gateway.server.address().port)],{encoding:'utf8'}));
  const legacyHash=await hash(fixture.legacy);
  const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
  const origin=`http://127.0.0.1:${port}`;
  server=spawn(php,['-S',`127.0.0.1:${port}`,path.join(root,'router.php')]);server.stderr.on('data',b=>{logs+=b;});
  for(let i=0;i<80;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await page.goto(origin+'/gestion-contenus/');await page.locator('[name=username]').fill('fixture-admin');
  await page.locator('[name=password]').fill('synthetic-login-only');await page.locator('button[name=login]').click();
  await page.goto(origin+'/gestion-contenus/?new=1&kind=recette');const editor=page.locator('#cms-new-editor');
  await editor.locator('[name=title]').fill('Projet privé intégration texte et visuel');await editor.locator('[name=angle]').fill('Fixture commune de non-régression');
  await editor.locator('button[name=create_save]').click();await page.waitForURL(/saved_new=1/);
  const cid=new URL(page.url()).searchParams.get('cid');assert.ok(cid);
  const privateDir=path.join(root,'.cuisine-asset-portal'),drafts=path.join(privateDir,'editorial-drafts');
  const firstDraft=path.join(drafts,'new-content',cid+'.0001.json');const firstHash=await hash(firstDraft);
  const base=origin+'/gestion-contenus/?new=1&cid='+cid;
  const media=page.locator('#cms-media');
  async function generateImage(){
    await media.locator('[name=visual_description]').fill('Illustration pédagogique synthétique de test privé uniquement.');
    await media.locator('form:has(button[value=generate]) [name=visual_rights]').fill('Fixture locale sans droit de publication.');
    await media.locator('[name=visual_transmit_confirm]').check();await media.locator('button[value=generate]').click();
  }
  async function approveAndSelect(){
    const approval=media.locator('form:has(button[value=approve])');await approval.locator('[name=visual_rights]').fill('Revue humaine synthétique, version réservée au test.');
    await approval.locator('[name=visual_review_confirm]').check();await approval.locator('button[value=approve]').click();
    await media.locator('button[value=select]').click();await page.waitForFunction(()=>document.querySelector('#cms-media')?.textContent?.includes('Visuel sélectionné'));
  }
  await generateImage();await page.waitForURL(/visual_saved=1/);await approveAndSelect();
  const visualDir=path.join(privateDir,'editorial-visuals',cid);const oldMeta=await hash(path.join(visualDir,'v-0001','meta.json'));
  assert.equal(await readFile(path.join(root,'visual-calls.txt'),'utf8'),'1');
  // Move the synthetic fixture clock past the cooldown, preserving its one consumed attempt.
  await writeFile(path.join(drafts,'ai-brief-attempts.json'),JSON.stringify([Math.floor(Date.now()/1000)-61]));
  await editor.locator('details').filter({has:page.locator('button[name=ai_content_generate]')}).locator('summary').first().click();
  await editor.locator('[name=objective]').fill('Tester le même formulaire');await editor.locator('[name=context]').fill('Contexte synthétique autorisé');
  await editor.locator('[name=semantic_review]').check();await editor.locator('[name=transmission_review]').check();
  await editor.locator('button[name=ai_content_generate]').click();await page.waitForURL(/ai_job=/);const jobUrl=page.url();
  assert.equal((await readdir(path.join(root,'queue'))).filter(n=>/^[a-f0-9]{48}$/.test(n)).length,1);
  assert.equal(calls,0,'submission alone only queues');
  work=gateway.workOnce();for(let i=0;i<100&&calls===0;i++)await new Promise(r=>setTimeout(r,20));assert.equal(calls,1);
  await page.reload();await page.waitForSelector('[data-ai-job-status="running"]');
  const intent=await editor.locator('[name=ai_content_request_token]').inputValue();
  await context.request.get(base+'&visual_file=site800&visual_version=1');
  const tokens=[];for(const name of await readdir(path.join(root,'.cuisine-asset-portal','cms-editorial-session-files'))){
    const raw=await readFile(path.join(root,'.cuisine-asset-portal','cms-editorial-session-files',name),'utf8');const found=raw.match(/ai_content_intent\|s:48:"([a-f0-9]+)"/);if(found)tokens.push(found[1]);
  }
  assert.ok(tokens.includes(intent),'private image GET preserves text intent');assert.equal(calls,1);
  const csrf=await editor.locator('[name=csrf]').inputValue();
  const invalid=await context.request.post(base,{form:{csrf:'wrong',visual_action:'generate',creation_id:cid,expected_version:'1'}});assert.equal(invalid.status(),403);
  const mixed=await context.request.post(base,{form:{csrf,visual_action:'generate',ai_content_generate:'1'}});assert.equal(mixed.status(),422);
  await generateImage();await page.waitForFunction(()=>document.body.textContent.includes('Visuel non enregistré'));
  assert.equal(await readFile(path.join(root,'visual-calls.txt'),'utf8'),'1','text and images share the strict quota');assert.equal(calls,1);
  assert.equal(await hash(path.join(visualDir,'v-0001','meta.json')),oldMeta);
  await page.goto(jobUrl);await mkdir(evidence,{recursive:true});
  for(const width of [360,390,1440]){
    await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:path.join(evidence,`combined-progress-${width}.png`)});
  }
  release();await work;await page.locator('[data-ai-job-status] a').click();await page.waitForURL(/candidate=/);
  await page.reload();assert.equal(calls,1,'refresh never creates a second server call');
  await editor.locator('[name="fields[intro]"]').fill('Correction humaine intégrée conservée en version privée.');
  await editor.locator('button[name=create_save]').click();await page.waitForURL(/saved_new=1/);
  const v2=JSON.parse(await readFile(path.join(drafts,'new-content',cid+'.0002.json'),'utf8'));
  assert.equal(v2.origin,'ai');assert.equal(v2.fields.intro,'Correction humaine intégrée conservée en version privée.');
  assert.equal(await media.locator('button[value=select],button[value=approve]').count(),0,'draft edit invalidates previous selection and approval');
  assert.equal(await hash(firstDraft),firstHash);assert.equal(await hash(fixture.legacy),legacyHash);
  // Advance beyond the rolling-day quota only inside this synthetic fixture.
  await writeFile(path.join(drafts,'ai-brief-attempts.json'),JSON.stringify([Math.floor(Date.now()/1000)-86401]));
  await generateImage();await page.waitForURL(/visual_saved=1/);await approveAndSelect();
  assert.equal(await readFile(path.join(root,'visual-calls.txt'),'utf8'),'2');assert.equal(await hash(path.join(visualDir,'v-0001','meta.json')),oldMeta);
  const budget=JSON.parse(await readFile(path.join(drafts,'visual-budget.json'),'utf8'));assert.equal(budget.reduce((s,r)=>s+r.reserved_usd_cents,0),100);
  for(const width of [360,390,1440]){
    await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:path.join(evidence,`combined-saved-${width}.png`)});
  }
  console.log('CMS_STUDIO_INTEGRATION_PASS real local job HTTP/worker, independent intents, shared quota, CSRF, image replacement/selection, AI edit invalidation, immutable history, 360/390/1440; realProviderCalls=0');
}catch(e){console.error(logs.slice(-3000));throw e;}
finally{release?.();await work?.catch(()=>{});await browser?.close();server?.kill();if(gateway)await new Promise(r=>gateway.server.close(r));await rm(root,{recursive:true,force:true});}
