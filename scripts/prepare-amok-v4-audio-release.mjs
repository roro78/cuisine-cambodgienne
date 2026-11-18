#!/usr/bin/env node
/**
 * Amok Trey v4 / Coral: offline, fail-closed private release preflight.
 *
 * Reads ONLY the private MP3 deliveries and, optionally, the original V4 draft.
 * It cannot publish, merge, regenerate audio, or modify the existing six guides.
 * Not a claim of having checked the owner's private files from GitHub CI.
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, lstatSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {dirname, isAbsolute, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const AMOK_ID='c-090c287895f1d8d8e306d871';
export const AMOK_TRACKS=Object.freeze([
  {id:'intro',name:'00-intro.mp3',bytes:1082880,sha256:'2b1b82e84b1c8096f5d758b32374410dfd3dc56e791a246e8aaf009d64f7ce62',textSha256:'fd1f4022a253e757abffb5fbc24c908e50aa626e72400ac4861b44ce424aceed'},
  {id:'installer',name:'01-installer.mp3',bytes:2094720,sha256:'f1df1b87bedd1e97f5e44de10d05965bfd806fdde7468f5b93764064104c4742',textSha256:'cacc48a57242a0aa650593747640c8815caef804c10e6ed288b73213dee1c0a6'},
  {id:'preparer',name:'02-preparer.mp3',bytes:1594752,sha256:'674a7e45de0d20cbff117c98d508cfcd907a40f0e99b26a897f8bb29999b41e5',textSha256:'f9f23eda9d4b45d25635f55a04d0463a7a46e67af1f3c27963bb597ad1bcadf8'},
  {id:'assembler',name:'03-assembler.mp3',bytes:1914624,sha256:'b7bde698a28ea9248335448134780c4d26345bc5bdf987da2841d8e1cc5701ca',textSha256:'3484beab7f59494234039371bd9ffb1e77568b96a7194216c2b985c4f90d8bad'},
  {id:'maitriser',name:'04-maitriser.mp3',bytes:1849344,sha256:'b5d5e047b02076070dc4a880c2a36085819c29a10836793c917847cf2b14308c',textSha256:'16bdff10707585457f7ec608264bcbfddbb7f7f528776b02fa176c248ad6afa5'},
  {id:'rectifier',name:'05-rectifier.mp3',bytes:1624704,sha256:'675b94876e28464aa381149c53e619f5412aaa93293d3fb827fa04f6786e1604',textSha256:'90ec800ef92355c02586570b9919c403bc81a6d28c45ac47a96ffc7183252376'},
  {id:'terminer',name:'06-terminer.mp3',bytes:1275648,sha256:'2ef179590c865d5ebeaa65d8e3d8cc1393e77fb567588141194060e1551814d4',textSha256:'c4607199043c3dff3abf467e25a6997b0019619b881479461a003293502b4a8b'}
]);
const INTEGRAL={
  name:'amok-trey-v4-coral-integral.mp3',
  bytes:11436672,
  sha256:'177ccaad9b45a18c11270d9a949e8d19f55516e8e045745615d32f5c2d4bceff'
};
const ARCHIVE={
  name:'amok-trey-v4-coral-7-mp3.zip',
  bytes:11437438,
  sha256:'c13f63a04e0ec083b61f06c59f63b030620ab6fe3e0fbd6e4bb3f0b3ef88acfe'
};
const ROUND3=value=>Math.round(value*1000)/1000;
const sha=value=>createHash('sha256').update(value).digest('hex');

export function amokChapterTimeline(tracks=AMOK_TRACKS){
  if(!Array.isArray(tracks)||tracks.length!==7 ||
     tracks.some((t,i)=>!t||t.id!==AMOK_TRACKS[i].id||
       !Number.isInteger(t.bytes)||t.bytes<384||t.bytes%384!==0))
    throw Error('AMOK_CHAPTER_CONTRACT');
  let cursor=0;
  const chapters=tracks.map(t=>{
    const startSec=ROUND3(cursor/16000);
    cursor+=t.bytes;
    return {id:t.id,startSec,endSec:ROUND3(cursor/16000)};
  });
  return {chapters,durationSec:ROUND3(cursor/16000),bytes:cursor};
}

function checkedPrivateFile(file,expected){
  const st=lstatSync(file);
  if(!st.isFile()||st.isSymbolicLink()||st.size!==expected.bytes)
    throw Error('AMOK_FILE_SIZE_OR_TYPE: '+expected.name);
  const digest=sha(readFileSync(file));
  if(digest!==expected.sha256)
    throw Error('AMOK_SHA256_MISMATCH: '+expected.name);
  return digest;
}

function probeMp3(file,seconds){
  let raw;
  try {
    raw=execFileSync('ffprobe',[
      '-v','error','-show_entries','format=duration,bit_rate:stream=codec_name,sample_rate,channels',
      '-of','json',file
    ],{encoding:'utf8',timeout:30000,maxBuffer:200000,windowsHide:true});
  }catch{throw Error('AMOK_FFPROBE_REQUIRED_OR_DECODE_FAILED');}
  const info=JSON.parse(raw);
  const track=info.streams?.find(x=>x.codec_name==='mp3');
  const duration=Number(info.format?.duration);
  if(!track||Number(track.sample_rate)!==24000||Number(track.channels)!==1
     ||!Number.isFinite(duration)||Math.abs(duration-seconds)>0.08)
    throw Error('AMOK_MP3_CODEC_OR_DURATION');
  // ffprobe's bit_rate may include metadata overhead; exact bytes and SHA
  // already pin the original file. Do not infer price from bitrate.
  return duration;
}

function verifySource(path){
  const st=lstatSync(path);
  if(!st.isFile()||st.isSymbolicLink()||st.size>100000)throw Error('AMOK_PRIVATE_SOURCE_INVALID');
  const draft=JSON.parse(readFileSync(path,'utf8'));
  if(draft.id!==AMOK_ID||draft.version!==4||draft.kind!=='atelier')throw Error('AMOK_WRONG_DRAFT');
  const chapters=draft.atelier_scripts?.chapters;
  if(!Array.isArray(chapters)||chapters.length!==7)throw Error('AMOK_SEVEN_TEXTS_REQUIRED');
  chapters.forEach((c,i)=>{
    if(c.id!==AMOK_TRACKS[i].id||String(c.index)!==String(i)||
       typeof c.text!=='string'||sha(c.text)!==AMOK_TRACKS[i].textSha256)
      throw Error('AMOK_TEXT_SHA256_MISMATCH: '+AMOK_TRACKS[i].id);
  });
  return true;
}

export function releasePreflight({dir,source=null}){
  if(typeof dir!=='string'||!isAbsolute(dir))throw Error('AMOK_ABSOLUTE_PRIVATE_DIR_REQUIRED');
  const folder=realpathSync(dir);
  const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const inside=relative(realpathSync(repo),folder);
  if(inside===''||(!inside.startsWith('..')&&!isAbsolute(inside)))
    throw Error('AMOK_REFUSE_REPOSITORY_OR_PUBLIC_FOLDER');
  const st=lstatSync(folder);
  if(!st.isDirectory()||st.isSymbolicLink())throw Error('AMOK_PRIVATE_DIR_REQUIRED');
  const expected=amokChapterTimeline();
  if(expected.bytes!==INTEGRAL.bytes)throw Error('AMOK_EXPECTED_TOTAL_MISMATCH');
  const verified=AMOK_TRACKS.map((t,i)=>{
    const file=join(folder,t.name);
    checkedPrivateFile(file,t);
    const durationSec=probeMp3(file,(t.bytes/16000));
    return {id:t.id,filename:t.name,sha256:t.sha256,bytes:t.bytes,
      durationSec:ROUND3(durationSec),startSec:expected.chapters[i].startSec,
      endSec:expected.chapters[i].endSec};
  });
  const assembled=join(folder,INTEGRAL.name);
  checkedPrivateFile(assembled,INTEGRAL);
  probeMp3(assembled,expected.durationSec);
  checkedPrivateFile(join(folder,ARCHIVE.name),ARCHIVE);
  const sourceVerified=source===null?false:verifySource(realpathSync(source));
  // No narrations or secret are copied into the generated preflight file.
  const result={
    contract:'cdc-amok-trey-v4-private-release-preflight-v1',
    status:'candidate_private_not_published',
    creationId:AMOK_ID,creationVersion:4,voice:'coral',
    model:'gpt-4o-mini-tts',speed:0.93,
    candidatePublicSlug:'amok-trey',
    candidateAudioUrl:'/audio/workshops/atelier-pratique-amok-trey/atelier-coral-v4.mp3',
    totalDurationSec:expected.durationSec,integral:INTEGRAL,
    archive:ARCHIVE,tracks:verified,sourceVerified,
    publicationReady:false,
    pending:['écoute intégrale humaine','blueprint culinaire depuis le brouillon privé',
      'vérification de la page et du lecteur Android/desktop',
      'autorisation de publication distincte']
  };
  const output=join(folder,'publication-preflight-amok-trey-v4.json');
  const value=JSON.stringify(result,null,2)+'\n';
  if(existsSync(output)){
    if(readFileSync(output,'utf8')!==value)
      throw Error('AMOK_EXISTING_PREFLIGHT_DIFFERENT');
  }else writeFileSync(output,value,{flag:'wx',mode:0o600});
  return {result,output};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  const dir=args.find(x=>x.startsWith('--private-dir='))?.slice(14);
  const source=args.find(x=>x.startsWith('--source='))?.slice(9)??null;
  if(args.length<1||args.length>2||args.some(x=>!x.startsWith('--private-dir=')&&!x.startsWith('--source='))||
     !dir||args.filter(x=>x.startsWith('--private-dir=')).length!==1){
    process.stderr.write('Usage: node scripts/prepare-amok-v4-audio-release.mjs --private-dir=/ABS/PATH [--source=/ABS/V4.json]\n');
    process.exitCode=2;
  }else{
    try{
      const {result,output}=releasePreflight({dir,source});
      process.stdout.write('AMOK_PRIVATE_PREFLIGHT_OK\n'+
        '7_MP3_SHA256_AND_DECODING_OK\nINTEGRAL_AND_ZIP_SHA256_OK\n'+
        'SOURCE_VERIFIED='+result.sourceVerified+'\n'+
        'NOT_PUBLISHED=true\n'+
        'OUTPUT='+output+'\n');
    }catch(err){
      process.stderr.write('AMOK_PREFLIGHT_BLOCKED: '+err.message+'\n');
      process.exitCode=1;
    }
  }
}
