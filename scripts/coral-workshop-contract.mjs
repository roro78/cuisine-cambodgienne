/** Complete private workshop proposals in the existing queue. No network on import. */
import {createHash} from 'node:crypto';
import {coralChapterVoiceProblems} from './coral-chapter-voice-checks.mjs';
export const COMPLETE_WORKSHOP_CONTRACT='cdc-coral-v2-workshop-request-v1';
export const WORKSHOP_PHASE_IDS=['installer','preparer','assembler','maitriser','rectifier','terminer'];
export const WORKSHOP_CHAPTER_IDS=['intro',...WORKSHOP_PHASE_IDS];
const sha=v=>createHash('sha256').update(v).digest('hex');
const fields=['intro','learningGoal','finalPreparation','portionLabel','beforeStarting','equipment','phases'];
const phaseKeys=['id','minutes','ingredientNames','actions','observe','check','mistake','recovery','safety','pausePrompt'];
const keys=(v,list)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===list.length&&list.every(k=>Object.hasOwn(v,k));
export function validateWorkshopContinuation(c){
 if(!keys(c,['source_job_id','phase_output_sha256'])||!/^[a-f0-9]{48}$/.test(c.source_job_id||'')
  ||!/^[a-f0-9]{64}$/.test(c.phase_output_sha256||''))throw Error('JOB_WORKSHOP_CONTINUATION');
 return c;
}
export function validateCompleteWorkshopRequest(r){
 if(!r||r.contract!==COMPLETE_WORKSHOP_CONTRACT||r.scope!=='workshop-complete-draft-v1'
  ||!/^c-[a-f0-9]{24}$/.test(r.creation_id||'')||!Number.isInteger(r.creation_version)||r.creation_version<1||r.creation_version>9998
  ||!['binding_digest','canonical_fingerprint'].every(k=>/^[a-f0-9]{64}$/.test(r[k]||''))
  ||r.brief?.kind!=='atelier'||r.brief.reference_id!==r.reference?.id
  ||r.reference?.id!=='recette:'+r.atelier?.recipeSlug
  ||!Array.isArray(r.reference?.recipe_fields?.ingredients)||!r.reference.recipe_fields.ingredients.length
  ||!Array.isArray(r.reference?.recipe_fields?.steps)||!r.reference.recipe_fields.steps.length
  ||r.culinary_evidence?.recipe_sha256!==r.canonical_fingerprint||r.culinary_evidence.cooking_test_performed!==false
  ||!Array.isArray(r.culinary_evidence.sources)||r.culinary_evidence.sources.length<2
  ||!['structure','narration'].every(k=>typeof r.referentials?.[k]?.text==='string'
    &&r.referentials[k].text.includes('Contrat lexical bloquant')&&sha(r.referentials[k].text)===r.referentials[k].sha256)
  ||r.response_schema?.type!=='object'||r.response_schema.additionalProperties!==false
  ||!keys(r.response_schema.properties,['summary','research_note','profile','fields','phase_details','chapters'])
  ||!keys(r.response_schema.properties.fields.properties,fields)
  ||!keys(r.response_schema.properties.phase_details.items.properties,phaseKeys)
  ||r.response_schema.properties.phase_details.minItems!==6||r.response_schema.properties.phase_details.maxItems!==6
  ||r.response_schema.properties.chapters.minItems!==7||r.response_schema.properties.chapters.maxItems!==7
  ||r.timeout_seconds!==20||r.max_output_tokens!==6000||r.response_max_bytes!==30000
  ||Buffer.byteLength(JSON.stringify(r))>90000)throw Error('JOB_WORKSHOP_REQUEST');
 if(Object.hasOwn(r,'continuation'))validateWorkshopContinuation(r.continuation);
 return r;
}
/** Deliberately small closed JSON dialect shared with the PHP form. */
export function validateWorkshopValue(v,s,depth=0){
 if(depth>8||!s)throw Error('JOB_WORKSHOP_RESPONSE');
 if(s.type==='object'){
  if(s.additionalProperties!==false||!keys(v,Object.keys(s.properties||{}))
   ||!Array.isArray(s.required)||s.required.length!==Object.keys(s.properties).length)throw Error('JOB_WORKSHOP_RESPONSE');
  for(const [k,p] of Object.entries(s.properties))validateWorkshopValue(v[k],p,depth+1);
 }else if(s.type==='array'){
  if(!Array.isArray(v)||v.length<s.minItems||v.length>s.maxItems)throw Error('JOB_WORKSHOP_RESPONSE');
  for(const x of v)validateWorkshopValue(x,s.items,depth+1);
 }else if(s.type==='string'){
  if(typeof v!=='string'||!v.isWellFormed()||v.trim().length<(s.minLength??0)||Array.from(v).length>(s.maxLength??7000)
   ||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v)||(s.enum&&!s.enum.includes(v)))throw Error('JOB_WORKSHOP_RESPONSE');
 }else if(s.type==='integer'){
  if(!Number.isSafeInteger(v)||v<s.minimum||v>s.maximum)throw Error('JOB_WORKSHOP_RESPONSE');
 }else throw Error('JOB_WORKSHOP_RESPONSE');
 return v;
}
export function workshopPhaseSchema(r){
 validateCompleteWorkshopRequest(r);
 const properties={...r.response_schema.properties};delete properties.chapters;
 return {type:'object',properties,required:Object.keys(properties),additionalProperties:false};
}
export function hasAmokAllergens(labels){
 return labels.some(v=>/^poissons?$/iu.test(v.trim()))&&labels.some(v=>/^(?:œ|oe)ufs?$/iu.test(v.trim()));
}
/** Derive one internally consistent estimated total. Preserve the raw model
 * output in its receipt; callers record this projection before further calls.
 * No quantities, phase durations, ingredients or safety texts are changed.
 */
