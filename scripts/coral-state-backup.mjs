/** Offline encrypted state backup. No provider, Docker socket, database or media access. */
import {createCipheriv,createDecipheriv,randomBytes,createHash} from 'node:crypto';
import {lstat,readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readPrivateRuntimeSecret} from './private-runtime-secret.mjs';

const FORMAT='cdc-coral-state-backup-v1',AAD=Buffer.from(FORMAT);
const MAX_BYTES=32*1024*1024,MAX_ARCHIVE=64*1024*1024,MAX_ENTRIES=4096;
const roots=['jobs','budget','config'];
const configFiles=new Set(['compose.yaml','images.lock.json','runtime.json','release.json']);
const sha=data=>createHash('sha256').update(data).digest('hex');
function key(file){return Buffer.from(readPrivateRuntimeSecret(file,{
  minBytes:64,maxBytes:66,unavailable:'CORAL_BACKUP_KEY_UNAVAILABLE',
  invalid:'CORAL_BACKUP_KEY_INVALID',validate:x=>/^[a-f0-9]{64}$/.test(x)}),'hex');}
function owned(s){return process.platform==='win32'||((s.mode&0o077)===0&&s.uid===process.geteuid());}
async function directory(path){const s=await lstat(path);
  if(!s.isDirectory()||s.isSymbolicLink()||!owned(s))throw Error('CORAL_BACKUP_DIRECTORY');}
