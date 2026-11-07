/** Native player used by the shared Studio, with the actual gateway's protected MP3 bytes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createServer} from 'node:http';
import {chromium} from 'playwright-core';
import {createJobGateway} from '../scripts/editorial-ai-job-gateway.mjs';
import {createSimulatedTtsJobs} from '../scripts/coral-tts-jobs.mjs';
import {privateAudioVerifiedOpen,audioByteRange} from '../scripts/coral-tts-audio.mjs';
import {pipeline} from 'node:stream/promises';
async function roots(base,depth=0){
 if(depth>4)return [];try{await readFile(join(base,'summary.json'));return [base];}catch{}
 const result=[];for(const entry of await readdir(base,{withFileTypes:true}))if(entry.isDirectory()&&!entry.isSymbolicLink())result.push(...await roots(join(base,entry.name),depth+1));return result;
}
test('long private native player: load, pause and seek all seven measured chapters',{timeout:120000},async t=>{
 assert.ok(process.env.TTS_LONG_EVIDENCE_DIR,'run the isolated long fixture first');
 const base=resolve(process.env.TTS_LONG_EVIDENCE_DIR),reports=[];
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--autoplay-policy=no-user-gesture-required']});t.after(()=>browser.close());
 for(const root of await roots(base)){
  const summary=JSON.parse(await readFile(join(root,'summary.json'),'utf8')),restored=process.env.TTS_RESTORED_PLAYER==='true';
  const m=summary.manifest,token='synthetic-private-load-player-'.repeat(3);
  const jobs=createSimulatedTtsJobs({authorize:async()=>true,budgetDir:join(root,'budget')});
  const gateway=restored?null:await createJobGateway({root:join(root,'jobs'),token,provider:async()=>{throw Error('NO_PROVIDER')},ttsJobs:jobs});
  if(restored){assert.equal(summary.media_restore?.restored.authenticated,true);assert.equal(summary.media_restore.restored.mp3_sha256,m.sha256);}
  let transferBytes=0;
  const server=createServer(async(req,res)=>{
   if(req.headers.authorization!=='Bearer '+token){res.writeHead(401);res.end();return;}
   if(req.url==='/'){
    res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
    res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>Lecteur audio fictif privé</title><style>audio{width:100%;max-width:42rem}body{margin:1rem}</style><audio controls preload="metadata" src="/editorial-ai/v1/jobs/'+m.request_id+'/audio"></audio>');
   }else{const write=res.write.bind(res),end=res.end.bind(res);res.write=(chunk,...args)=>{transferBytes+=chunk?.length||0;return write(chunk,...args);};
    res.end=(chunk,...args)=>{transferBytes+=chunk?.length||0;return end(chunk,...args);};
    if(!restored){gateway.server.emit('request',req,res);return;}
    // Closed restore namespace only, synthetic authority + Bearer; never reinserts a job.
    let opened;try{
     if(req.url!=='/editorial-ai/v1/jobs/'+m.request_id+'/audio')throw Error('FIXTURE_ROUTE');
     const marker=JSON.parse(await readFile(join(root,'restored-audio','restore-complete.json'),'utf8'));assert.equal(marker.mp3_sha256,m.sha256);
     opened=await privateAudioVerifiedOpen(join(root,'restored-audio','final-'+m.sha256+'.mp3'),m.sha256);
     const range=audioByteRange(req.headers.range,opened.size);if(range.status===416){await opened.handle.close();res.writeHead(416,{'Content-Range':'bytes */'+opened.size});res.end();return;}
     const headers={'Content-Type':'audio/mpeg','Cache-Control':'no-store','Accept-Ranges':'bytes','Content-Length':range.end-range.start+1};
     if(range.status===206)headers['Content-Range']='bytes '+range.start+'-'+range.end+'/'+opened.size;res.writeHead(range.status,headers);
     await pipeline(opened.handle.createReadStream({start:range.start,end:range.end,highWaterMark:65536}),res);
    }catch{if(!res.headersSent)res.writeHead(403);res.end();try{await opened?.handle.close();}catch{}}
   }
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));
  const origin='http://127.0.0.1:'+server.address().port,ctx=await browser.newContext({extraHTTPHeaders:{Authorization:'Bearer '+token}});
  await ctx.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await ctx.newPage();const started=Date.now();await page.goto(origin);
  await page.waitForFunction(()=>document.querySelector('audio').readyState>=2,{},{timeout:30000});
  const metadataMs=Date.now()-started,audio=page.locator('audio');assert.ok(Math.abs(await audio.evaluate(a=>a.duration)-m.duration)<0.2);
  const seeks=[];
  for(const c of m.chapters){
   const target=c.start+0.25,start=Date.now();await audio.evaluate((a,n)=>{a.currentTime=n;},target);
   try{await page.waitForFunction(n=>{const a=document.querySelector('audio');return !a.seeking&&a.readyState>=2&&Math.abs(a.currentTime-n)<0.2;},target);}
   catch(e){throw Error('LONG_AUDIO_SEEK '+JSON.stringify(await audio.evaluate(a=>({time:a.currentTime,duration:a.duration,ready:a.readyState,seeking:a.seeking,
    error:a.error?.code,seekable:Array.from({length:a.seekable.length},(_,i)=>[a.seekable.start(i),a.seekable.end(i)])})))+' target='+target);}
   await audio.evaluate(a=>a.play());await page.waitForFunction(n=>document.querySelector('audio').currentTime>n+0.05,target);
   await audio.evaluate(a=>a.pause());assert.equal(await audio.evaluate(a=>a.paused),true);seeks.push({id:c.id,seek_and_play_ms:Date.now()-start});
  }
  for(const width of [360,390,1440]){await page.setViewportSize({width,height:850});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  reports.push({scenario:summary.scenario.name,sha256:m.sha256,duration:m.duration,metadata_ms:metadataMs,seeks,transfer_bytes:transferBytes,
   restored_audio:restored,native_player:true,physical_android_test:false,worker_resource_envelope_applies_to_browser:false});
  await ctx.close();await new Promise(r=>{server.closeAllConnections();server.close(r);});
 }
 assert.equal(reports.length,2);await writeFile(join(base,'player-metrics.json'),JSON.stringify(reports,null,2));
});
