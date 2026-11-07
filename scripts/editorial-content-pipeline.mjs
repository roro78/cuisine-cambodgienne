/**
 * Editorial intake contract: the FIRST step of the content -> site -> social pipeline.
 *
 * Planning/draft metadata ONLY. No network calls, no model API, no publish action.
 * Both manual creation and future AI generation must produce the same contract.
 * Actual content type schemas and image/audio production stay separately gated.
 */
import {createHash} from 'node:crypto';

export const EDITORIAL_KINDS=Object.freeze([
  'recette','atelier','culture','ingredient','technique'
]);
export const EDITORIAL_STAGES=Object.freeze([
  'idea','draft','review','approved','scheduled','published'
]);
export const EDITORIAL_CHANNELS=Object.freeze(['site','facebook','instagram']);
export const EDITORIAL_ORIGINS=Object.freeze(['manual','ai']);
const NEXT=Object.freeze({
  idea:'draft',draft:'review',review:'approved',
  approved:'scheduled',scheduled:'published'
});
const contract='cdc-editorial-content-intake-v1';

export function normalizeEditorialTitle(value){
  if(typeof value!=='string')throw new TypeError('TITLE_REQUIRED');
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('fr').replace(/['’]/g,' ')
    .replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
}
export function editorialSlug(value){
  const slug=normalizeEditorialTitle(value).replace(/ /g,'-');
  if(!slug || slug.length>100)throw new Error('TITLE_SLUG_INVALID');
  return slug;
}
const sameKeys=(object,allowed)=>Object.keys(object).every(x=>allowed.includes(x));
const requireText=(value,max)=>typeof value==='string'
  && value.trim().length>0 && value.length<=max && !value.includes('\0');
const optionalText=(value,max)=>value===undefined || value==='' || requireText(value,max);
const dateValid=(value)=>value===null || (typeof value==='string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(value+'T12:00:00Z'))
  && new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value);

export function validateEditorialProposal(value){
  if(!value || typeof value!=='object' || Array.isArray(value)
    || !sameKeys(value,['contract','kind','origin','title','slug','angle',
      'summary','sections','channels','target_date','stage','research_note',
      'reviewed_by','reviewed_at','publication_evidence']))
    throw new Error('PROPOSAL_SHAPE_INVALID');
  if(value.contract!==contract || !EDITORIAL_KINDS.includes(value.kind)
    || !EDITORIAL_ORIGINS.includes(value.origin)
    || !EDITORIAL_STAGES.includes(value.stage)
    || !requireText(value.title,180) || !requireText(value.angle,700)
    || value.slug!==editorialSlug(value.title)
    || !optionalText(value.summary,2000)
    || !optionalText(value.research_note,5000))
    throw new Error('PROPOSAL_FIELDS_INVALID');
  if(!Array.isArray(value.channels)||!value.channels.includes('site')
    || !value.channels.length
    || value.channels.some(x=>!EDITORIAL_CHANNELS.includes(x))
    || new Set(value.channels).size!==value.channels.length
    || !dateValid(value.target_date))
    throw new Error('PROPOSAL_PLAN_INVALID');
  if(!Array.isArray(value.sections)||value.sections.length>30
    || value.sections.some(s=>!s||typeof s!=='object'||Array.isArray(s)
      || !sameKeys(s,['title','paragraphs'])
      || !requireText(s.title,180)||!Array.isArray(s.paragraphs)
      || s.paragraphs.length<1||s.paragraphs.length>30
      || s.paragraphs.some(p=>!requireText(p,6000))))
    throw new Error('PROPOSAL_SECTIONS_INVALID');
  if(['draft','review','approved','scheduled','published'].includes(value.stage)
    && (!requireText(value.summary,2000)||value.sections.length<1))
    throw new Error('PROPOSAL_INCOMPLETE');
  if(['approved','scheduled','published'].includes(value.stage)
    && (!requireText(value.reviewed_by,120)
      || !/^\d{4}-\d{2}-\d{2}T/.test(value.reviewed_at??'')))
    throw new Error('HUMAN_REVIEW_REQUIRED');
  if(['scheduled','published'].includes(value.stage)&&value.target_date===null)
    throw new Error('CALENDAR_DATE_REQUIRED');
  if(value.stage==='published' && !requireText(value.publication_evidence,500))
    throw new Error('PUBLICATION_PROOF_REQUIRED');
  return value;
}
export function makeEditorialIdea({kind,title,angle,origin='manual',channels=['site'],
    target_date=null,summary='',research_note=''}) {
  const p={contract,kind,origin,title,slug:editorialSlug(title),angle,
    summary,sections:[],channels,target_date,stage:'idea',research_note};
  return validateEditorialProposal(p);
}
/** Transitions are explicit, human approval is never inferred from an AI draft. */
export function transitionEditorialProposal(current,next,changes={}){
  validateEditorialProposal(current);
  if(NEXT[current.stage]!==next || !sameKeys(changes,[
    'summary','sections','target_date','channels','research_note',
    'reviewed_by','reviewed_at','publication_evidence']))
    throw new Error('EDITORIAL_TRANSITION_FORBIDDEN');
  const value={...current,...changes,stage:next};
  return validateEditorialProposal(value);
}
function terms(value){
  return new Set(normalizeEditorialTitle(value).split(' ').filter(x=>x.length>2));
}
function overlapScore(a,b){
  const A=terms(a),B=terms(b);
  if(!A.size||!B.size)return 0;
  let common=0;
  for(const term of A)if(B.has(term))common++;
  return common/Math.max(A.size,B.size);
}
/**
 * Flag both planned and published same-type content, but retain deliberate
 * cross-type angles (e.g. recipe Kroeung vs cultural history of Kroeung).
 * It cannot prove semantic uniqueness: human review remains mandatory.
 */
export function findEditorialOverlaps(candidate,existing=[],planned=[]){
  const title=normalizeEditorialTitle(candidate.title);
  if(!EDITORIAL_KINDS.includes(candidate.kind)||!title)
    throw new Error('CANDIDATE_INVALID');
  const matches=[];
  for(const [collection,items] of [['published',existing],['planned',planned]]){
    if(!Array.isArray(items))throw new Error('COLLECTION_INVALID');
    for(const item of items){
      if(!item || typeof item.title!=='string' || typeof item.kind!=='string')continue;
      if(item.kind!==candidate.kind)continue;
      const other=normalizeEditorialTitle(item.title);
      const exact=other===title || (typeof item.slug==='string'
        && item.slug===editorialSlug(candidate.title));
      const score=overlapScore(title,other);
      if(exact||score>=0.65){
        matches.push({source:collection,id:item.id??null,title:item.title,
          reason:exact?'exact_title_or_slug':'similar_title',score:exact?1:score});
      }
    }
  }
  return matches.sort((a,b)=>b.score-a.score);
}
export function assertNoExactDuplicate(candidate,existing=[],planned=[]){
  const found=findEditorialOverlaps(candidate,existing,planned);
  if(found.some(x=>x.reason==='exact_title_or_slug'))
    throw new Error('EDITORIAL_DUPLICATE_BLOCKED');
  return found; // Similar titles are a mandatory editorial review signal.
}
export function contentIdeaFingerprint(value){
  validateEditorialProposal(value);
  return createHash('sha256').update(JSON.stringify({
    kind:value.kind,slug:value.slug,angle:normalizeEditorialTitle(value.angle)
  })).digest('hex');
}

/** Read-only selection from the SAME private Studio calendar. A target date
 * selects work; it never authorizes spending, audio, saving or publication.
 * Exclusions are operator decisions, not title-based guesses about test data.
 */
export function selectNextEditorialWorkshop({records,published,recipes,
  excludedCreationIds=[],excludedSourceIds=[],fallback=null}={}){
  if(!Array.isArray(records)||records.length>250||!Array.isArray(published)
    ||!Array.isArray(recipes)||!Array.isArray(excludedCreationIds)||!Array.isArray(excludedSourceIds)
    ||excludedCreationIds.some(id=>!/^c-[a-f0-9]{24}$/.test(id))
    ||excludedSourceIds.some(id=>!/^atelier:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)))
    throw Error('EDITORIAL_SELECTION_INPUT');
  const seen=new Set(),blocked=[],scheduled=[];
  const recipeFor=slug=>{
    const found=recipes.filter(r=>r.id==='recette:'+slug);
    if(found.length!==1||! /^[a-f0-9]{64}$/.test(found[0].fingerprint||''))
      throw Error('EDITORIAL_CANONICAL_REFERENCE');
    return found[0];
  };
  for(const r of records){
    if(!r||!/^c-[a-f0-9]{24}$/.test(r.id||'')||seen.has(r.id)
      ||!Number.isSafeInteger(r.version)||r.version<1||r.version>9999
      ||!EDITORIAL_KINDS.includes(r.kind)||!requireText(r.title,180)
      ||!['draft','review'].includes(r.state)||!dateValid(r.target_date))
      throw Error('EDITORIAL_SELECTION_RECORD');
    seen.add(r.id);
    if(r.kind!=='atelier')continue;
    let reason=null;
    if(excludedCreationIds.includes(r.id))reason='operator_exclusion';
    else if(r.source_binding)reason='published_identity_preserved';
    else if(excludedSourceIds.includes('atelier:'+r.slug))reason='operator_exclusion';
    else if(findEditorialOverlaps(r,published).some(m=>m.reason==='exact_title_or_slug'))reason='already_published';
    if(reason){blocked.push({id:r.id,reason});continue;}
    if(r.target_date!==null)scheduled.push(r);
  }
  scheduled.sort((a,b)=>a.target_date.localeCompare(b.target_date)||a.id.localeCompare(b.id));
  const selected=scheduled[0]||null;
  // A scheduled item with missing source blocks its own generation. Do not
  // silently skip a real priority by inferring its recipe from its title.
  let chosen=selected,origin='calendar';
  if(!chosen){
    if(fallback===null)return {selection:null,blocked,production_writes:0,provider_calls:0};
    if(!fallback||!requireText(fallback.title,180)||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fallback.recipeSlug||''))
      throw Error('EDITORIAL_SELECTION_FALLBACK');
    const candidate={kind:'atelier',title:fallback.title,slug:editorialSlug(fallback.title)};
    assertNoExactDuplicate(candidate,published);
    const available=records.filter(r=>r.kind==='atelier'&&!blocked.some(b=>b.id===r.id));
    const matches=available.filter(r=>r.atelier_reference?.recipeSlug===fallback.recipeSlug
      ||normalizeEditorialTitle(r.title)===normalizeEditorialTitle(fallback.title)||r.slug===candidate.slug);
    if(matches.length>1)throw Error('EDITORIAL_MULTIPLE_DRAFTS');
    chosen=matches[0]||{...candidate,id:null,version:null,target_date:null,
      atelier_reference:{recipeSlug:fallback.recipeSlug}};
    origin=matches.length?'existing_draft':'candidate';
  }
  const recipeSlug=chosen.atelier_reference?.recipeSlug;
  const recipe=recipeFor(recipeSlug);
  const other=records.filter(r=>r.id!==chosen.id&&r.kind==='atelier'&&!blocked.some(b=>b.id===r.id));
  if(other.some(r=>r.atelier_reference?.recipeSlug===recipeSlug))throw Error('EDITORIAL_MULTIPLE_DRAFTS');
  assertNoExactDuplicate(chosen,published,other);
  const similar=findEditorialOverlaps(chosen,published,other);
  const selection={origin,creation_id:chosen.id,creation_version:chosen.version,title:chosen.title,
    recipe_id:recipe.id,recipe_fingerprint:recipe.fingerprint,target_date:chosen.target_date,
    similar_titles:similar,human_semantic_review_required:true,publication_authorized:false};
  selection.preparation_key=createHash('sha256').update(JSON.stringify(selection)).digest('hex').slice(0,48);
  return {selection,blocked,production_writes:0,provider_calls:0};
}
