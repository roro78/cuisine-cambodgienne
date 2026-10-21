#!/usr/bin/env node
/**
 * Isolated adapter to the existing Render IA-Coach /api/tts Coral backend.
 * No new TTS provider, API key or change to Render, Squaia, n8n or Meta.
 * One old-track-safe seven-segment recording per new cooking-workshop blueprint.
 *
 * Commands:
 *   node scripts/bridge-cooking-workshops-coral.mjs --atelier=lok-lak --check
 *   node scripts/bridge-cooking-workshops-coral.mjs --atelier=lok-lak --one=intro|installer|preparer|assembler|maitriser|rectifier|terminer
 *   node scripts/bridge-cooking-workshops-coral.mjs --atelier=lok-lak --assemble
 *
 * Explicit --one alone makes one TTS request, never in CI.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, join, dirname } from 'node:path';
import { validateBlueprintFile, PHASE_IDS } from './check-workshop-blueprints.mjs';
import { buildCookingAudioStoryboard } from './export-cooking-workshop-audio.mjs';

const args=process.argv.slice(2);
const readArg=(key)=>args.find(x=>x.startsWith('--'+key+'='))?.slice(key.length+3);
const recipe=readArg('atelier');
const edition=readArg('edition');
const approvedV3=edition==='approved-v3';
const partArg=readArg('part');
if(partArg!==undefined && (!approvedV3 || !/^[1-9][0-9]*$/.test(partArg)))throw Error('Le contrôle --part est réservé à V3 et attend un index positif.');
if(edition && !approvedV3)throw Error('Édition audio inconnue, génération interdite.');
const allowed=new Set(['kroeung-jaune','lok-lak','samlor-machu','num-banh-chok','kuy-teav','bai-sach-chrouk']);
if(!allowed.has(recipe))throw Error('Seuls les six ateliers-recettes approuvés pour le pilote sont autorisés.');
const modes=['--check','--plan','--assemble',...['intro',...PHASE_IDS].map(id=>'--one='+id)];
const selected=args.filter(x=>modes.includes(x));
if(selected.length!==1||args.length!==(edition?3:2)+(partArg!==undefined?1:0))throw Error('Arguments refusés, pas de synthèse autorisée.');
if(approvedV3 && mode.startsWith('--one=') && partArg===undefined)
 throw Error('STOP QUOTA : en V3, --part=N obligatoire pour isoler chaque appel payant.');
if(partArg!==undefined && !mode.startsWith('--one='))throw Error('--part n’est autorisé que pour une piste unique.');
const mode=selected[0];
const path='src/data/atelier-recette-guides/'+recipe+'.json';
const {data:guide,errors}=await validateBlueprintFile(path);
if(errors.length)throw Error('Contrat culinaire invalide :\n- '+errors.join('\n- '));
if(mode!=='--plan'&&(guide.status!=='draft'||guide.audio.status!=='script_only'))throw Error('Cet atelier a déjà une narration ou est sorti du statut brouillon : STOP.');
const plan=buildCookingAudioStoryboard(guide);
if(approvedV3 && (recipe==='lok-lak'||!guide.audio.supersededV2Asset || guide.audio.storyboardVersion!==2))
 throw Error('V3 réservée aux cinq ateliers corrigés, Lok Lak V2 protégé.');
if(plan.numberOfChapters!==7||plan.chapters.some((c,i)=>c.id!==(i===0?'intro':PHASE_IDS[i-1])))throw Error('Chapitres non alignés.');
const voiceTexts=plan.chapters.map(c=>c.text);
const forbiddenCulinaryVocabulary=/(?<!\p{L})(?:fabriqu\p{L}*|fabrication\p{L}*|constru\p{L}*|chantier\p{L}*|poste)(?!\p{L})/iu;
if(forbiddenCulinaryVocabulary.test(guide.title+' '+voiceTexts.join(' ')))
 throw Error('Texte vocal non conforme au vocabulaire culinaire : corriger les sept chapitres AVANT Coral.');
const actualVoiceScriptSha256=createHash('sha256').update(JSON.stringify(voiceTexts)).digest('hex');
const requiresTextApproval=mode.startsWith('--one=')||mode==='--assemble';
if(requiresTextApproval && !(guide.review?.recipeValidated===true &&
 guide.review?.editorialValidated===true &&
 guide.audio?.editorialTextApproved===true &&
 guide.audio?.approvedScriptSha256===actualVoiceScriptSha256))
 throw Error('STOP CORAL : recette et sept textes non valides explicitement. Aucun appel TTS sans accord editorial et empreinte du script approuve.');

const v2=guide.audio.storyboardVersion===2;
// Lok Lak V2 is immutable: recording already listened to and approved.
// Only the five non-Lok-Lak blueprints explicitly upgraded to V2 are eligible.
if(recipe==='lok-lak' && mode!=='--plan')throw Error('Lok Lak V2 approuvé : toute génération est interdite.');
if(!v2)throw Error('Atelier non migré vers la narration immersive V2 : aucune génération autorisée.');
if(voiceTexts.some(t=>typeof t!=='string'||t.length<90||t.length>(v2?4500:1200)))
  throw Error('Narration absente ou excessivement longue.');
// The TTS backend has a hard timeout per HTTP request. Split only for generation;
// one final MP3 still has the original seven navigable chapter boundaries.
function splitVoiceForTts(text,maxChars=480){
  const sentences=String(text).trim().split(/(?<=[.!?…])\s+/u);
  const pieces=[];
  let current='';
  const flush=()=>{if(current.trim())pieces.push(current.trim());current='';};
  for(const sentence of sentences){
    if(!sentence.trim())continue;
    if(sentence.length>maxChars){
      flush();
      const words=sentence.split(/\s+/u);
      for(const word of words){
        if(word.length>maxChars)throw Error('Mot incompatible avec la synthèse segmentée.');
        if(current&&current.length+word.length+1>maxChars)flush();
        current+=(current?' ':'')+word;
      }
      flush();
    } else {
      if(current&&current.length+sentence.length+1>maxChars)flush();
      current+=(current?' ':'')+sentence;
    }
  }
  flush();
  if(!pieces.length||pieces.some(x=>x.length>maxChars))throw Error('Sous-segmentation audio V2 invalide.');
  return pieces;
}
const tmp=resolve('.tmp-cooking-coral',guide.slug,approvedV3?'v3':v2?'v2':'v1');
const filename=approvedV3?'atelier-coral-v3.mp3':v2?'atelier-coral-v2.mp3':'atelier-coral.mp3';
const output=resolve('public/audio/workshops',guide.slug,filename);
const manifestPath=resolve('src/data/atelier-recette-audio',recipe+(approvedV3?'-v3':v2?'-v2':'')+'.json');
const tracks=plan.chapters.map((c,i)=>{
  if(!v2)return [join(tmp,c.id+'.mp3')];
  return splitVoiceForTts(voiceTexts[i]).map((text,part)=>{
    const sourceTag=createHash('sha256').update(text).digest('hex').slice(0,16);
    return join(tmp,c.id+'-part-'+String(part+1).padStart(2,'0')+'-'+sourceTag+'.mp3');
  });
});
const chunks=tracks.flat();
if(v2){
 const normalized=(t)=>t.replace(/\s+/g,' ').trim();
 for(let i=0;i<plan.chapters.length;i++){
   const segments=splitVoiceForTts(voiceTexts[i]);
   if(normalized(segments.join(' '))!==normalized(voiceTexts[i]))
     throw Error('Perte de texte lors du découpage du chapitre '+plan.chapters[i].id);
 }
}
const fileSha=(path)=>createHash('sha256').update(readFileSync(path)).digest('hex');
function assertMp3(f){
 if(!existsSync(f)||statSync(f).size<1024)throw Error('MP3 absent ou vide : '+f);
 const b=readFileSync(f);
 if(!(b.subarray(0,3).toString()==='ID3'||(b[0]===0xff&&(b[1]&0xe0)===0xe0)))throw Error('Signature MP3 invalide : '+f);
}
function measure(f){
 const result=execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',f],{encoding:'utf8'});
 const n=Number(result.trim());
 if(!Number.isFinite(n)||n<=0)throw Error('Durée ffprobe invalide : '+f);
 return n;
}
if(mode==='--plan'){
 console.log('CORAL_OFFLINE_PLAN '+guide.slug+' v'+(approvedV3?3:v2?2:1)+' '+chunks.length+' segments '+tracks.map((x,i)=>plan.chapters[i].id+':'+x.length).join(' '));
}else if(mode==='--check'){
 if(existsSync(output)||existsSync(manifestPath))throw Error('Le fichier final existe déjà ; refuser toute double génération.');
 const markers=chunks.filter(f=>existsSync(f+'.uncertain.json'));
 if(markers.length)throw Error('STOP QUOTA : '+markers.length+' réponse(s) audio incertaine(s), inspection obligatoire avant une nouvelle synthèse.');
 // The superseded short V1 recording has been deliberately removed.
 // The target MP3 and manifest still block any duplicate generation above.
 console.log('CORAL_GUIDE_CONTRACT_OK '+guide.slug+' 7 chapters, '+chunks.length+' saved parts planned; 0 paid request.');
}else if(mode.startsWith('--one=')){
 if(existsSync(output)||existsSync(manifestPath))throw Error('Guide déjà assemblé ; aucune régénération autorisée.');
 const name=mode.slice('--one='.length);
 const i=plan.chapters.findIndex(c=>c.id===name);
 if(i<0)throw Error('Chapitre inconnu');
 mkdirSync(tmp,{recursive:true});
 const segments=v2?splitVoiceForTts(voiceTexts[i]):[voiceTexts[i]];
 if(partArg!==undefined && Number(partArg)>segments.length)throw Error('Partie inexistante ; aucun appel payant.');
 const indexes=partArg!==undefined?[Number(partArg)-1]:segments.map((_,i)=>i);
 for(const index of indexes){
   const track=tracks[i][index];
   const uncertain=track+'.uncertain.json';
   if(existsSync(uncertain))throw Error('STOP QUOTA : tentative précédente au résultat incertain pour '+guide.slug+'/'+name+' part '+(index+1)+'. Inspection humaine requise avant toute réémission.');
   if(existsSync(track)){
     assertMp3(track);measure(track);
     console.log('CORAL_ALREADY_SAVED_SKIP '+guide.slug+'/'+name+' part '+(index+1)+'/'+segments.length);
     continue;
   }
   const backend='https://render-iacoach-backend.onrender.com/api/tts';
   const controller=new AbortController();
   // The backend is permitted to fail fast; never retransmit a request with unknown result.
   const timeout=setTimeout(()=>controller.abort(),approvedV3?90000:v2?180000:100000);
   let requestDispatched=false;
   try{
     requestDispatched=true;
     const response=await fetch(backend,{
       method:'POST',
       headers:{'Content-Type':'application/json',Accept:'audio/mpeg', ...(approvedV3?{'X-Cuisine-Coral-Client':'approved-v3'}:{})},
       body:JSON.stringify({
         text:segments[index],voice:'coral',speed:0.93,format:'mp3',
         instructions:'Narration culinaire naturelle en français de France. Voix féminine Coral chaleureuse et spontanée. Expliquer le geste comme une vraie cuisinière encourageante, avec un rythme convivial. Ne pas inventer de quantités ni prétendre interagir en direct.'
       }),
       signal:controller.signal
     });
     if(!response.ok)throw Error('Render IA-Coach /api/tts HTTP '+response.status+' sur '+guide.slug+'/'+name+' part '+(index+1));
     if(!/audio\/(mpeg|mp3)/i.test(response.headers.get('content-type')||''))throw Error('Réponse Render non audio.');
     const bytes=Buffer.from(await response.arrayBuffer());
     if(bytes.length<1024||!(bytes.subarray(0,3).toString()==='ID3'||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0)))
       throw Error('MP3 invalide fourni par Render');
     const part=track+'.partial';
     if(existsSync(part))throw Error('Piste partielle antérieure à inspecter avant génération.');
     writeFileSync(part,bytes,{flag:'wx'});
     renameSync(part,track);
     assertMp3(track);
     console.log('CORAL_TRACK_SAVED '+guide.slug+'/'+name+' part '+(index+1)+'/'+segments.length+' duration='+measure(track).toFixed(3)+'s');
     // Respect potential backend rate limits; one attempt per segment, never
     // retry an uncertain TTS response automatically after a timeout.
     if(v2)await new Promise(resolve=>setTimeout(resolve,20000));
   }catch(error){
     // Persist an immutable uncertainty marker for every request that could have
     // reached the billing provider. The CI artifact must preserve this marker.
     // In particular, a 408/502/503/504 or a connection abort is not free to retry.
     if(requestDispatched && !existsSync(track)){
       writeFileSync(uncertain,JSON.stringify({
         status:'uncertain_paid_request',
         atelier:recipe,chapter:name,part:index+1,
         textSha256:createHash('sha256').update(segments[index]).digest('hex'),
         reason:error?.name==='AbortError'?'client_timeout':'request_failed_after_dispatch',
         createdAt:new Date().toISOString(),
         retryAuthorized:false
       },null,2)+'\n',{flag:'wx'});
     }
     if(error?.name==='AbortError')throw Error('STOP_QUOTA_UNCERTAIN '+guide.slug+'/'+name+' part '+(index+1)+' : résultat inconnu, NE PAS relancer automatiquement.');
     throw error;
   }finally{clearTimeout(timeout);}
 }
}else if(mode==='--assemble'){
 if(existsSync(output)||existsSync(manifestPath))throw Error('Fichier audio final déjà existant : génération refusée.');
 chunks.forEach(f=>{assertMp3(f);measure(f)});
 const durations=chunks.map(measure);
 const list=join(tmp,'concat.txt');
 writeFileSync(list,chunks.map(f=>"file '"+f.replaceAll("'","'\\''")+"'").join('\n')+'\n');
 mkdirSync(dirname(output),{recursive:true});
 // Stream copy: do not synthesize any new sound during concatenation.
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',list,'-c','copy',output],{stdio:'inherit'});
 assertMp3(output);
 const total=measure(output),summed=durations.reduce((a,b)=>a+b,0);
 if(Math.abs(total-summed)>1.5)throw Error('Somme des durées de chapitres différente de la durée réelle MP3.');
 let start=0;
 const chapters=plan.chapters.map((c,i)=>{
   const begin=start;
   start+=tracks[i].reduce((sum,f)=>sum+measure(f),0);
   return {id:c.id,title:c.title,startSec:Math.round(begin*1000)/1000,endSec:Math.round(start*1000)/1000};
 });
 const audioUrl='/audio/workshops/'+guide.slug+'/'+filename;
 const asset={audioUrl,durationSec:Math.round(total*1000)/1000,sha256:fileSha(output),chapters,
   scriptSha256:createHash('sha256').update(JSON.stringify(voiceTexts)).digest('hex')};
 const manifest={atelier:guide.slug,canonicalRecipe:guide.sourceRecipeSlug,status:'audio_generated_review_pending',voice:'coral',
   ...asset,review:{acousticListening:false,mobile:false,desktop:false},sourceBackend:'render-iacoach-backend.onrender.com/api/tts'};
 if(approvedV3 && (!guide.audio.approvedScriptSha256||guide.audio.approvedScriptSha256!==asset.scriptSha256))
   throw Error('STOP : MP3 et narration éditoriale approuvée divergent.');
 guide.audio.asset=asset;
 guide.audio.status='generated_review_pending';
 mkdirSync(dirname(manifestPath),{recursive:true});
 writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 writeFileSync(path,JSON.stringify(guide,null,2)+'\n');
 console.log('CORAL_ASSEMBLED '+guide.slug+' '+total.toFixed(3)+'s sha256='+asset.sha256.slice(0,12)+' review=false');
}