function safePath(name){
  if(typeof name!=='string'||name.includes('\\')||name.includes('\0')||isAbsolute(name)
    ||name.split('/').some(x=>!x||x==='.'||x==='..')||name.split('/').length>8
    ||!roots.includes(name.split('/')[0]))throw Error('CORAL_BACKUP_PATH');
  if(name.startsWith('config/')&&(!configFiles.has(name.slice(7))||name.slice(7).includes('/')))
    throw Error('CORAL_BACKUP_CONFIG');
}
async function collect(root){
  const entries=[];let bytes=0;
  async function walk(dir){
    for(const name of (await readdir(dir)).sort()){
      const file=join(dir,name),s=await lstat(file),path=relative(root,file).split('\\').join('/');
      safePath(path);
      if(s.isSymbolicLink()||!owned(s))throw Error('CORAL_BACKUP_PERMISSIONS');
      if(s.isDirectory()){
        entries.push({path,type:'directory'});await walk(file);
      }else{
        if(!s.isFile()||s.nlink!==1||s.size>1024*1024)throw Error('CORAL_BACKUP_FILE');
        const data=await readFile(file),after=await lstat(file);
        if(s.ino!==after.ino||s.size!==after.size||s.mtimeMs!==after.mtimeMs)
          throw Error('CORAL_BACKUP_STATE_CHANGED');
        bytes+=data.length;if(bytes>MAX_BYTES)throw Error('CORAL_BACKUP_SIZE');
        entries.push({path,type:'file',sha256:sha(data),data:data.toString('base64')});
      }
      if(entries.length>MAX_ENTRIES)throw Error('CORAL_BACKUP_SIZE');
    }
  }
  await directory(root);await walk(root);
  for(const name of ['jobs','budget'])if(!entries.some(e=>e.path===name&&e.type==='directory'))
    throw Error('CORAL_BACKUP_STATE');
  return entries;
}
function offline(confirmed){if(confirmed!==true)throw Error('CORAL_BACKUP_OFFLINE_REQUIRED');}
export async function backupCoralState({stateDir,archive,keyFile,offline:confirmed}){
  offline(confirmed);const root=resolve(stateDir),out=resolve(archive);
  if(out===root||!relative(root,out).startsWith('..')&&!isAbsolute(relative(root,out)))
    throw Error('CORAL_BACKUP_ARCHIVE_LOCATION');
  await directory(dirname(out));
  const entries=await collect(root);
  // Detect additions, removals and byte changes during the offline snapshot.
  if(JSON.stringify(entries)!==JSON.stringify(await collect(root)))throw Error('CORAL_BACKUP_STATE_CHANGED');
  const plain=Buffer.from(JSON.stringify({format:FORMAT,createdAt:new Date().toISOString(),entries}));
  const material=key(keyFile),iv=randomBytes(12);
  try{
    const cipher=createCipheriv('aes-256-gcm',material,iv);cipher.setAAD(AAD);
    const data=Buffer.concat([cipher.update(plain),cipher.final()]);
    const sealed=JSON.stringify({format:FORMAT,iv:iv.toString('hex'),
      tag:cipher.getAuthTag().toString('hex'),data:data.toString('base64')});
    await writeFile(out,sealed,{flag:'wx',mode:0o600});
    return {status:'BACKUP_CREATED',entries:entries.length,archiveSha256:sha(sealed)};
  }finally{material.fill(0);plain.fill(0);}
}
export async function restoreCoralState({stateDir,archive,keyFile,offline:confirmed}){
  offline(confirmed);const target=resolve(stateDir);await directory(dirname(target));
  try{await lstat(target);throw Error('CORAL_RESTORE_TARGET_EXISTS');}
  catch(e){if(e.code!=='ENOENT')throw e;}
  const s=await lstat(archive);
  if(!s.isFile()||s.isSymbolicLink()||!owned(s)||s.size>MAX_ARCHIVE)throw Error('CORAL_BACKUP_ARCHIVE');
  const sealed=await readFile(archive,'utf8');let manifest;const material=key(keyFile);
  try{
    const obj=JSON.parse(sealed);
    if(obj.format!==FORMAT||!(/^[a-f0-9]{24}$/.test(obj.iv))||!(/^[a-f0-9]{32}$/.test(obj.tag))
      ||typeof obj.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(obj.data))throw Error('FORMAT');
    const decipher=createDecipheriv('aes-256-gcm',material,Buffer.from(obj.iv,'hex'));
    decipher.setAAD(AAD);decipher.setAuthTag(Buffer.from(obj.tag,'hex'));
    const plain=Buffer.concat([decipher.update(Buffer.from(obj.data,'base64')),decipher.final()]);
    try{manifest=JSON.parse(plain.toString('utf8'));}finally{plain.fill(0);}
  }catch{throw Error('CORAL_BACKUP_INVALID');}finally{material.fill(0);}
  if(manifest.format!==FORMAT||!Array.isArray(manifest.entries)||manifest.entries.length>MAX_ENTRIES)
    throw Error('CORAL_BACKUP_MANIFEST');
  const seen=new Set();let bytes=0;
  for(const e of manifest.entries){
    safePath(e.path);if(seen.has(e.path))throw Error('CORAL_BACKUP_MANIFEST');seen.add(e.path);
    if(!['file','directory'].includes(e.type))throw Error('CORAL_BACKUP_MANIFEST');
    if(e.type==='file'){
      if(typeof e.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(e.data))throw Error('CORAL_BACKUP_MANIFEST');
      const data=Buffer.from(e.data,'base64');bytes+=data.length;
      if(sha(data)!==e.sha256||data.length>1024*1024||bytes>MAX_BYTES)throw Error('CORAL_BACKUP_MANIFEST');
    }
  }
  if(!['jobs','budget'].every(p=>manifest.entries.some(e=>e.path===p&&e.type==='directory')))
    throw Error('CORAL_BACKUP_MANIFEST');
  // Exclusive new target: never overwrite a live queue or rewind an existing ledger.
  await mkdir(target,{mode:0o700});await mkdir(join(target,'jobs'),{mode:0o700});
  const seal=join(target,'jobs','.restore-review-required');
  await writeFile(seal,JSON.stringify({reviewRequired:true,archiveSha256:sha(sealed)}),{flag:'wx',mode:0o600});
  for(const e of manifest.entries.filter(e=>e.type==='directory').sort((a,b)=>a.path.length-b.path.length)){
    if(e.path==='jobs')continue;await mkdir(join(target,e.path),{mode:0o700});
  }
  for(const e of manifest.entries.filter(e=>e.type==='file')){
    // A previous review seal remains a seal; do not replace the new receipt.
    if(e.path==='jobs/.restore-review-required')continue;
    await writeFile(join(target,e.path),Buffer.from(e.data,'base64'),{flag:'wx',mode:0o600});
  }
  return {status:'RESTORED_REVIEW_REQUIRED',entries:manifest.entries.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{
    const [operation,...args]=process.argv.slice(2),values={};
    for(let i=0;i<args.length;i++){
      if(args[i]==='--offline'){values.offline=true;continue;}
      const names={'--state-dir':'stateDir','--archive':'archive','--key-file':'keyFile'};
      if(!names[args[i]]||values[names[args[i]]]||!args[i+1]||args[i+1].startsWith('--'))throw Error('ARGS');
      values[names[args[i]]]=args[++i];
    }
    if(!['backup','restore'].includes(operation)||!values.stateDir||!values.archive||!values.keyFile)throw Error('ARGS');
    console.log(JSON.stringify(await (operation==='backup'?backupCoralState:restoreCoralState)(values)));
  }catch{process.stderr.write('CORAL_BACKUP_REFUSED\n');process.exitCode=1;}
}
