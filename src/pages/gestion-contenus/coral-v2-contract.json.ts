import type { APIRoute } from 'astro';
import {createHash} from 'node:crypto';
import structure from '../../../docs/ateliers/REFERENTIEL-ATELIER-CUISINE-ET-MP3.md?raw';
import immersive from '../../../docs/ateliers/REFERENTIEL-NARRATION-IMMERSIVE-V2.md?raw';

/** Private build-time source of truth: never expose via HTTP.
 * The Studio reads this file locally after authenticated access. Both complete
 * editorial contracts are copied verbatim, not reinterpreted in PHP. */
export function coralV2Policy(){
  if(!structure.includes('Contrat lexical bloquant')
    ||!immersive.includes('Contrat lexical bloquant')
    ||!immersive.includes('Sept chapitres'))
    throw new Error('CORAL_V2_REFERENTIAL_MISSING');
  return {
    contract:'cdc-coral-v2-complete-policy-v1',
    schemaVersion:1,
    structure:{path:'docs/ateliers/REFERENTIEL-ATELIER-CUISINE-ET-MP3.md',
      sha256:createHash('sha256').update(structure).digest('hex'),text:structure},
    narration:{path:'docs/ateliers/REFERENTIEL-NARRATION-IMMERSIVE-V2.md',
      sha256:createHash('sha256').update(immersive).digest('hex'),text:immersive}
  };
}
export const GET: APIRoute=()=>new Response(JSON.stringify(coralV2Policy()),{
  headers:{'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}
});
