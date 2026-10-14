import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Reproducible PREVIEW lab run. Lighthouse scores are not real-user Core Web Vitals.
// The preview intentionally uses noindex; its SEO score cannot establish that
// the future public / route is indexed.
const PORT=4352;
const ROOT='http://127.0.0.1:'+PORT;
const URL=ROOT+'/v17-accueil-preview/';
const OUT='artifacts/v17-lighthouse-mobile.json';
const SUMMARY='artifacts/v17-lighthouse-mobile-summary.json';
const astroCli=fileURLToPath(new URL('../node_modules/astro/astro.js',import.meta.url));
fs.mkdirSync('artifacts',{recursive:true});
const server=spawn(process.execPath,[astroCli,'preview','--host','127.0.0.1','--port',String(PORT)],{
  stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32
});
let serverLogs='';
for(const stream of [server.stdout,server.stderr]){
  stream.on('data',buf=>{serverLogs+=buf.toString().slice(-1200);});
}
async function ready(){
  for(let i=0;i<90;i++){
    if(server.exitCode!==null)throw Error('Astro preview stopped: '+serverLogs);
    try{
      const response=await fetch(URL,{signal:AbortSignal.timeout(1800)});
      if(response.ok)return;
    }catch{}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw Error('Astro preview did not start: '+serverLogs);
}
async function lighthouse(){
  const args=[
    '--yes','lighthouse@12',URL,
    '--only-categories=performance,accessibility,seo',
    '--form-factor=mobile',
    '--throttling-method=simulate',
    '--max-wait-for-load=60000',
    '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
    '--output=json','--output-path='+OUT,'--quiet'
  ];
  const env={...process.env,CHROME_PATH:process.env.CHROME_BIN || process.env.CHROME_PATH};
  const command=process.platform==='win32'?'npx.cmd':'npx';
  const child=spawn(command,args,{
    env,stdio:['ignore','pipe','pipe'],signal:AbortSignal.timeout(240_000)
  });
  let captured='';
  for(const stream of [child.stdout,child.stderr]){
    stream.on('data',buf=>{captured+=buf.toString();if(captured.length>100_000)captured=captured.slice(-100_000);});
  }
  const status=await new Promise((resolve,reject)=>{
    child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));
  });
  assert.equal(status.code,0,'Lighthouse execution failed: '+captured.slice(-6000));
}
try{
  await ready();
  await lighthouse();
  const report=JSON.parse(fs.readFileSync(OUT,'utf8'));
  assert.equal(report.finalUrl,URL,'Lighthouse must test the isolated V17 preview');
  const categories=Object.fromEntries(['performance','accessibility','seo'].map(key=>[
    key,Math.round((report.categories?.[key]?.score??0)*100)
  ]));
  const numeric=id=>{
    const audit=report.audits?.[id];
    return Number.isFinite(audit?.numericValue)?Math.round(audit.numericValue):null;
  };
  const summary={
    page:'V17 private noindex preview (not the public homepage)',
    audit:'Lighthouse mobile / simulated lab conditions',
    lighthouseVersion:report.lighthouseVersion,
    requestedUrl:URL,
    categories,
    metrics:{
      firstContentfulPaintMs:numeric('first-contentful-paint'),
      largestContentfulPaintMs:numeric('largest-contentful-paint'),
      speedIndexMs:numeric('speed-index'),
      totalBlockingTimeMs:numeric('total-blocking-time'),
      cumulativeLayoutShift:report.audits?.['cumulative-layout-shift']?.numericValue??null
    },
    seriousFindings:(report.categories?.accessibility?.auditRefs||[])
      .filter(ref=>ref.weight>0 && (report.audits?.[ref.id]?.score??1)<.9)
      .map(ref=>({id:ref.id,title:report.audits?.[ref.id]?.title,
        score:report.audits?.[ref.id]?.score})),
    note:'Scores are CI lab observations, NOT CrUX or field INP. Noindex is deliberate and penalizes preview SEO.'
  };
  fs.writeFileSync(SUMMARY,JSON.stringify(summary,null,2)+'\n');
  console.log('V17 LIGHTHOUSE LAB '+JSON.stringify(summary));
}catch(error){
  console.error('V17 Lighthouse run failed:',error.stack||error);
  process.exitCode=1;
}finally{
  if(server.pid && process.platform!=='win32'){
    try{process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM');}
  }else server.kill('SIGTERM');
}
