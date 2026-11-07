/** Offline cost evidence from public historical text manifests; never opens MP3s or an API. */
import {readFile} from 'node:fs/promises';import {join} from 'node:path';import {pathToFileURL} from 'node:url';
import {coralTtsLoadScenarios} from './coral-tts-load-scenarios.mjs';import {coralFragmentPlan} from './coral-tts-checkpoints.mjs';
import {audioSha} from './coral-tts-audio.mjs';import {coralFragmentCostPlan} from './coral-tts-cost-plan.mjs';
export async function coralFragmentCostReport(root=process.cwd()){
 const reports=[];for(const scenario of await coralTtsLoadScenarios(root)){
  const guide=JSON.parse(await readFile(join(root,'src/data/atelier-recette-guides',scenario.reference.replace(/-v[23]\.json$/,'.json')),'utf8'));
  const texts=[guide.audio.intro,...guide.phases.map(p=>p.audioScript)].map(t=>Array.from({length:scenario.multiplier},()=>t).join(' '));
  const fragments=texts.flatMap((text,chapter)=>coralFragmentPlan({text,sha256:audioSha(text)}).map(f=>({chapter,seconds:scenario.durations[chapter]*f.text.length/text.length,text_tokens:Math.ceil(f.text.length/3)})));
  const plan=coralFragmentCostPlan({fragments}),half=Math.floor(fragments.length/2),estimate=f=>Math.ceil((f.text_tokens+200)*0.6+f.text_tokens*2.4+f.seconds*400);reports.push({scenario:scenario.name,seconds:scenario.durations.reduce((a,b)=>a+b,0),plan,
   interruption_example:{after_confirmed_fragments:half,estimated_before_interruption_microusd:fragments.slice(0,half).reduce((n,f)=>n+estimate(f),0),remaining_estimate_microusd:fragments.slice(half).reduce((n,f)=>n+estimate(f),0),
    observed_actual_billing_microusd:null,reason:'No actual provider request or receipt. Fractional estimates are not actual charges.'}});
 }return reports;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await coralFragmentCostReport(),null,2));
