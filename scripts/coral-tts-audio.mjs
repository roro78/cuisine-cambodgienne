/** Private, offline audio primitives. No network, voice cloning or public output. */
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash,randomBytes} from 'node:crypto';
import {readFile,writeFile,lstat,chmod,link,unlink} from 'node:fs/promises';
import {join} from 'node:path';
const exec=promisify(execFile);
export const TTS_CHAPTER_IDS=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
export const audioSha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function privateAudioRead(file,max=32000000){
 const s=await lstat(file);
 if(!s.isFile()||s.isSymbolicLink()||s.size<1||s.size>max
  ||(process.platform!=='win32'&&((s.mode&0o077)||s.uid!==process.geteuid())))throw Error('TTS_PRIVATE_FILE');
 return readFile(file);
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
export function simulatedTtsProvider({failAt=null}={}){
 return {kind:'simulated-tone-v1',paid:false,async synthesize({index}){
  if(index===failAt)throw Error('SIMULATED_UNCERTAIN_RESPONSE');
  // Different fixed frequencies/durations verify order; never mimic a real voice.
  const rate=24000,frames=rate/5+index*240,pcm=Buffer.alloc(frames*2);
  for(let n=0;n<frames;n++)pcm.writeInt16LE(Math.round(2500*Math.sin(2*Math.PI*(330+index*70)*n/rate)),n*2);
  const wav=Buffer.alloc(44+pcm.length);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);
  wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(pcm.length,40);pcm.copy(wav,44);
  return wav;
 }};
}
export async function probeAudio(file,{ffprobe='ffprobe'}={}){
 await privateAudioRead(file);
 const {stdout}=await exec(ffprobe,['-v','error','-protocol_whitelist','file,pipe','-max_alloc','33554432','-show_format','-show_streams','-show_chapters','-of','json',file],{timeout:30000,maxBuffer:200000,windowsHide:true});
 const p=JSON.parse(stdout),s=p.streams?.find(x=>x.codec_type==='audio'),duration=Number(p.format?.duration);
 if(!s||!Number.isFinite(duration)||duration<=0||duration>7200)throw Error('TTS_INVALID_AUDIO');
 return {duration,codec:s.codec_name,sampleRate:Number(s.sample_rate),channels:s.channels,chapters:p.chapters||[]};
}
export async function assemblePrivateMp3(folder,segments,{ffmpeg='ffmpeg',ffprobe='ffprobe'}={}){
 if(segments.length!==7||segments.some((s,i)=>s.id!==TTS_CHAPTER_IDS[i]))throw Error('TTS_CHAPTER_ORDER');
 let offset=0;const chapters=[];
 for(const s of segments){
  const bytes=await privateAudioRead(join(folder,s.id+'.wav'));
  if(audioSha(bytes)!==s.sha256)throw Error('TTS_FRAGMENT_HASH');
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
  await chmod(tmp,0o600);const bytes=await privateAudioRead(tmp),m=await probeAudio(tmp,{ffprobe});
  if(m.codec!=='mp3'||Math.abs(m.duration-offset)>0.15||m.chapters.length!==7
   ||m.chapters.some((c,i)=>c.tags?.title!==chapters[i].id||Math.abs(Number(c.start_time)-chapters[i].start)>0.002))throw Error('TTS_ASSEMBLY_INVALID');
  // Decode the actual final file as well as probing its headers.
  await exec(ffmpeg,['-nostdin','-v','error','-protocol_whitelist','file,pipe','-max_alloc','33554432','-i',tmp,'-f','null','-'],{timeout:30000,maxBuffer:200000,windowsHide:true});
  const name='final-'+audioSha(bytes)+'.mp3';
  try{await link(tmp,join(folder,name));}catch(e){if(e.code!=='EEXIST'||audioSha(await privateAudioRead(join(folder,name)))!==audioSha(bytes))throw e;}
  return {file:name,sha256:audioSha(bytes),bytes:bytes.length,duration:m.duration,chapters,format:'mp3',simulated:true};
 }finally{
  for(const f of [tmp,list,metadata])try{await unlink(f);}catch(e){if(e.code!=='ENOENT')throw e;}
 }
}
