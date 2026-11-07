/** Current Studio authority over the existing HTTPS port. Never caches an allow. */
import {request as httpsRequest} from 'node:https';
import {randomBytes} from 'node:crypto';
import {readPrivateRuntimeSecret} from './private-runtime-secret.mjs';
import {validateTtsRequest} from './coral-tts-jobs.mjs';
export const AUTHORITY_CONTRACT='cdc-coral-tts-authority-check-v1';
export function ttsAuthorityProjection(request){
 validateTtsRequest(request);
 return {...request,chapters:request.chapters.map(({id,sha256})=>({id,sha256}))};
}
export function createStudioTtsAuthority({endpoint,tokenFile,timeoutMs=3000,testOnly=false,testCa}={}){
 const url=new URL(endpoint);
 const loopback=url.hostname==='127.0.0.1';
 if(url.protocol!=='https:'||url.username||url.password||url.hash
  ||url.pathname!=='/gestion-contenus/'||url.search!=='?tts_authority=1'
  ||(!loopback&&(url.hostname!=='www.cuisine-du-cambodge.com'||(url.port&&url.port!=='443')))
  ||(loopback&&(!testOnly||!testCa))||(!loopback&&(testOnly||testCa))
  ||!tokenFile||!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>5000)throw Error('TTS_AUTHORITY_CONFIG');
 return async request=>{
  try{
   const projection=ttsAuthorityProjection(request),challenge=randomBytes(32).toString('hex');
   // Read on EACH check so removal/rotation fails closed immediately.
   const token=readPrivateRuntimeSecret(tokenFile,{minBytes:64,maxBytes:66,
    unavailable:'TTS_AUTHORITY_SECRET',invalid:'TTS_AUTHORITY_SECRET',validate:s=>/^[a-f0-9]{64}$/.test(s)});
   const body=JSON.stringify({contract:AUTHORITY_CONTRACT,challenge,request:projection});
   if(Buffer.byteLength(body)>6000)return false;
   const response=await new Promise((resolve,reject)=>{
    const req=httpsRequest(url,{method:'POST',...(testCa?{ca:testCa}:{}),
     headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),
      Accept:'application/json','Cache-Control':'no-store'},signal:AbortSignal.timeout(timeoutMs)},res=>{
      res.on('error',reject);
      const chunks=[];let size=0;
      if(res.statusCode!==200||!/^application\/json(?:;|$)/i.test(res.headers['content-type']||'')
       ||!/(?:^|[,\s])no-store(?:$|[,\s])/.test(res.headers['cache-control']||'')
       ||(res.headers['content-encoding']&&res.headers['content-encoding']!=='identity')){res.destroy();reject(Error('TTS_AUTHORITY_HTTP'));return;}
      res.on('data',b=>{size+=b.length;if(size>2048){res.destroy();reject(Error('TTS_AUTHORITY_SIZE'));}else chunks.push(b);});
      res.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{reject(Error('TTS_AUTHORITY_JSON'));}});
     });
    req.on('error',reject);req.end(body);
   });
   return Object.keys(response).length===4&&response.contract===AUTHORITY_CONTRACT
    &&response.challenge===challenge&&response.request_id===request.request_id&&response.authorized===true;
  }catch{return false;}
 };
}
