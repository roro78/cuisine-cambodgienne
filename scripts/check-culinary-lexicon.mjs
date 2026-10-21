#!/usr/bin/env node
/**
 * Editorial guard: no construction-industry lexicon in culinary copy.
 * Offline; verifies canonical recipes, practical workshop pages, five guided
 * courses and their exact review documents. Does not touch legacy audio.
 */
import { readFileSync, existsSync } from 'node:fs';

const slugs=['kroeung-jaune','bai-sach-chrouk','samlor-machu','kuy-teav','num-banh-chok'];
const files=[
  'src/data/recipes.ts',
  'src/data/restoredRecipes.ts',
  'src/data/workshops.ts',
  'src/pages/apprendre/pratique/kroeung-jaune.astro',
  'src/pages/apprendre/pratique/[slug].astro',
  'docs/ateliers/VALIDATION-RECETTES-ET-NARRATIONS-V2.md',
  ...slugs.map(s=>'src/data/atelier-recette-guides/'+s+'.json'),
  ...slugs.map(s=>'docs/ateliers/a-valider/'+s+'-recette-et-narration.md')
];
const forbidden=[
  {name:'Vocabulaire de fabrication au lieu de préparation culinaire',pattern:/\b(?:fabriqu\p{L}*|fabrication\p{L}*)\b/giu},
  {name:'Vocabulaire de construction hors cuisine',pattern:/\b(?:constru\p{L}*|chantier\p{L}*|maçonnerie|bétonnage)\b/giu},
  {name:'Poste au lieu de plan de travail',pattern:/\bposte\b/giu},
  {name:'Bol à dresser plutôt qu’à monter',pattern:/\b(?:monter|montez|montage|assembl(?:er|ez))\s+(?:les|des|du|d’un)\s+bols?\b/giu},
  {name:'Articles dédoublés ou incompatibles',pattern:/\bles\s+(?:les|la|le)\b/giu},
  {name:'Français incohérent',pattern:/\b(?:coupez\s+les\s+le|tranchez\s+les\s+les)\b/giu}
];
let errors=0;
for(const path of files){
 if(!existsSync(path)){console.error('ECHEC_LEXIQUE fichier introuvable '+path);errors++;continue;}
 const content=readFileSync(path,'utf8');
 for(const {name,pattern} of forbidden){
  pattern.lastIndex=0;
  for(const match of content.matchAll(pattern)){
   const line=content.slice(0,match.index).split('\n').length;
   console.error('ECHEC_LEXIQUE '+path+':'+line+' '+name+' : '+JSON.stringify(match[0]));
   errors++;
  }
 }
}
for(const slug of slugs){
 const guide=JSON.parse(readFileSync('src/data/atelier-recette-guides/'+slug+'.json','utf8'));
 if(guide.phases.length!==6||guide.audio.storyboardVersion!==2||guide.audio.editorialTextApproved!==false||
   guide.review.editorialValidated!==false){
   console.error('ECHEC_LEXIQUE validation editoriale prematuree ou structure absente : '+slug);
   errors++;
 }
 // Current narration differs from archived Coral V2, and no stale MP3 is served.
 if(guide.audio.supersededV2Asset && (guide.audio.status!=='script_only'||guide.audio.asset)){
   console.error('ECHEC_LEXIQUE ancien MP3 Coral V2 visible avec texte retouche : '+slug);
   errors++;
 }
}
if(errors)process.exitCode=1;
else console.log('CONTROLE_LEXIQUE_CULINAIRE_OK '+files.length+' fichiers, cinq fiches recette, cinq scripts de sept chapitres, aucun jargon interdit, 0 nouveau MP3.');
