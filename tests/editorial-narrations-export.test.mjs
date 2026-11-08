import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, mkdir, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawn, execFileSync} from 'node:child_process';
import {createServer} from 'node:net';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';

test('seven saved narrations download as plain text; login, CSRF and stale requests never download HTML', async t=>{
  const php=process.env.PHP_BIN||'php';
  const root=await mkdtemp(join(tmpdir(),'cdc-studio-browser-tts-export-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  // Existing synthetic common-Studio fixture; no live account or provider.
  const f=JSON.parse(execFileSync(php,['-d','display_errors=stderr','tests/php/fixtures/editorial-tts-bridge.php',
    'init',root,resolve('dist')],{encoding:'utf8',windowsHide:true}));
  const saved=join(root,'.cuisine-asset-portal','editorial-drafts','new-content',f.id+'.0003.json');
  const before=await readFile(saved),record=JSON.parse(before);
  const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));
  const port=socket.address().port;await new Promise(r=>socket.close(r));
  const origin='http://127.0.0.1:'+port,base=origin+'/gestion-contenus/',url=base+'?new=1&cid='+f.id;
  const server=spawn(php,['-S','127.0.0.1:'+port,join(root,'router.php')],
    {stdio:['ignore','ignore','pipe'],windowsHide:true});
  let errors='';server.stderr.on('data',b=>errors+=b);t.after(()=>server.kill());
  for(let i=0;i<80;i++){
    try{if((await fetch(base)).ok)break;}catch{}
    if(i===79)throw Error('PHP_SERVER_UNAVAILABLE '+errors.slice(-500));
    await new Promise(r=>setTimeout(r,100));
  }
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true});
  t.after(()=>browser.close());const results=[];
  for(const width of [1440,390]){
    const ctx=await browser.newContext({viewport:{width,height:950},isMobile:width===390,hasTouch:width===390,acceptDownloads:true});
    await ctx.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await ctx.newPage();await page.goto(base);
    // The real PHP Web router must persist the same private session through
    // two HTTP requests. This is NOT derived from CLI php.ini or .user.ini.
    const firstProbe=await ctx.request.get(base+'?session_storage_probe=1');
    assert.equal(firstProbe.status(),200,'private Web session file must be writable');
    assert.deepEqual(await firstProbe.json(),{storage_ready:true,cookie_persisted:false});
    const secondProbe=await ctx.request.get(base+'?session_storage_probe=1');
    assert.equal(secondProbe.status(),200);
    assert.deepEqual(await secondProbe.json(),{storage_ready:true,cookie_persisted:true});
    const csrf=await page.locator('[name=csrf]').inputValue();
    const anonymous={csrf,export_narrations:'1',creation_id:f.id,expected_version:'3'};
    const noLogin=await ctx.request.post(url,{form:anonymous,maxRedirects:0});
    assert.equal(noLogin.status(),403,'valid CSRF must not substitute for login');
    assert.match(noLogin.headers()['content-type'],/^text\/plain; charset=UTF-8$/i);
    assert.equal(noLogin.headers()['content-disposition'],undefined);
    assert.doesNotMatch(await noLogin.text(),/<(?:!doctype|html|form)\b/i);
    await page.locator('[name=username]').fill('fixture-admin');
    await page.locator('[name=password]').fill('synthetic-login-only');
    await page.locator('button[name=login]').click();await page.goto(url);
    const form=page.locator('#cms-narrations-export form');
    const values=await form.evaluate(el=>({...Object.fromEntries(new FormData(el)),export_narrations:'1'}));
    for(const [payload,code] of [[{...values,csrf:'incorrect'},403],
      [{...values,expected_version:'2'},409],[{...values,create_save:'1'},422]]){
      const response=await ctx.request.post(url,{form:payload,maxRedirects:0});
      assert.equal(response.status(),code);
      assert.match(response.headers()['content-type'],/^text\/plain; charset=UTF-8$/i);
      assert.equal(response.headers()['content-disposition'],undefined);
      assert.doesNotMatch(await response.text(),/<(?:!doctype|html|form)\b/i);
    }
    const response=await ctx.request.post(url,{form:values,maxRedirects:0});
    assert.equal(response.status(),200);
    assert.match(response.headers()['content-type'],/^text\/plain; charset=UTF-8$/i);
    const filename='atelier-'+record.atelier_reference.recipeSlug+'-7-narrations-v3.txt';
    assert.equal(response.headers()['content-disposition'],'attachment; filename="'+filename+'"');
    assert.equal(response.headers().location,undefined);
    const bytes=await response.body(),text=bytes.toString('utf8');
    assert.equal(Number(response.headers()['content-length']),bytes.length);
    assert.doesNotMatch(text,/<(?:!doctype|html|body|form)\b|TEST ISOLÉ|csrf|password|PRIVATE_/i);
    assert.equal((text.match(/^=== [1-7]\/7 — /gm)||[]).length,7);
    for(const chapter of record.atelier_scripts.chapters){
      assert.ok(text.includes(chapter.text),'exact saved '+chapter.id);
      assert.ok(text.includes(chapter.id+' : '+createHash('sha256').update(chapter.text).digest('hex')));
    }
    const downloaded=page.waitForEvent('download');
    await form.locator('button[name=export_narrations]').click();
    const download=await downloaded;
    assert.equal(download.suggestedFilename(),filename);
    assert.equal(await download.failure(),null);
    assert.deepEqual(await readFile(await download.path()),bytes);
    assert.deepEqual(await readFile(saved),before,'read-only download');
    // Real DOM visa click with deliberately stale hidden CSRF after a good
    // authentication. The preflight must refresh it, not bypass the POST guard.
    const probe=await ctx.request.get(base+'?session_status=1',{maxRedirects:0});
    assert.equal(probe.status(),200,'authenticated session must survive a new GET');
    const current=await probe.json();
    assert.equal(current.authenticated,true);
    assert.match(current.csrf,/^[a-f0-9]{48}$/);
    const openVisa=async()=>{
      await page.locator('[data-coral-human-visas]').evaluate(el=>{
        for(let parent=el;parent;parent=parent.parentElement)
          if(parent.tagName==='DETAILS')parent.open=true;
        el.querySelector('details.guided-group').open=true;
      });
      return page.locator('[data-coral-human-visas] form').first();
    };
    let visa=await openVisa();
    assert.equal(await visa.locator('button[name=review_action]').getAttribute('value'),'revoke');
    await visa.locator('input[name=csrf]').evaluate(el=>el.value='obsolete-session-csrf');
    await visa.locator('[name=review_confirm]').check();
    await Promise.all([page.waitForNavigation(),visa.locator('button[name=review_action]').click()]);
    assert.match(page.url(),/visa_saved=1/);
    assert.match(await page.locator('[data-coral-human-visas]').innerText(),/6\/7/);
    visa=await openVisa();
    await visa.locator('[name=review_confirm]').check();
    await Promise.all([page.waitForNavigation(),visa.locator('button[name=review_action]').click()]);
    assert.match(page.url(),/visa_saved=1/);
    assert.match(await page.locator('[data-coral-human-visas]').innerText(),/7\/7/);
    assert.deepEqual(await readFile(saved),before,'visa journal must not rewrite scripts');
    // Lost cookie fails closed before the browser submits a human decision.
    visa=await openVisa();
    await ctx.clearCookies();
    let visaPosts=0;
    const countVisa=req=>{if(req.method()==='POST' && req.postData()?.includes('review_action='))visaPosts++;};
    page.on('request',countVisa);
    await visa.locator('[name=review_confirm]').check();
    await visa.locator('button[name=review_action]').click();
    await page.waitForFunction(()=>document.querySelector('[data-visa-session-status]')?.textContent?.includes('Connexion non confirmée'));
    assert.equal(visaPosts,0,'do not POST a visa after session cookie loss');
    page.off('request',countVisa);
    // The owner must return to the exact final audit after login, without a
    // new human approval. Purely synthetic fixture session, no OVH account.
    const auditUrl=url+'&final_audit=1#final-review';
    await page.goto(auditUrl);
    assert.equal(await page.locator('h2').first().innerText(),'Connexion administrateur');
    await page.locator('[name=username]').fill('fixture-admin');
    await page.locator('[name=password]').fill('synthetic-login-only');
    await Promise.all([page.waitForNavigation(),page.locator('button[name=login]').click()]);
    assert.equal(new URL(page.url()).searchParams.get('final_audit'),'1');
    assert.equal(new URL(page.url()).hash,'#final-review');
    assert.equal(await page.locator('[data-coral-final-audit]').getAttribute('open'),'');
    assert.equal(await page.locator('[data-studio-advanced]').getAttribute('open'),'');
    const sessionCookie=(await ctx.cookies()).find(c=>c.name==='CDC_EDITORIAL_CMS');
    assert.ok(sessionCookie?.value,'fixture session cookie');
    // Set times on the private local PHP fixture, not through a public endpoint.
    const age=(signedSeconds,activitySeconds)=>{
      const change='session_save_path($argv[1]);session_name("CDC_EDITORIAL_CMS");'
        +'session_id($argv[2]);session_start();'
        +'$_SESSION["authenticated_at"]=time()-(int)$argv[3];'
        +'$_SESSION["auth_last_activity_at"]=time()-(int)$argv[4];'
        +'session_write_close();';
      execFileSync(php,['-r',change,join(root,'.cuisine-asset-portal','cms-editorial-session-files'),sessionCookie.value,
        String(signedSeconds),String(activitySeconds)],{windowsHide:true});
    };
    age(3600,1795);
    const stillActive=await ctx.request.get(base+'?session_status=1');
    assert.equal(stillActive.status(),200,'active session survives 1 hour since login');
    const refreshed=await stillActive.json();
    assert.equal(refreshed.authenticated,true);
    assert.ok(refreshed.expires_in>=1700&&refreshed.expires_in<=1800);
    age(3600,1801);
    const inactive=await ctx.request.get(base+'?session_status=1');
    assert.equal(inactive.status(),401,'session expires after 30 minutes without activity');
    age(43201,2);
    const absolute=await ctx.request.get(base+'?session_status=1');
    assert.equal(absolute.status(),401,'12-hour absolute boundary still applies');
    results.push({width,realBrowserClick:true,syntheticLocalLogin:true,filename,bytes:bytes.length,sevenExactTexts:true,html:false,visaStaleCsrfRecovered:true,missingCookieFailsClosed:true,idleSessionExpires:true,activeSessionSlides:true,auditRestoredAfterLogin:true});

    await ctx.close();
  }
  if(process.env.EXPORT_EVIDENCE_DIR){
    await mkdir(process.env.EXPORT_EVIDENCE_DIR,{recursive:true});
    await writeFile(join(process.env.EXPORT_EVIDENCE_DIR,'export-browser-tests.json'),JSON.stringify(results,null,2)+'\n');
  }
});
