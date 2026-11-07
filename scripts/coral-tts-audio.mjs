/** Private, offline audio primitives. No network, voice cloning or public output. */
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash,randomBytes} from 'node:crypto';
import {readFile,writeFile,lstat,chmod,link,unlink,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join} from 'node:path';
const exec=promisify(execFile);
export const TTS_CHAPTER_IDS=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
export const audioSha=bytes=>createHash('sha256').update(bytes).digest('hex');
/** Single RFC byte range, only AFTER authorization and full-file integrity checks. */
export function audioByteRange(header,length){
 if(header===undefined||header===null)return {status:200,start:0,end:length-1};
 const invalid={status:416,start:0,end:-1};
 if(typeof header!=='string'||header.length>80)return invalid;
 const m=/^bytes=(\d*)-(\d*)$/.exec(header);if(!m||(!m[1]&&!m[2]))return invalid;
 const a=m[1]?Number(m[1]):null,b=m[2]?Number(m[2]):null;
 if((a!==null&&!Number.isSafeInteger(a))||(b!==null&&!Number.isSafeInteger(b)))return invalid;
 if(a===null)return b>0?{status:206,start:Math.max(0,length-b),end:length-1}:invalid;
 if(a>=length||(b!==null&&b<a))return invalid;
 return {status:206,start:a,end:b===null?length-1:Math.min(b,length-1)};
}
export async function privateAudioOpen(file,max=32000000){
 const s=await lstat(file);
 if(!s.isFile()||s.isSymbolicLink()||s.size<1||s.size>max
  ||(process.platform!=='win32'&&((s.mode&0o077)||s.uid!==process.geteuid())))throw Error('TTS_PRIVATE_FILE');
 const f=await open(file,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
 try{const a=await f.stat();if(a.ino!==s.ino||a.dev!==s.dev||a.size!==s.size||a.mode!==s.mode||a.uid!==s.uid)throw Error('TTS_PRIVATE_FILE');return {handle:f,size:a.size};}
 catch(e){await f.close();throw e;}
}
export async function privateAudioRead(file,max=32000000){
 const {handle}=await privateAudioOpen(file,max);try{return await handle.readFile();}finally{await handle.close();}
}
export async function privateAudioDigest(file,max=32000000){
 const {handle,size,sha256}=await privateAudioVerifiedOpen(file,undefined,max);
 try{return {sha256,bytes:size};}
 finally{await handle.close();}
}
export async function privateAudioVerifiedOpen(file,expected,max=32000000){
 const {handle,size}=await privateAudioOpen(file,max),before=await handle.stat(),hash=createHash('sha256');
 try{
  for await(const chunk of handle.createReadStream({start:0,highWaterMark:65536,autoClose:false}))hash.update(chunk);
  const sha256=hash.digest('hex'),after=await handle.stat();
  if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs||(expected!==undefined&&sha256!==expected))throw Error('TTS_FINAL_HASH');
  return {handle,size,sha256};
 }catch(e){await handle.close();throw e;}
}
export async function durableAudioWrite(file,source,max=32000000){
 const f=await open(file,'wx',0o600),hash=createHash('sha256');let bytes=0;
 try{for await(const chunk of Buffer.isBuffer(source)?[source]:source){
  if(!Buffer.isBuffer(chunk)||(bytes+=chunk.length)>max)throw Error('TTS_UNCERTAIN');hash.update(chunk);await f.writeFile(chunk);
 }if(bytes<1)throw Error('TTS_UNCERTAIN');await f.sync();return {sha256:hash.digest('hex'),bytes};}
 finally{await f.close();}
}
export async function durableWrite(file,bytes){
 const {open}=await import('node:fs/promises');
 const f=await open(file,'wx',0o600);
 try{await f.writeFile(bytes);await f.sync();}finally{await f.close();}
}
export async function atomicJson(file,value){
 const {rename}=await import('node:fs/promises');
 const temp=file+'.'+randomBytes(12).toString('hex')+'.tmp';
 await durableWrite(temp,JSON.stringify(value));await rename(temp,file);
}
export function pcmToWav(pcm){
 if(!Buffer.isBuffer(pcm)||pcm.length<2||pcm.length%2||pcm.length+44>32000000)throw Error('TTS_PCM');
 const wav=Buffer.alloc(44+pcm.length);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
 wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(24000,24);
 wav.writeUInt32LE(48000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(pcm.length,40);pcm.copy(wav,44);return wav;
}
function wavHeader(frames){const w=Buffer.alloc(44);w.write('RIFF');w.writeUInt32LE(36+frames*2,4);w.write('WAVEfmt ',8);w.writeUInt32LE(16,16);w.writeUInt16LE(1,20);w.writeUInt16LE(1,22);w.writeUInt32LE(24000,24);w.writeUInt32LE(48000,28);w.writeUInt16LE(2,32);w.writeUInt16LE(16,34);w.write('data',36);w.writeUInt32LE(frames*2,40);return w;}
export function simulatedTtsProvider({failAt=null,durations=null}={}){
 if(durations!==null&&(!Array.isArray(durations)||durations.length!==7
  ||durations.some(x=>!Number.isFinite(x)||x<=0||x>600)||durations.reduce((a,b)=>a+b,0)>4200))throw Error('TTS_SIMULATION_DURATION');
 return {kind:'simulated-tone-v1',paid:false,async synthesize({index}){
  if(index===failAt)throw Error('SIMULATED_UNCERTAIN_RESPONSE');
  // Different fixed frequencies/durations verify order; never mimic a real voice.
  const rate=24000,frames=durations===null?rate/5+index*240:Math.round(rate*durations[index]);
  if(durations!==null)return (async function*(){yield wavHeader(frames);for(let start=0;start<frames;start+=16384){const chunk=Buffer.alloc(Math.min(16384,frames-start)*2);for(let n=0;n<chunk.length/2;n++)chunk.writeInt16LE(Math.round(2500*Math.sin(2*Math.PI*(330+index*70)*(start+n)/rate)),n*2);yield chunk;}})();
  const wav=Buffer.alloc(44+frames*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);
  wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(frames*2,40);
  for(let n=0;n<frames;n++)wav.writeInt16LE(Math.round(2500*Math.sin(2*Math.PI*(330+index*70)*n/rate)),44+n*2);
  return wav;
 }};
}
export async function probeAudio(file,{ffprobe='ffprobe'}={}){
 const {handle}=await privateAudioOpen(file);await handle.close();
 const {stdout}=await exec(ffprobe,['-v','error','-protocol_whitelist','file,pipe','-max_alloc','33554432','-show_format','-show_streams','-show_chapters','-of','json',file],{timeout:30000,maxBuffer:200000,windowsHide:true});
 const p=JSON.parse(stdout),s=p.streams?.find(x=>x.codec_type==='audio'),duration=Number(p.format?.duration);
 if(!s||!Number.isFinite(duration)||duration<=0||duration>7200)throw Error('TTS_INVALID_AUDIO');
 return {duration,codec:s.codec_name,sampleRate:Number(s.sample_rate),channels:s.channels,chapters:p.chapters||[]};
}
export async function assemblePrivateMp3(folder,segments,{ffmpeg='ffmpeg',ffprobe='ffprobe'}={}){
 if(segments.length!==7||segments.some((s,i)=>s.id!==TTS_CHAPTER_IDS[i]))throw Error('TTS_CHAPTER_ORDER');
 let offset=0;const chapters=[];
 for(const s of segments){
  if((await privateAudioDigest(join(folder,s.id+'.wav'))).sha256!==s.sha256)throw Error('TTS_FRAGMENT_HASH');
  const measured=await probeAudio(join(folder,s.id+'.wav'),{ffprobe});
  if(measured.codec!=='pcm_s16le'||measured.sampleRate!==24000||measured.channels!==1
    ||Math.abs(measured.duration-s.duration)>0.00001)throw Error('TTS_FRAGMENT_FORMAT');
  const start=offset;offset+=measured.duration;chapters.push({id:s.id,start,end:offset});
 }
 const nonce=randomBytes(12).toString('hex'),tmp=join(folder,'assembled-'+nonce+'.mp3');
 const list=join(folder,'concat-'+nonce+'.txt'),metadata=join(folder,'chapters-'+nonce+'.ffmeta');
 await durableWrite(list,TTS_CHAPTER_IDS.map(id=>"file '"+id+".wav'").join('\n')+'\n');
 await durableWrite(metadata,';FFMETADATA1\n'+chapters.map(c=>'[CHAPTER]\nTIMEBASE=1/1000\nSTART='+Math.round(c.start*1000)+'\nEND='+Math.round(c.end*1000)+'\ntitle='+c.id+'\n').join(''));
 try{
  await exec(ffmpeg,['-nostdin','-v','error','-protocol_whitelist','file,pipe','-max_alloc','33554432','-f','concat','-safe','1','-i',list,'-i',metadata,
   '-map','0:a:0','-map_metadata','1','-map_chapters','1','-c:a','libmp3lame','-b:a','64k','-ar','24000','-ac','1','-threads','1',tmp],
   {cwd:folder,timeout:30000,maxBuffer:200000,windowsHide:true});
  await chmod(tmp,0o600);const digest=await privateAudioDigest(tmp),m=await probeAudio(tmp,{ffprobe});
  if(m.codec!=='mp3'||Math.abs(m.duration-offset)>0.15||m.chapters.length!==7
   ||m.chapters.some((c,i)=>c.tags?.title!==chapters[i].id||Math.abs(Number(c.start_time)-chapters[i].start)>0.002))throw Error('TTS_ASSEMBLY_INVALID');
  // Decode the actual final file as well as probing its headers.
  await exec(ffmpeg,['-nostdin','-v','error','-protocol_whitelist','file,pipe','-max_alloc','33554432','-i',tmp,'-f','null','-'],{timeout:30000,maxBuffer:200000,windowsHide:true});
  const name='final-'+digest.sha256+'.mp3';
  try{await link(tmp,join(folder,name));}catch(e){if(e.code!=='EEXIST'||(await privateAudioDigest(join(folder,name))).sha256!==digest.sha256)throw e;}
  return {file:name,...digest,duration:m.duration,chapters,format:'mp3',simulated:true};
 }finally{
  for(const f of [tmp,list,metadata])try{await unlink(f);}catch(e){if(e.code!=='ENOENT')throw e;}
 }
}
