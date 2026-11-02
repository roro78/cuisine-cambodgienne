import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createServer} from 'node:net';
import {chromium} from 'playwright-core';
const php=process.env.PHP_BIN||'php',dist=process.env.STUDIO_DIST||path.resolve('dist');
const root=await mkdtemp(path.join(tmpdir(),'cdc-studio-browser-'));
const evidence=process.env.STUDIO_EVIDENCE_DIR||'artifacts/ai-async-browser';
let browser,server,logs='';
try{
  execFileSync(php,['tests/php/fixtures/editorial-studio-server.php',root,dist,'async'],{encoding:'utf8'});
  const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
  const origin=`http://127.0.0.1:${port}`;server=spawn(php,['-S',`127.0.0.1:${port}`,path.join(root,'router.php')]);server.stderr.on('data',b=>logs+=b);
  for(let i=0;i<60;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await page.goto(origin+'/gestion-contenus/');await page.locator('[name=username]').fill('fixture-admin');
  await page.locator('[name=password]').fill('synthetic-login-only');await page.locator('button[name=login]').click();
  await page.goto(origin+'/gestion-contenus/?new=1&kind=recette');const form=page.locator('#cms-new-editor');
  await form.locator('[name=title]').fill('Projet navigateur asynchrone distinct');await form.locator('[name=angle]').fill('Angle de test à vérifier');
  await form.locator('details').filter({has:page.locator('button[name=ai_content_generate]')}).locator('summary').first().click();
  await form.locator('[name=objective]').fill('Objectif synthétique');await form.locator('[name=context]').fill('Contexte public synthétique seulement');
  await form.locator('[name=semantic_review]').check();await form.locator('[name=transmission_review]').check();
  await form.locator('button[name=ai_content_generate]').click();await page.waitForURL(/ai_job=/);
  await page.waitForSelector('[data-ai-job-status="running"]');await mkdir(evidence,{recursive:true});
  for(const width of [360,390,1440]){
    await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'progress overflow '+width);
    await page.screenshot({path:path.join(evidence,`progress-${width}.png`),fullPage:true});
  }
  await page.locator('[data-ai-job-status] a').click();await page.waitForURL(/candidate=/);
  assert.equal(await readFile(path.join(root,'calls.txt'),'utf8'),'1');await page.reload();assert.equal(await readFile(path.join(root,'calls.txt'),'utf8'),'1');
  await form.locator('[name="fields[intro]"]').fill('Correction humaine de la proposition asynchrone.');
  await form.locator('button[name=create_save]').click();await page.waitForURL(/saved_new=1/);
  assert.equal(await form.locator('[name="fields[intro]"]').inputValue(),'Correction humaine de la proposition asynchrone.');
  for(const width of [360,390,1440]){
    await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:path.join(evidence,`saved-${width}.png`),fullPage:true});
  }
  console.log('CMS_AI_ASYNC_BROWSER_PASS progress, refresh, human edit, explicit save, 360/390/1440; realProviderCalls=0');
}catch(e){console.error(logs.slice(-3000));throw e;}
finally{await browser?.close();server?.kill();await rm(root,{recursive:true,force:true});}