export function normalizeWorkshopPhaseProfile(r,value){
 validateWorkshopValue(value,workshopPhaseSchema(r));
 const phase=structuredClone(value),changes=[];
 const total=phase.phase_details.reduce((sum,p)=>sum+p.minutes,0);
 if(total<1||total>600)throw Error('JOB_WORKSHOP_PROFILE');
 if(phase.profile.practicalMinutes!==total){
  changes.push({field:'profile.practicalMinutes',reported:phase.profile.practicalMinutes,derived:total,reason:'sum_of_six_phase_estimates'});
  phase.profile.practicalMinutes=total;
 }
 validateWorkshopPhases(r,phase);
 return {phase,changes};
}
export function validateWorkshopPhases(r,v){
 validateWorkshopValue(v,workshopPhaseSchema(r));
 const names=r.reference.recipe_fields.ingredients.map(i=>i.name),used=new Set();
 if(v.fields.phases.length!==6)throw Error('JOB_WORKSHOP_RESPONSE');
 for(let i=0;i<6;i++){
  const p=v.phase_details[i];if(p.id!==WORKSHOP_PHASE_IDS[i]||p.ingredientNames.some(n=>!names.includes(n)))throw Error('JOB_WORKSHOP_INGREDIENTS');
  if(i>0)for(const n of p.ingredientNames)used.add(n);
 }
 if(names.some(n=>!used.has(n)))throw Error('JOB_WORKSHOP_INGREDIENTS');
 if(v.profile.practicalMinutes!==v.phase_details.reduce((sum,p)=>sum+p.minutes,0)
  ||(r.atelier.recipeSlug==='amok-trey'&&!hasAmokAllergens(v.profile.allergens)))throw Error('JOB_WORKSHOP_PROFILE');
 const publicText=JSON.stringify([v.summary,v.profile,v.fields,v.phase_details]);
 if(/\b(?:fabriqu\p{L}*|fabrication\p{L}*|constru\p{L}*|chantier\p{L}*|poste)\b/iu.test(publicText))throw Error('JOB_WORKSHOP_LEXICON');
 return v;
}
/** One job: structured fields + six real phases, then seven bounded texts.
 * Any failed/uncertain exchange stops the set; the gateway never replays it.
 */
export async function produceCompleteWorkshop(r,{phaseCall,chapterCall,onPhaseValidated=async()=>{}}){
 validateCompleteWorkshopRequest(r);
 const raw=await phaseCall({request:r,schema:workshopPhaseSchema(r)});
 if(typeof raw!=='string'||Buffer.byteLength(raw)>12000)throw Error('JOB_WORKSHOP_RESPONSE');
 let phase;try{phase=JSON.parse(raw);}catch{throw Error('JOB_WORKSHOP_RESPONSE');}
 const normalized=normalizeWorkshopPhaseProfile(r,phase);phase=normalized.phase;
 await onPhaseValidated({raw,phase,changes:normalized.changes});
 const chapters=[];
 for(let i=0;i<7;i++){
  const id=WORKSHOP_CHAPTER_IDS[i],schema={type:'object',additionalProperties:false,required:['id','text'],
   properties:{id:{type:'string',enum:[id]},text:{type:'string',minLength:i?400:300,maxLength:1800}}};
  const context={id,title:r.atelier.title,workshop:phase.fields,profile:phase.profile,
   phase:i?{...phase.phase_details[i-1],title:phase.fields.phases[i-1].title,learning:phase.fields.phases[i-1].learning}:null,
   reference:r.reference,referentials:r.referentials,culinary_evidence:r.culinary_evidence};
  const answer=await chapterCall({id,index:i,context,schema});
  if(typeof answer!=='string'||Buffer.byteLength(answer)>9000)throw Error('JOB_WORKSHOP_RESPONSE');
  let c;try{c=JSON.parse(answer);}catch{throw Error('JOB_WORKSHOP_RESPONSE');}
  validateWorkshopValue(c,schema);
  if(coralChapterVoiceProblems(c.text,i?400:300).length)throw Error('JOB_CORAL_INVALID_CHAPTER');
  chapters.push(c);
 }
 const result=JSON.stringify({...phase,chapters});
 if(Buffer.byteLength(result)>30000)throw Error('JOB_WORKSHOP_RESULT_SIZE');
 return result;
}
