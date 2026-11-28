#!/usr/bin/env node
/**
 * External read-only delivery check. Use only a verified operator-selected HTTPS
 * directory that serves the assets/ child of the offline package.
 * A Meta-ExternalAgent profile is a diagnostic, not proof of actual Meta ingestion.
 */
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const SHA=/^[a-f0-9]{64}$/;
const MAX_JPEG=8*1024*1024;
const ensure=(condition,message)=>{if(!condition)throw Error(message);};
const profiles=['CuisineDuCambodge-MediaProbe/1.0','Meta-ExternalAgent'];
async function verifyBytes(response,entry){
  ensure(response.status===200&&!response.redirected,'media_http_'+response.status+':'+entry.sha256);
  ensure(response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()==='image/jpeg','media_mime_invalid:'+entry.sha256);
  const length=response.headers.get('content-length');
  ensure(length===null||Number(length)===entry.bytes,'media_length_header_mismatch:'+entry.sha256);
  ensure(response.body,'media_body_missing:'+entry.sha256);
  const reader=response.body.getReader();
  const hash=createHash('sha256');
  let size=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      size+=value.byteLength;
      ensure(size<=entry.bytes&&size<=MAX_JPEG,'media_body_too_large:'+entry.sha256);
      hash.update(value);
    }
    ensure(size===entry.bytes,'media_body_length_mismatch:'+entry.sha256);
    ensure(hash.digest('hex')===entry.sha256,'media_remote_digest_mismatch:'+entry.sha256);
  }finally{
    await reader.cancel().catch(()=>{});
    reader.releaseLock();
  }
}

export async function probeSocialMedia({manifest,baseUrl,fetchImpl=fetch}){
  ensure(manifest?.product==='cuisine-du-cambodge'&&manifest.schemaVersion===1&&
    Array.isArray(manifest.entries)&&manifest.entries.length>0&&manifest.entries.length<=1000,'media_manifest_invalid');
  const base=new URL(baseUrl);
  ensure(base.protocol==='https:'&&!base.username&&!base.password&&!base.search&&!base.hash&&
    base.pathname.endsWith('/'),'media_probe_base_invalid');
  const entries=new Map();
  // Validate all entries before the first network call.
  for(const entry of manifest.entries){
    ensure(SHA.test(entry?.sha256??'')&&entry.path==='assets/'+entry.sha256+'.jpg'&&
      Number.isSafeInteger(entry.bytes)&&entry.bytes>0&&entry.bytes<=MAX_JPEG,'media_manifest_entry_invalid');
    const prior=entries.get(entry.sha256);
    ensure(!prior||prior.bytes===entry.bytes,'media_manifest_conflict');
    entries.set(entry.sha256,entry);
  }
  const results=[];
  for(const entry of entries.values()){
    const url=new URL(entry.sha256+'.jpg',base).href;
    for(const profile of profiles){
      const response=await fetchImpl(url,{method:'GET',redirect:'error',
        signal:AbortSignal.timeout(15000),headers:{'User-Agent':profile,'Accept':'image/jpeg','Accept-Encoding':'identity'}});
      try{
        await verifyBytes(response,entry);
        results.push({sha256:entry.sha256,url,profile,status:200});
      }finally{
        if(response.body&&!response.body.locked)await response.body.cancel().catch(()=>{});
      }
    }
  }
  return results;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  try{
    ensure(process.argv.length===4,'Usage: node scripts/probe-social-media.mjs /path/to/manifest.json https://verified-host/path/');
    const manifest=JSON.parse(await readFile(process.argv[2],'utf8'));
    const results=await probeSocialMedia({manifest,baseUrl:process.argv[3]});
    for(const result of results)console.log('SOCIAL_MEDIA_HTTP_OK',result.sha256,result.profile);
    console.log('SOCIAL_MEDIA_PROBE_OK',results.length,'read-only checks; actual Meta ingestion not proven');
  }catch(error){console.error(error.message);process.exitCode=1;}
}
