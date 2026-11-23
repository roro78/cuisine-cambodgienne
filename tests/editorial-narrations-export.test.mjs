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
    results.push({width,realBrowserClick:true,syntheticLocalLogin:true,filename,bytes:bytes.length,sevenExactTexts:true,html:false});
    await ctx.close();
  }
  if(process.env.EXPORT_EVIDENCE_DIR){
    await mkdir(process.env.EXPORT_EVIDENCE_DIR,{recursive:true});
    await writeFile(join(process.env.EXPORT_EVIDENCE_DIR,'export-browser-tests.json'),JSON.stringify(results,null,2)+'\n');
  }
});
