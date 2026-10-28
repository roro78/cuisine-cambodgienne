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
