#!/usr/bin/env node
/**
 * Explicit user approval, 21 October 2026: written recipes, editorial guides
 * and seven narrated scripts for the five V2 replacements.
 * NEVER approves listening, photography rights, mobile QA or production.
 * No network, no TTS. Idempotent and source-SHA bound.
 */
import { readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const slugs=['kroeung-jaune','bai-sach-chrouk','samlor-machu','kuy-teav','num-banh-chok'];
for(const slug of slugs){
 const path='src/data/atelier-recette-guides/'+slug+'.json';
 const a=JSON.parse(readFileSync(path,'utf8'));
 const review=readFileSync('docs/ateliers/a-valider/'+slug+'-recette-et-narration.md','utf8');
 const scripts=[a.audio.intro,...a.phases.map(p=>p.audioScript)];
 if(a.status!=='draft'||a.audio.status!=='script_only'||a.audio.asset || !a.audio.supersededV2Asset ||
    scripts.length!==7 || a.audio.storyboardVersion!==2 || scripts.some(x=>!review.includes(x)) ||
    a.review.productionApproved!==false || a.review.audioListeningValidated!==false){
   throw Error('STOP EDITORIAL APPROVAL incohérente : '+slug);
 }
 const scriptSha=createHash('sha256').update(JSON.stringify(scripts)).digest('hex');
 a.review.recipeValidated=true;
 a.review.editorialValidated=true;
 a.audio.editorialTextApproved=true;
 a.audio.approvedScriptSha256=scriptSha;
 a.audio.editorialApprovalDate='2026-10-21';
 a.audio.editorialApprovalScope='recette_fiche_et_7_scripts_texte_uniquement';
 // Approval of words does not imply that an unheard MP3, images or deployment are approved.
 writeFileSync(path,JSON.stringify(a,null,2)+'\n');
 console.log('APPROVAL_TEXT_ONLY '+slug+' '+scriptSha);
}
