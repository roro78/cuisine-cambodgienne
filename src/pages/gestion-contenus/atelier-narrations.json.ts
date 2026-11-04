import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { releasedCookingWorkshopGuides } from '../../data/cookingWorkshopGuides';
import { editorialRecordFingerprint } from '../editorial-source-index.json';

/**
 * PRIVATE SOURCE SNAPSHOT, not a public API. Apache denies the generated JSON
 * via public/gestion-contenus/.htaccess. The PHP Studio may read it locally,
 * after authentication, but the source and any media approvals remain immutable.
 *
 * Never add this to social-feed, the guided/public index or a public cache.
 */
export function existingWorkshopNarrations() {
  const allowedIds=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
  return releasedCookingWorkshopGuides.map(guide=>{
    const voiceTexts=[guide.audio.intro,...guide.phases.map(phase=>phase.audioScript)];
    const chapters=voiceTexts.map((text,i)=>({
      id:allowedIds[i],
      title:i===0?'Introduction':guide.phases[i-1].title,
      text
    }));
    if(guide.phases.length!==6 || chapters.some((entry,i)=>
      typeof entry.text!=='string'||entry.text.trim().length<120
      || entry.id!==allowedIds[i]))
      throw new Error('APPROVED_WORKSHOP_NARRATION_INCOMPLETE:'+guide.slug);
    const asset=guide.audio.asset;
    if(!asset || typeof asset.audioUrl!=='string'
       || !/^\/audio\/workshops\/[a-z0-9-]+\/atelier-coral-v[23]\.mp3$/.test(asset.audioUrl)
       || typeof asset.sha256!=='string'||!/^[a-f0-9]{64}$/.test(asset.sha256)
       || typeof asset.scriptSha256!=='string'||!/^[a-f0-9]{64}$/.test(asset.scriptSha256))
      throw new Error('WORKSHOP_AUDIO_ASSET_INVALID:'+guide.slug);
    const textDigest=createHash('sha256').update(JSON.stringify(voiceTexts)).digest('hex');
    if(textDigest!==asset.scriptSha256)
      throw new Error('WORKSHOP_AUDIO_TEXT_DIGEST_MISMATCH:'+guide.slug);
    return {
      id:'atelier:'+guide.slug,
      canonicalFingerprint:editorialRecordFingerprint('cookingWorkshopGuides',guide),
      recipeSlug:guide.sourceRecipeSlug,
      title:guide.title,
      chapters,
      scriptSha256:textDigest,
      audio:{
        url:asset.audioUrl,
        sha256:asset.sha256,
        durationSec:asset.durationSec
      }
    };
  });
}
export const GET: APIRoute = () => new Response(JSON.stringify({
  contract:'cdc-workshop-existing-coral-narrations-v1',
  schemaVersion:1,
  items:existingWorkshopNarrations()
}),{
  headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store',
    'X-Robots-Tag':'noindex, nofollow'
  }
});
