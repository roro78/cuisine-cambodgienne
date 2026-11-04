import {constants,openSync,closeSync,fstatSync,readFileSync,lstatSync} from 'node:fs';

/** Private regular file opened without following a link. Never logs IO details. */
export function readPrivateRuntimeSecret(file,{minBytes,maxBytes,unavailable,invalid,validate}){
  let fd,raw;
  try{
    if(typeof file!=='string'||!file)throw Error('FILE');
    const before=lstatSync(file);
    if(!before.isFile()||before.isSymbolicLink())throw Error('FILE');
    fd=openSync(file,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
    const info=fstatSync(fd);
    if(!info.isFile()||info.size<minBytes||info.size>maxBytes
      ||before.dev!==info.dev||before.ino!==info.ino
      ||(process.platform!=='win32'&&((info.mode&0o077)!==0
        ||info.uid!==process.geteuid())))throw Error('FILE');
    raw=readFileSync(fd,'utf8');
  }catch{throw Error(unavailable);}
  finally{if(fd!==undefined)closeSync(fd);}
  const value=raw.replace(/\r?\n$/,'');
  if(!validate(value))throw Error(invalid);
  return value;
}

export function readEditorialJobToken(env,bindHost){
  const file=env.CDC_EDITORIAL_JOB_TOKEN_FILE,value=env.CDC_EDITORIAL_JOB_TOKEN;
  if(file&&value)throw Error('JOB_TOKEN_AMBIGUOUS');
  if(file)return readPrivateRuntimeSecret(file,{minBytes:32,maxBytes:514,
    unavailable:'JOB_TOKEN_UNAVAILABLE',invalid:'JOB_TOKEN_INVALID',
    validate:s=>/^[\x21-\x7e]{32,512}$/.test(s)&&!s.startsWith('sk-')});
  // Retain the historical loopback CLI. Container-wide binding requires a file.
  if(bindHost!=='127.0.0.1')throw Error('JOB_TOKEN_FILE_REQUIRED');
  if(typeof value!=='string'||!/^[\x21-\x7e]{32,512}$/.test(value)||value.startsWith('sk-'))throw Error('JOB_TOKEN_INVALID');
  return value;
}
