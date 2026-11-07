/** Local/CI reception with synthetic data and loopback queue only. NOT production proof. */
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import path from 'node:path';import {spawn,execFileSync} from 'node:child_process';
import {createServer} from 'node:net';import {createHash} from 'node:crypto';import {chromium} from 'playwright-core';
import {createJobGateway} from '../scripts/editorial-ai-job-gateway.mjs';
const php=process.env.PHP_BIN||'php',root=await mkdtemp(path.join(tmpdir(),'cdc-studio-browser-complete-'));
const evidence=process.env.COMPLETE_WORKSHOP_EVIDENCE||'artifacts/coral-complete-browser';
const hash=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
let browser,server,gateway,logs='',calls=0,puts=0;
try{
 gateway=await createJobGateway({root:path.join(root,'queue'),token:'synthetic-local-job-token-'.repeat(2),
  provider:async()=>{calls++;return readFile(path.join(root,'candidate.json'),'utf8');}});
 gateway.server.on('request',req=>{if(req.method==='PUT')puts++;});
 await new Promise(r=>gateway.server.listen(0,'127.0.0.1',r));
 const fixture=JSON.parse(execFileSync(php,['tests/php/fixtures/editorial-studio-server.php',root,path.resolve('dist'),'complete',String(gateway.server.address().port)],{encoding:'utf8',maxBuffer:300000}));
 const legacyBefore=await hash(fixture.legacy),cid=fixture.workshop_creation_id;
 assert.match(cid,/^c-[a-f0-9]{24}$/);
 const drafts=path.join(root,'.cuisine-asset-portal','editorial-drafts','new-content');
 const first=path.join(drafts,cid+'.0001.json'),firstHash=await hash(first);
 const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
 const origin='http://127.0.0.1:'+port;
 server=spawn(php,['-S','127.0.0.1:'+port,path.join(root,'router.php')]);server.stderr.on('data',b=>{logs+=b;});
 for(let i=0;i<80;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 await page.goto(origin+'/gestion-contenus/?calendar=1');
 const anonymousCsrf=await page.locator('input[name=csrf]').first().inputValue();
 await page.request.post(origin+'/gestion-contenus/?calendar=1',{form:{csrf:anonymousCsrf,prepare_next_workshop:'1'}});
 assert.equal(puts,0);assert.equal(calls,0);
 await page.locator('[name=username]').fill('fixture-admin');await page.locator('[name=password]').fill('synthetic-login-only');
 await page.locator('button[name=login]').click();await page.goto(origin+'/gestion-contenus/?calendar=1');
 assert.equal(await page.locator('nav.ux-home a.ux-tile').count(),4);
 const invalid=await page.request.post(origin+'/gestion-contenus/?calendar=1',{form:{csrf:'invalid',prepare_next_workshop:'1'}});
 assert.equal(invalid.status(),403);assert.equal(puts,0);
 await page.locator('button[name=prepare_next_workshop]').click();await page.waitForURL(/coral_job=/);const jobUrl=page.url();
 await page.reload();assert.equal(puts,1);assert.equal(calls,0);
 await page.goto(origin+'/gestion-contenus/?calendar=1');await page.locator('button[name=prepare_next_workshop]').click();await page.waitForURL(/coral_job=/);
 assert.equal(puts,1);assert.equal(calls,0);
 await gateway.workOnce();assert.equal(calls,1);
 assert.equal((await gateway.state(new URL(jobUrl).searchParams.get('coral_job'))).status,'succeeded');
 await page.reload();await page.waitForURL(/candidate=/);
 const editor=page.locator('#cms-new-editor');
 assert.equal(await editor.locator('textarea[name*="atelier_scripts"][name$="[text]"]').count(),7);
 assert.equal(await editor.locator('[name="atelier_reference[recipeSlug]"]').inputValue(),'amok-trey');
 assert.equal(await hash(first),firstHash);assert.equal((await readdir(drafts)).filter(n=>n.startsWith(cid+'.')).length,1);
 await editor.locator('button[name=create_save]').first().click();await page.waitForURL(/saved_new=1/);
 const v2=JSON.parse(await readFile(path.join(drafts,cid+'.0002.json'),'utf8'));
 assert.equal(v2.id,cid);assert.equal(v2.version,2);assert.equal(v2.origin,'ai');assert.equal(v2.reviewed,false);
 assert.equal(v2.ai_content.scope,'workshop-complete-draft-v1');assert.equal(v2.atelier_scripts.chapters.length,7);
 assert.equal(v2.atelier_phase_details.phases.length,6);assert.equal(v2.target_date,null);
 assert.equal(await hash(first),firstHash);assert.equal(await hash(fixture.legacy),legacyBefore);
 await page.goto(origin+'/gestion-contenus/?calendar=1');assert.equal(await page.locator('button[name=prepare_next_workshop]').count(),0);
 assert.equal(calls,1);assert.equal(puts,1);
 await page.goto(origin+'/gestion-contenus/?new=1&cid='+cid);await mkdir(evidence,{recursive:true});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:path.join(evidence,'workshop-390.png'),fullPage:true});
 await page.setViewportSize({width:1400,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:path.join(evidence,'workshop-1400.png'),fullPage:true});
 await writeFile(path.join(evidence,'receipt.json'),JSON.stringify({status:'SYNTHETIC_BROWSER_PASS',
  samePrivateIdentity:true,versions:2,sixPhases:true,sevenTexts:true,providerJobs:1,queueSubmissions:1,
  anonymousDenied:true,csrfDenied:true,historicalDraftUnchanged:true,humanApproval:false,
  actualProviderCalls:0,audioGenerated:false,production:false},null,2));
 console.log('COMPLETE_WORKSHOP_BROWSER_PASS calendar → one queue job → common editable 6 phases/7 texts → explicit private v2; no real provider, approval, audio or publication');
}catch(e){console.error(logs.slice(-2500));throw e;}
finally{await browser?.close();if(server&&server.exitCode===null){const stopped=new Promise(r=>server.once('exit',r));server.kill();await stopped;}gateway?.stopWorker();if(gateway)await new Promise(r=>gateway.server.close(r));await rm(root,{recursive:true,force:true});}
