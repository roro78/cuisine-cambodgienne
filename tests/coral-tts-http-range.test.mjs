import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {audioByteRange,audioSha,TTS_CHAPTER_IDS} from '../scripts/coral-tts-audio.mjs';
import {createSimulatedTtsJobs,ttsRequestId} from '../scripts/coral-tts-jobs.mjs';
import {createJobGateway} from '../scripts/editorial-ai-job-gateway.mjs';
test('single audio byte ranges cover suffixes, open ends, leading zeroes and malformed/unsafe boundaries',()=>{
 for(const [header,status,start,end] of [[undefined,200,0,99],['bytes=0-19',206,0,19],['bytes=0002-0004',206,2,4],
  ['bytes=90-',206,90,99],['bytes=-10',206,90,99],['bytes=-1000',206,0,99],['bytes=90-1000',206,90,99],
  ['bytes=100-',416,0,-1],['bytes=5-4',416,0,-1],['bytes=-0',416,0,-1],['bytes=0-1,3-4',416,0,-1],
  ['bytes=-',416,0,-1],['bytes=0-9007199254740992',416,0,-1],['invalid',416,0,-1]])assert.deepEqual(audioByteRange(header,100),{status,start,end});
});
test('worker partial reads authenticate, reauthorize, preserve exact bytes and never expose revoked audio',async t=>{
 const root=await mkdtemp(join(tmpdir(),'cdc-tts-range-'));t.after(()=>rm(root,{recursive:true,force:true}));let valid=true;
 const r={contract:'cdc-coral-private-tts-request-v1',creation_id:'c-'+'a'.repeat(24),creation_version:3,binding_sha256:'b'.repeat(64),recipe_sha256:'c'.repeat(64),
  chapters:TTS_CHAPTER_IDS.map(id=>{const text='Donnée fictive du test HTTP privé, aucune voix réelle ni publication. '.repeat(3)+id;return {id,text,sha256:audioSha(text)};}),
  voice:'test-tone',provider:'simulated-tone-v1',rights_sha256:'d'.repeat(64),reviews_sha256:'e'.repeat(64),reserve_microusd:7000};r.request_id=ttsRequestId(r);
 const token='synthetic-range-queue-token-'.repeat(3),jobs=createSimulatedTtsJobs({authorize:async()=>valid,budgetDir:join(root,'budget')});
 const gateway=await createJobGateway({root:join(root,'jobs'),token,provider:async()=>{},ttsJobs:jobs});
 await gateway.submit(r.request_id,r);await gateway.workOnce();await new Promise(x=>gateway.server.listen(0,'127.0.0.1',x));
 t.after(()=>new Promise(x=>{gateway.server.closeAllConnections();gateway.server.close(x);}));
 const url='http://127.0.0.1:'+gateway.server.address().port+'/editorial-ai/v1/jobs/'+r.request_id+'/audio';
 const headers={Authorization:'Bearer '+token};assert.equal((await fetch(url,{headers:{Range:'bytes=0-19'}})).status,401);
 const full=await fetch(url,{headers}),bytes=Buffer.from(await full.arrayBuffer());assert.equal(full.status,200);assert.equal(full.headers.get('accept-ranges'),'bytes');
 for(const [range,from,to] of [['bytes=0-19',0,19],['bytes=-32',bytes.length-32,bytes.length-1]]){
  const res=await fetch(url,{headers:{...headers,Range:range}});assert.equal(res.status,206);
  assert.deepEqual(Buffer.from(await res.arrayBuffer()),bytes.subarray(from,to+1));assert.equal(res.headers.get('content-range'),'bytes '+from+'-'+to+'/'+bytes.length);
 }
 const bad=await fetch(url,{headers:{...headers,Range:'bytes=0-1,3-4'}});assert.equal(bad.status,416);assert.equal(bad.headers.get('content-range'),'bytes */'+bytes.length);
 const fallback=await fetch(url,{headers:{...headers,Range:'bytes=0-19','If-Range':'"other-file"'}});assert.equal(fallback.status,200);await fallback.arrayBuffer();
 valid=false;const denied=await fetch(url,{headers:{...headers,Range:'bytes=0-19'}});assert.equal(denied.status,422);assert.ok((await denied.text()).length<100);
});
