#!/usr/bin/env node
/** Offline integrity gate for the six NEW seven-chapter workshops; never calls TTS. */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PHASE_IDS } from './check-workshop-blueprints.mjs';
import { verifyCookingAudioReview } from './verify-cooking-audio-review.mjs';
const names=['kroeung-jaune','lok-lak','samlor-machu','num-banh-chok','kuy-teav','bai-sach-chrouk'];
let present=0;
let superseded=0;
for(const slug of names){
 const blueprint=JSON.parse(readFileSync('src/data/atelier-recette-guides/'+slug+'.json','utf8'));
 const manifestFile=resolve('src/data/atelier-recette-audio',slug+'.json');
 const has=existsSync(manifestFile);
 if(blueprint.audio.status==='script_only'){
   if(!has){
     console.log('NEW_GUIDED_AUDIO_PENDING '+slug+' (no synthetic audio claimed)');
     continue;
   }
   // Preserve and verify previously recorded MP3s, but never credit them to
   // a V2 script that has not yet been synthesized or listened to.
   const m=JSON.parse(readFileSync(manifestFile,'utf8'));
   const prev=blueprint.audio.previousAsset;
   if(!prev || m.atelier!==blueprint.slug || m.canonicalRecipe!==slug ||
      prev.sha256!==m.sha256 || prev.audioUrl!==m.audioUrl ||
      !Array.isArray(m.chapters) || m.chapters.length!==7)
     throw Error(slug+': superseded MP3 provenance mismatch.');
   const f=resolve('public',m.audioUrl.replace(/^\\//,''));
   if(!m.audioUrl.startsWith('/audio/workshops/'+blueprint.slug+'/') || !existsSync(f) || statSync(f).size<1024)
     throw Error(slug+': superseded MP3 missing or outside atelier directory.');
   if(createHash('sha256').update(readFileSync(f)).digest('hex')!==m.sha256)
     throw Error(slug+': superseded MP3 integrity mismatch.');
   const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',f],{encoding:'utf8'}).trim());
   if(!Number.isFinite(duration)||Math.abs(duration-m.durationSec)>0.2)
     throw Error(slug+': superseded MP3 measured duration mismatch.');
   superseded++;
   present++;
   console.log('NEW_GUIDED_AUDIO_SUPERSEDED '+slug+' '+duration.toFixed(3)+'sec (not a V2 recording)');
   continue;
 }
 if(blueprint.audio.status!=='generated_review_pending'&&blueprint.audio.status!=='validated')
   throw Error(slug+': invalid audio status '+blueprint.audio.status);
 if(!has)throw Error(slug+': manifest is missing.');
 const m=JSON.parse(readFileSync(manifestFile,'utf8'));
 if(m.atelier!==blueprint.slug||m.canonicalRecipe!==slug||m.voice!=='coral'||m.chapters.length!==7)
   throw Error(slug+': manifest identity/voice/chapters mismatch.');
 const expected=['intro',...PHASE_IDS];
 if(m.chapters.some((c,i)=>c.id!==expected[i]||c.endSec<=c.startSec||
    (i>0&&Math.abs(c.startSec-m.chapters[i-1].endSec)>0.03)))
   throw Error(slug+': invalid consecutive chapter boundaries.');
 if(Math.abs(m.chapters[0].startSec)>0.03||Math.abs(m.chapters.at(-1).endSec-m.durationSec)>0.2)
   throw Error(slug+': chapter total does not match duration.');
 const sourceHash=createHash('sha256').update(JSON.stringify([blueprint.audio.intro,...blueprint.phases.map(p=>p.audioScript)])).digest('hex');
 if(sourceHash!==m.scriptSha256)throw Error(slug+': narration changed after generation; regeneration review needed.');
 const reviewErrors=verifyCookingAudioReview(blueprint,m);
 if(reviewErrors.length)throw Error(slug+': '+reviewErrors.join(' | '));
 const asset=blueprint.audio.asset;
 if(!asset||asset.audioUrl!==m.audioUrl||asset.sha256!==m.sha256||asset.durationSec!==m.durationSec)
   throw Error(slug+': blueprint asset and manifest diverge.');
 const f=resolve('public',m.audioUrl.replace(/^\//,''));
 if(!m.audioUrl.startsWith('/audio/workshops/'+blueprint.slug+'/')||!existsSync(f)||statSync(f).size<1024)
   throw Error(slug+': MP3 missing or outside isolated atelier directory.');
 const hash=createHash('sha256').update(readFileSync(f)).digest('hex');
 if(hash!==m.sha256)throw Error(slug+': MP3 SHA256 mismatch.');
 const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',f],{encoding:'utf8'}).trim());
 if(!Number.isFinite(duration)||Math.abs(duration-m.durationSec)>0.2)throw Error(slug+': bad measured duration.');
 present++;
 console.log('NEW_GUIDED_AUDIO_PASS '+slug+' '+duration.toFixed(3)+'sec');
}
console.log('NEW_GUIDED_AUDIO_SUMMARY '+present+'/6 MP3 measured; '+superseded+' superseded recording(s) excluded from V2 approval; remaining guides stay draft.');
