// Build-time gate: redirect old articles only when every new workshop is
// release_ready. Listening approval by itself never triggers public cutover.
import { readFileSync } from 'node:fs';
const BASE='https://www.cuisine-du-cambodge.com';
const slugs=['kroeung-jaune','lok-lak','samlor-machu','num-banh-chok','kuy-teav','bai-sach-chrouk'];
export const legacyWorkshopRedirects=[
  ['piler-aromates-au-mortier','/apprendre/pratique/kroeung-jaune/'],
  ['equilibrer-une-sauce','/apprendre/pratique/samlor-machu-soupe-acidulee-guidee/'],
  ['saisir-viande-poele','/apprendre/pratique/lok-lak-de-la-poele-a-l-assiette/'],
  ['fraicheur-herbes-agrumes','/apprendre/pratique/num-banh-chok-sauce-et-herbes-fraiches/'],
  ['bouillon-leger-savoureux','/techniques/bouillon-leger-maison/'],
  ['composer-repas-cambodgien','/culture/construire-repas-cambodgien/']
];
export const legacyWorkshopAudioPaths=legacyWorkshopRedirects.map(([slug])=>
  '/audio/workshops/'+slug+'/atelier-coral.mp3');
// Five obsolete V2 previews are still recorded for provenance, but must not be
// exported once the new V3 files have been fully approved for publication.
export const supersededV2WorkshopAudioPaths=slugs
  .map(slug=>JSON.parse(readFileSync(new URL('../src/data/atelier-recette-guides/'+slug+'.json',import.meta.url),'utf8')).audio?.supersededV2Asset?.audioUrl)
  .filter(Boolean);
export const retiredWorkshopAudioPaths=[...new Set([...legacyWorkshopAudioPaths,...supersededV2WorkshopAudioPaths])];
export function workshopCutoverApproved(){
  return slugs.every(slug=>JSON.parse(readFileSync(
    new URL('../src/data/atelier-recette-guides/'+slug+'.json',import.meta.url),'utf8')).status==='release_ready');
}
export function workshopRedirectRule(from,to){
  return [
    'RewriteCond %{HTTP_HOST} ^(www[.])?cuisine-du-cambodge[.]com$ [NC]',
    'RewriteRule ^apprendre/'+from+'/?$ '+BASE+to+' [R=301,L,NE]'
  ].join('\n');
}
export function expectedWorkshopHtaccess(source){
  if(!workshopCutoverApproved())return source;
  const marker='# Ancien domaine sans www : conserver le chemin demandé et les paramètres UTM.';
  if(!source.includes(marker))throw Error('Missing Apache insertion marker');
  const block='# Migration des six ateliers : 301 actifs apres validation complete\n'
    +legacyWorkshopRedirects.map(([from,to])=>workshopRedirectRule(from,to)).join('\n\n')+'\n\n';
  return source.replace(marker,block+marker);
}
