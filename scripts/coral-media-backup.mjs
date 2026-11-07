/** Separate versioned audio archive. No network, old snapshots, queue restore or deletion. */
import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {mkdir,open,lstat,link,unlink,rmdir} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {privateAudioRead,privateAudioVerifiedOpen,durableWrite,audioSha,TTS_CHAPTER_IDS,syncPrivateDirectory,probeAudio} from './coral-tts-audio.mjs';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {validateTtsRequest} from './coral-tts-jobs.mjs';
import {coralFragmentPlan} from './coral-tts-checkpoints.mjs';
import {coralUsageCostMicrousd} from './coral-tts-cost-plan.mjs';
import {CORAL_TRANSCRIPT_NORMALIZATION,coralTranscriptSha} from './coral-tts-realtime-contract.mjs';
const MAGIC=Buffer.from('CDCAUD1\n'),MAX=64000000;
const closed=(o,keys)=>o&&Object.keys(o).sort().join(',')===[...keys].sort().join(',');
const allowed=n=>n==='subfragments.json'||n==='request.json'||n==='manifest.json'||n==='state.json'||n==='validation.json'||/^final-[a-f0-9]{64}\.mp3$/.test(n)||TTS_CHAPTER_IDS.some(id=>n===id+'.receipt.json');
async function privateDir(dir,{create=false}={}){if(create){await mkdir(dir,{mode:0o700});await syncPrivateDirectory(dirname(dir));}const s=await lstat(dir);if(!s.isDirectory()||s.isSymbolicLink()||(process.platform!=='win32'&&((s.mode&0o077)||s.uid!==process.geteuid())))throw Error('MEDIA_PRIVATE_DIR');}
async function verifyAudio(folder,m){const file=join(folder,m.file),p=await probeAudio(file);if(p.codec!=='mp3'||p.chapters.length!==7||Math.abs(p.duration-m.duration)>0.15||p.chapters.some((c,i)=>c.tags?.title!==m.chapters[i].id||Math.abs(Number(c.start_time)-m.chapters[i].start)>0.002))throw Error('MEDIA_AUDIO');await promisify(execFile)('ffmpeg',['-nostdin','-v','error','-protocol_whitelist','file,pipe','-max_alloc','33554432','-i',file,'-f','null','-'],{timeout:30000,maxBuffer:200000,windowsHide:true});}
function keyCheck(key){if(!Buffer.isBuffer(key)||key.length!==32)throw Error('MEDIA_KEY');}
function bindRequest(m,r){if(['request_id','creation_id','creation_version','binding_sha256','voice','provider'].some(k=>m[k]!==r[k])||m.reserved_microusd!==r.reserve_microusd)throw Error('MEDIA_REQUEST');}
function validateReceipt(r,c){if(!closed(r,['id','text_sha256','sha256','duration','cost_microusd'])||r.id!==c.id||r.text_sha256!==c.sha256||!/^[a-f0-9]{64}$/.test(r.sha256||'')||!Number.isFinite(r.duration)||r.duration<=0||!Number.isSafeInteger(r.cost_microusd)||r.cost_microusd<0)throw Error('MEDIA_RECEIPT');}
function validateSubfragments(evidence,request){
 if(evidence?.contract!=='cdc-coral-subfragment-evidence-v1'||!Array.isArray(evidence.chapters)||evidence.chapters.length>7)throw Error('MEDIA_SUBFRAGMENTS');const seen=new Set();
 for(const item of evidence.chapters){const chapter=request.chapters.find(c=>c.id===item.chapter),parts=chapter&&coralFragmentPlan(chapter);
  if(!parts||seen.has(item.chapter)||!closed(item,['chapter','plan','receipts'])||item.receipts?.length!==parts.length
   ||!closed(item.plan,['contract','request_id','chapter','index','text_sha256','model','voice','max_output_tokens','fragments'])
   ||item.plan.contract!=='cdc-coral-subfragments-v1'||item.plan.chapter!==chapter.id||item.plan.index!==request.chapters.indexOf(chapter)
   ||item.plan.model!=='gpt-realtime-2.1-mini'||item.plan.voice!=='coral'||item.plan.max_output_tokens!==2048||item.plan.request_id!==request.request_id||item.plan.text_sha256!==chapter.sha256||item.plan.fragments?.length!==parts.length)throw Error('MEDIA_SUBFRAGMENTS');seen.add(item.chapter);
  for(let i=0;i<parts.length;i++){const r=item.receipts[i];if(!closed(r,['response_id','model','voice','usage','cost_microusd','transcript_sha256','transcript_normalization','text_sha256','sha256','bytes'])
   ||!closed(r.usage,['input_tokens','output_tokens','input_token_details','output_token_details'])||!closed(r.usage.input_token_details,['text_tokens','audio_tokens'])||!closed(r.usage.output_token_details,['text_tokens','audio_tokens'])
   ||!closed(item.plan.fragments[i],['index','sha256'])||item.plan.fragments[i].index!==i||item.plan.fragments[i].sha256!==parts[i].sha256
   ||r.model!==item.plan.model||r.voice!==item.plan.voice||!/^resp_[a-zA-Z0-9_]{1,100}$/.test(r.response_id||'')||r.text_sha256!==parts[i].sha256
   ||r.transcript_normalization!==CORAL_TRANSCRIPT_NORMALIZATION||r.transcript_sha256!==coralTranscriptSha(parts[i].text)
   ||r.cost_microusd!==coralUsageCostMicrousd(r.usage)||r.usage.output_tokens>2048||!/^[a-f0-9]{64}$/.test(r.sha256||'')||!Number.isSafeInteger(r.bytes)||r.bytes<46||r.bytes>10000000)throw Error('MEDIA_SUBFRAGMENTS');}
 }
}
async function collectSubfragments(folder,request){
 const result={contract:'cdc-coral-subfragment-evidence-v1',chapters:[]};
 for(const chapter of request.chapters){const dir=join(folder,'fragments',chapter.id);try{await privateDir(dir);}catch(e){if(e.code==='ENOENT')continue;throw e;}
  const plan=JSON.parse(await privateAudioRead(join(dir,'plan.json'),150000)),receipts=[];
  if(!Array.isArray(plan.fragments)||plan.fragments.length>24)throw Error('MEDIA_SUBFRAGMENTS');
  for(let i=0;i<plan.fragments.length;i++){const stem=String(i).padStart(2,'0'),r=JSON.parse(await privateAudioRead(join(dir,stem+'.receipt.json'),150000));const f=await privateAudioVerifiedOpen(join(dir,stem+'.wav'),r.sha256,10000000);await f.handle.close();if(f.size!==r.bytes)throw Error('MEDIA_SUBFRAGMENTS');receipts.push(r);}
  result.chapters.push({chapter:chapter.id,plan,receipts});
 }validateSubfragments(result,request);return result;
}
function validateManifest(m){if(!closed(m,['contract','file','sha256','bytes','duration','chapters','format','simulated','request_id','creation_id','creation_version','binding_sha256','provider','voice','reserved_microusd','simulated_cost_microusd','provider_charged_microusd','audio_approved','publication_ready'])
 ||m.contract!=='cdc-coral-private-tts-result-v1'||m.format!=='mp3'||['simulated','audio_approved','publication_ready'].some(k=>typeof m[k]!=='boolean')||['reserved_microusd','simulated_cost_microusd','provider_charged_microusd'].some(k=>!Number.isSafeInteger(m[k])||m[k]<0)||!Number.isFinite(m.duration)||m.duration<=0||m.duration>7200||!/^final-[a-f0-9]{64}\.mp3$/.test(m.file||'')||m.file!=='final-'+m.sha256+'.mp3'||!Number.isSafeInteger(m.bytes)||m.bytes<1||m.bytes>32000000||m.chapters?.length!==7||m.chapters.some((c,i)=>!closed(c,['id','start','end'])||c.id!==TTS_CHAPTER_IDS[i]||!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.end<=c.start||Math.abs(c.start-(i?m.chapters[i-1].end:0))>0.002)||Math.abs(m.chapters[6].end-m.duration)>0.15)throw Error('MEDIA_MANIFEST');}
