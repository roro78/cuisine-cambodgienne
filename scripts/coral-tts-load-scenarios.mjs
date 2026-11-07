/** Read only historic JSON manifests; never opens or modifies their MP3s. */
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
export async function coralTtsLoadScenarios(repo=process.cwd()){
 const folder=join(repo,'src/data/atelier-recette-audio'),rows=[];
 for(const file of (await readdir(folder)).filter(x=>x.endsWith('-v3.json')||x==='lok-lak-v2.json')){
  const m=JSON.parse(await readFile(join(folder,file),'utf8'));
  if(m.chapters?.length!==7||!Number.isFinite(m.durationSec))throw Error('TTS_LOAD_REFERENCE');
  rows.push({file,duration:m.durationSec,durations:m.chapters.map(c=>c.endSec-c.startSec)});
 }
 if(rows.length<2)throw Error('TTS_LOAD_REFERENCE');rows.sort((a,b)=>a.duration-b.duration);
 const representative=rows[Math.floor(rows.length/2)],longest=rows.at(-1);
 const scenarios=[{name:'representative',reference:representative.file,multiplier:1,durations:representative.durations},
  {name:'bounded-adverse',reference:longest.file,multiplier:2,durations:longest.durations.map(s=>s*2)}];
 for(const s of scenarios){
  const guide=JSON.parse(await readFile(join(repo,'src/data/atelier-recette-guides',s.reference.replace(/-v[23]\.json$/,'.json')),'utf8'));
  const texts=[guide.audio.intro,...guide.phases.map(p=>p.audioScript)];
  if(texts.length!==7||texts.some(t=>typeof t!=='string'||!t))throw Error('TTS_LOAD_SCRIPT_REFERENCE');
  s.script_words=texts.reduce((n,t)=>n+t.trim().split(/\s+/).length,0)*s.multiplier;
  s.script_chars=texts.reduce((n,t)=>n+t.length,0)*s.multiplier;
  s.text_tokens_estimate=Math.ceil(s.script_chars/3); // Disclosed heuristic, NOT a token/billing ceiling.
 }
 return scenarios;
}
