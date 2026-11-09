import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync,spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {chromium} from 'playwright-core';

const php=process.env.PHP_BIN||'php';
async function fixture(t){
  const root=await mkdtemp(join(tmpdir(),'cdc-studio-browser-tts-real-preparation-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const bridge=mode=>JSON.parse(execFileSync(php,['-d','display_errors=stderr',
    'tests/php/fixtures/editorial-tts-bridge.php',mode,root,resolve('dist')],
    {encoding:'utf8',windowsHide:true}));
  const record=bridge('init');
  return {root,bridge,...record};
}

test('real voice rights stay separate from simulation, source visas and spending authority',async t=>{
  const f=await fixture(t);
  const source=join(f.root,'.cuisine-asset-portal','editorial-drafts','new-content',f.id+'.0003.json');
  const before=await readFile(source);
  let state=f.bridge('voice-readiness');
  assert.equal(state.final_review_current,true);
  assert.equal(state.rights_current,false);
  const visaPath=join(f.root,'.cuisine-asset-portal','editorial-drafts','new-content',
    'final-review-'+f.id+'.0001.json');
  const visa=JSON.parse(await readFile(visaPath,'utf8'));
  const timestamp=ms=>new Date(ms).toISOString().replace(/\.\d{3}Z$/,'Z');
  const signed=Date.now()-3*3600_000;
  visa.reviewed_at=timestamp(signed);
  for(const {evidence} of visa.sources)evidence.retrieved_at=timestamp(signed-120*60_000);
  await writeFile(visaPath,JSON.stringify(visa));
  assert.equal(f.bridge('voice-readiness').final_review_current,false,
    'evidence already expired at approval cannot validate a visa');
  for(const {evidence} of visa.sources)evidence.retrieved_at=timestamp(signed-4*60_000);
  await writeFile(visaPath,JSON.stringify(visa));
  assert.equal(f.bridge('voice-readiness').final_review_current,true,
    'evidence that was fresh at approval does not expire a signed visa after an hour');
  f.bridge('rights');
  assert.equal(f.bridge('voice-readiness').rights_current,false,'test-tone approval never grants Coral rights');
  f.bridge('voice-rights');state=f.bridge('voice-readiness');
  assert.equal(state.rights_current,true);
  assert.equal(state.generation_available,false);
  assert.equal(state.approved_budget_microusd,null);
  assert.equal(state.paid_calls,0);
  assert.equal(state.completed_mp3,0);
  assert.ok(state.blocking.includes('EXPLICIT_SPENDING_APPROVAL_REQUIRED'));
  assert.throws(()=>f.bridge('voice-rights'),/TTS_DECISION_ALREADY_SET/);
  assert.deepEqual(await readFile(source),before,'rights journal cannot rewrite narrations');
  f.bridge('revoke-voice-rights');
  assert.equal(f.bridge('voice-readiness').rights_current,false);
  assert.equal(f.bridge('request').provider,'simulated-tone-v1','legacy request remains strictly simulated');
  f.bridge('revoke-final');
  assert.throws(()=>f.bridge('voice-rights'),/TTS_FINAL_REVIEW_REQUIRED/);
  assert.equal(f.bridge('voice-readiness').final_review_current,false);
});

test('mobile preparation works with no provider; explicit rights survive reconnect without spending',async t=>{
  const f=await fixture(t);
  const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));
  const port=socket.address().port;await new Promise(r=>socket.close(r));
  const origin='http://127.0.0.1:'+port,base=origin+'/gestion-contenus/';
  const url=base+'?new=1&cid='+f.id;
  const server=spawn(php,['-S','127.0.0.1:'+port,join(f.root,'router.php')],
    {stdio:['ignore','ignore','pipe'],windowsHide:true});
  let errors='';server.stderr.on('data',b=>errors+=b);t.after(()=>server.kill());
  for(let i=0;i<80;i++){
    try{if((await fetch(base)).ok)break;}catch{}
    if(i===79)throw Error('FIXTURE_SERVER '+errors.slice(-200));
    await new Promise(r=>setTimeout(r,100));
  }
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true});
  t.after(()=>browser.close());
  for(const width of [390,1440]){
    const ctx=await browser.newContext({viewport:{width,height:950},isMobile:width===390,hasTouch:width===390});
    t.after(()=>ctx.close());
    let externalRequests=0;
    await ctx.route('**/*',route=>{
      if(new URL(route.request().url()).origin===origin)return route.continue();
      externalRequests++;return route.abort();
    });
    const page=await ctx.newPage();
    await page.goto(url);
    assert.equal(await page.locator('[data-coral-real-tts-preparation]').count(),0,'private state requires login');
    async function login(){
      await page.locator('[name=username]').fill('fixture-admin');
      await page.locator('[name=password]').fill('synthetic-login-only');
      await Promise.all([page.waitForNavigation(),page.locator('button[name=login]').click()]);
      await page.goto(url);
    }
    await login();
    const panel=page.locator('[data-coral-real-tts-preparation]');
    await assert.match(await panel.innerText(),/voix réelle indisponible/);
    assert.equal(await panel.locator('button[disabled]').count(),1);
    assert.equal(await panel.locator('audio').count(),0);
    assert.equal(await panel.locator('button[value=generate]').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
    for(const name of ['voice','content','private_audio'])await panel.locator('[name="tts_checks['+name+']"]').check();
    await panel.locator('[name=tts_note]').fill('Décision synthétique de droits pour le test local, sans dépense réelle.');
    await panel.locator('[name=tts_confirm]').check();
    const payload=await panel.locator('form').evaluate(e=>({...Object.fromEntries(new FormData(e)),tts_action:'approve_voice_rights'}));
    let response=await ctx.request.post(url,{form:{...payload,csrf:'invalid'},maxRedirects:0});
    assert.equal(response.status(),403);
    response=await ctx.request.post(url,{form:{...payload,expected_version:'2'},maxRedirects:0});
    assert.equal(response.status(),409);
    await Promise.all([page.waitForNavigation(),panel.locator('button[value=approve_voice_rights]').click()]);
    assert.equal(new URL(page.url()).hash,'#cms-real-tts');
    assert.equal(await panel.locator('button[value=revoke_voice_rights]').count(),1);
    response=await ctx.request.post(url,{form:payload,maxRedirects:0});
    assert.equal(response.status(),409,'double-submit cannot add a duplicate approval');
    await ctx.clearCookies();await page.goto(url);await login();
    assert.equal(await panel.locator('button[value=revoke_voice_rights]').count(),1,'rights persist outside session');
    const csrf=await panel.locator('[name=csrf]').inputValue();
    response=await ctx.request.post(url,{form:{csrf,creation_id:f.id,expected_version:'3',tts_action:'generate',tts_confirm:'1'},maxRedirects:0});
    assert.equal(response.status(),409,'rights cannot enable any provider');
    if(process.env.REAL_TTS_EVIDENCE_DIR){
      await mkdir(process.env.REAL_TTS_EVIDENCE_DIR,{recursive:true});
      await panel.screenshot({path:join(process.env.REAL_TTS_EVIDENCE_DIR,'preparation-'+width+'.png')});
    }
    await panel.locator('[name=tts_note]').fill('Révocation synthétique après le contrôle mobile, sans dépense réelle.');
    await panel.locator('[name=tts_confirm]').check();
    await Promise.all([page.waitForNavigation(),panel.locator('button[value=revoke_voice_rights]').click()]);
    assert.equal(f.bridge('voice-readiness').rights_current,false);
    assert.equal(externalRequests,0);
    await ctx.close();
  }
});