/** An archive is immutable and uniquely named by its own digest; caller chooses a NEW path. */
export async function backupCoralMedia({folder,archive,key,validation}){
 keyCheck(key);await privateDir(folder);const lock=join(folder,'.media-backup.lock');await mkdir(lock,{mode:0o700});
 try{return await backupUnlocked({folder,archive,key,validation});}finally{await rmdir(lock);}
}
async function backupUnlocked({folder,archive,key,validation}){
 keyCheck(key);await privateDir(folder);await privateDir(dirname(archive));
 try{await lstat(archive);throw Object.assign(Error('MEDIA_ARCHIVE_EXISTS'),{code:'EEXIST'});}catch(e){if(e.code!=='ENOENT')throw e;}
 const manifest=JSON.parse(await privateAudioRead(join(folder,'manifest.json'),150000));validateManifest(manifest);
 const state=JSON.parse(await privateAudioRead(join(folder,'state.json'),150000));
 const request=JSON.parse(await privateAudioRead(join(folder,'..','request.json'),150000));validateTtsRequest(request.request);
 const subfragments=await collectSubfragments(folder,request.request);
 bindRequest(manifest,request.request);
 if(!closed(state,['status','completed_chapters','manifest'])||state.status!=='succeeded'||state.completed_chapters!==7||JSON.stringify(state.manifest)!==JSON.stringify(manifest))throw Error('MEDIA_NOT_FINAL');
 if(validation?.contract!=='cdc-coral-audio-validation-v1'||validation.sha256!==manifest.sha256||validation.decode_passed!==true)throw Error('MEDIA_VALIDATION');
 if((validation.simulated!==undefined&&typeof validation.simulated!=='boolean')||Object.keys(validation).some(k=>!['contract','sha256','decode_passed','simulated','authority_evidence_sha256','culinary_review_sha256','human_visas_sha256'].includes(k))
  ||['authority_evidence_sha256','culinary_review_sha256','human_visas_sha256'].some(k=>validation[k]!==undefined&&!/^[a-f0-9]{64}$/.test(validation[k])))throw Error('MEDIA_VALIDATION');
 await verifyAudio(folder,manifest);
 for(const chapter of request.request.chapters)validateReceipt(JSON.parse(await privateAudioRead(join(folder,chapter.id+'.receipt.json'),150000)),chapter);
 const entries=['request.json','manifest.json','state.json',...TTS_CHAPTER_IDS.map(id=>id+'.receipt.json'),manifest.file];
 const iv=randomBytes(12),header=Buffer.concat([MAGIC,iv]),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(header);
 const temp=archive+'.incoming-'+randomBytes(12).toString('hex'),out=await open(temp,'wx',0o600),hash=createHash('sha256');let total=0;
 async function write(b){total+=b.length;if(total>MAX)throw Error('MEDIA_TOO_LARGE');hash.update(b);await out.writeFile(b);}
 async function plain(b){await write(cipher.update(b));}
 try{
  await write(header);
  for(const name of [...entries,'validation.json','subfragments.json']){
   const value=name==='subfragments.json'?Buffer.from(JSON.stringify(subfragments)):name==='validation.json'?Buffer.from(JSON.stringify(validation)):name==='request.json'?Buffer.from(JSON.stringify({request:request.request})):null;
   if(value&&value.length>(name==='subfragments.json'?1048576:150000))throw Error('MEDIA_TOO_LARGE');
   const opened=value?null:await privateAudioVerifiedOpen(join(folder,name),name===manifest.file?manifest.sha256:undefined,name.endsWith('.mp3')?32000000:150000);
   try{
    if(name===manifest.file&&opened.size!==manifest.bytes)throw Error('MEDIA_MANIFEST');
    const meta=Buffer.from(JSON.stringify({path:name,bytes:value?.length??opened.size,sha256:value?audioSha(value):opened.sha256}));
    const len=Buffer.alloc(4);len.writeUInt32BE(meta.length);await plain(len);await plain(meta);
    if(value)await plain(value);else for await(const b of opened.handle.createReadStream({start:0,autoClose:false,highWaterMark:65536}))await plain(b);
   }finally{await opened?.handle.close();}
  }
  await plain(Buffer.alloc(4));await write(cipher.final());await write(cipher.getAuthTag());await out.sync();
 }finally{await out.close();}
 // link is exclusive, unlike rename over an existing historical archive.
 await link(temp,archive);await syncPrivateDirectory(dirname(archive));await unlink(temp);await syncPrivateDirectory(dirname(archive));
 return {contract:'cdc-coral-media-backup-v1',archive_sha256:hash.digest('hex'),archive_bytes:total,mp3_sha256:manifest.sha256,
  files:entries.length+2,encrypted:true,secret_files_included:false,contains_wav:false,restore_tested:false};
}
class Reader{
 constructor(it){this.it=it[Symbol.asyncIterator]();this.buffer=Buffer.alloc(0);}
 async read(n,eof=false){while(this.buffer.length<n){const p=await this.it.next();if(p.done){if(eof&&this.buffer.length===0)return null;throw Error('MEDIA_TRUNCATED');}this.buffer=Buffer.concat([this.buffer,p.value]);}const b=this.buffer.subarray(0,n);this.buffer=this.buffer.subarray(n);return b;}
}
/** Restores only a NEW closed audio namespace. Never restores jobs/authority/approval. */
export async function restoreCoralMedia({archive,target,key,reviewed=false}){
 keyCheck(key);if(reviewed!==true)throw Error('MEDIA_RESTORE_REVIEW_REQUIRED');await privateDir(dirname(target));await privateDir(target,{create:true});
 await durableWrite(join(target,'.restore-review-required'),'PRIVATE AUDIO ONLY; no job replay, rights or publication approval restored.');
 const source=await privateAudioVerifiedOpen(archive,undefined,MAX);let committed=false;
 try{
  if(source.size<40)throw Error('MEDIA_TRUNCATED');const head=Buffer.alloc(20),tag=Buffer.alloc(16);await source.handle.read(head,0,20,0);await source.handle.read(tag,0,16,source.size-16);
  if(!head.subarray(0,8).equals(MAGIC))throw Error('MEDIA_FORMAT');const decipher=createDecipheriv('aes-256-gcm',key,head.subarray(8));decipher.setAAD(head);decipher.setAuthTag(tag);
  async function* plaintext(){for await(const b of source.handle.createReadStream({start:20,end:source.size-17,autoClose:false,highWaterMark:65536})){const d=decipher.update(b);if(d.length)yield d;}const end=decipher.final();if(end.length)yield end;}
  const reader=new Reader(plaintext()),names=new Set();let total=0;
  for(;;){const length=(await reader.read(4)).readUInt32BE();if(length===0)break;if(length>4096||names.size>=14)throw Error('MEDIA_FORMAT');
   const m=JSON.parse((await reader.read(length)).toString());
   if(Object.keys(m).sort().join(',')!=='bytes,path,sha256'||!allowed(m.path)||names.has(m.path)||!Number.isSafeInteger(m.bytes)||m.bytes<1||m.bytes>(m.path.endsWith('.mp3')?32000000:m.path==='subfragments.json'?1048576:150000)||!/^[a-f0-9]{64}$/.test(m.sha256||''))throw Error('MEDIA_ENTRY');
   total+=m.bytes;if(total>MAX)throw Error('MEDIA_TOO_LARGE');names.add(m.path);const out=await open(join(target,m.path),'wx',0o600),h=createHash('sha256');
   try{for(let left=m.bytes;left>0;){const b=await reader.read(Math.min(65536,left));h.update(b);await out.writeFile(b);left-=b.length;}if(h.digest('hex')!==m.sha256)throw Error('MEDIA_HASH');await out.sync();}finally{await out.close();}
  }
  if(await reader.read(1,true)!==null)throw Error('MEDIA_TRAILING_DATA'); // drains to GCM final authentication BEFORE commit
  const manifest=JSON.parse(await privateAudioRead(join(target,'manifest.json'),150000));validateManifest(manifest);
  const expected=['subfragments.json','request.json','manifest.json','state.json','validation.json',manifest.file,...TTS_CHAPTER_IDS.map(id=>id+'.receipt.json')];
  if(names.size!==expected.length||expected.some(n=>!names.has(n)))throw Error('MEDIA_INCOMPLETE');
  const mp3=await privateAudioVerifiedOpen(join(target,manifest.file),manifest.sha256);await mp3.handle.close();if(mp3.size!==manifest.bytes)throw Error('MEDIA_MANIFEST');
  const validation=JSON.parse(await privateAudioRead(join(target,'validation.json'),150000));
  if(validation.sha256!==manifest.sha256||validation.decode_passed!==true)throw Error('MEDIA_VALIDATION');
  const request=JSON.parse(await privateAudioRead(join(target,'request.json'),150000));validateTtsRequest(request.request);
  validateSubfragments(JSON.parse(await privateAudioRead(join(target,'subfragments.json'),1048576)),request.request);
  bindRequest(manifest,request.request);
  const state=JSON.parse(await privateAudioRead(join(target,'state.json'),150000));if(!closed(state,['status','completed_chapters','manifest'])||state.status!=='succeeded'||state.completed_chapters!==7||JSON.stringify(state.manifest)!==JSON.stringify(manifest))throw Error('MEDIA_NOT_FINAL');
  await verifyAudio(target,manifest);
  for(const chapter of request.request.chapters)validateReceipt(JSON.parse(await privateAudioRead(join(target,chapter.id+'.receipt.json'),150000)),chapter);
  const proof={contract:'cdc-coral-media-restored-v1',archive_sha256:source.sha256,mp3_sha256:manifest.sha256,bytes:manifest.bytes,
   authenticated:true,requires_current_authority:true,audio_approved:false,publication_ready:false};
  await durableWrite(join(target,'restore-complete.json'),JSON.stringify(proof));committed=true;return proof;
 }catch{throw Error('MEDIA_RESTORE_REJECTED');}finally{await source.handle.close();if(!committed)await durableWrite(join(target,'restore-failed.json'),JSON.stringify({closed:true,error:'MEDIA_RESTORE_REJECTED'}));}
}
/** Retention plan only; NEVER deletes files. Interrupted/uncertain jobs retain ALL fragments. */
export function coralAudioRetentionPlan({status,manifest,backup,restored,completedAt,now=Date.now()}){
 const verified=status==='succeeded'&&/^[a-f0-9]{64}$/.test(manifest?.sha256||'')&&/^[a-f0-9]{64}$/.test(backup?.archive_sha256||'')&&backup?.mp3_sha256===manifest?.sha256&&restored?.mp3_sha256===manifest?.sha256
  &&backup?.archive_sha256===restored?.archive_sha256&&restored?.authenticated===true&&Number.isFinite(completedAt)&&now-completedAt>=30*86400000;
 return {final_mp3:'retain-immutable',metadata:'retain-immutable',historical_archives:'unchanged',wav:verified?'eligible-for-separate-reviewed-cleanup':'retain',automatic_deletion:false};
}
