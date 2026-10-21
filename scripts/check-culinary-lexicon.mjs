#!/usr/bin/env node
/**
 * Editorial guard: no construction-industry lexicon in culinary copy.
 * Offline; verifies canonical recipes, practical workshop pages, five guided
 * courses and their exact review documents. Does not touch legacy audio.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

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
  {name:'Vocabulaire de fabrication au lieu de préparation culinaire',pattern:/(?<!\p{L})(?:fabriqu\p{L}*|fabrication\p{L}*)(?!\p{L})/giu},
  {name:'Vocabulaire de construction hors cuisine',pattern:/(?<!\p{L})(?:constru\p{L}*|chantier\p{L}*|maçonnerie|bétonnage)(?!\p{L})/giu},
  {name:'Poste au lieu de plan de travail',pattern:/\bposte\b/giu},
  {name:'Bol à dresser plutôt qu’à monter',pattern:/\b(?:monter|montez|montage|assembl(?:er|ez))\s+(?:les|des|du|d’un)\s+bols?\b/giu},
  {name:'Articles dédoublés ou incompatibles',pattern:/\bles\s+(?:les|la|le)\b/giu},
  {name:'Français incohérent',pattern:/\b(?:coupez\s+les\s+le|tranchez\s+les\s+les)\b/giu},
  {name:'Formulation artificielle ou mauvais titre de durée',pattern:/bonjour à votre plan de travail|voilà le moment du porc|choisissez vos convives|durée indicative des gestes|durée des gestes|temps de cuisine\s+\d|réservez une place au réfrigérateur|sous-préparation/giu}
];
// Regression: Unicode accents must not escape the word filter.
for(const sample of ['fabriquer','fabriqué','fabriquée','fabrication']){
 forbidden[0].pattern.lastIndex=0;
 if(!forbidden[0].pattern.test(sample))throw Error('Filtre lexical incomplet pour '+sample);
}
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
 if(guide.phases.length!==6||guide.audio.storyboardVersion!==2||
   guide.audio.editorialTextApproved!==guide.review.editorialValidated ||
   guide.audio.editorialTextApproved!==guide.review.recipeValidated){
   console.error('ECHEC_LEXIQUE validation editoriale prematuree ou structure absente : '+slug);
   errors++;
 }
 const phaseSum=guide.phases.reduce((total,p)=>total+p.minutes,0);
 if(phaseSum!==guide.duration.practicalMinutes){
   console.error('ECHEC_DUREE les étapes ne correspondent pas à la durée annoncée : '+slug);
   errors++;
 }
 const path='docs/ateliers/a-valider/'+slug+'-recette-et-narration.md';
 const copy=existsSync(path)?readFileSync(path,'utf8'):'';
 const spoken=[guide.audio.intro,...guide.phases.map(p=>p.audioScript)];
 if(spoken.length!==7 || spoken.some(script=>!copy.includes(script))){
   console.error('ECHEC_TRANSCRIPTION texte affiché et narration du générateur divergent : '+slug);
   errors++;
 }
 if(guide.phases.some((phase,i)=>!copy.includes('### Étape '+(i+1)+' sur 6 — '+phase.title+' (environ '+phase.minutes+' min)'))){
   console.error('ECHEC_FICHE étapes et durées affichées divergentes : '+slug);
   errors++;
 }
 // Current narration differs from archived Coral V2, and no stale MP3 is served.
 if(guide.audio.supersededV2Asset && ((guide.audio.status==='script_only'&&guide.audio.asset)||
   (guide.audio.status!=='script_only' && !guide.audio.asset))){
   console.error('ECHEC_LEXIQUE ancien MP3 Coral V2 visible avec texte retouche : '+slug);
   errors++;
 }
}

const audioPreserve={
  'kroeung-jaune':'c2eb01538fa68ddcef431d531376be5b4e09276e4cd14fe893608aa0fea6bbb0',
  'bai-sach-chrouk':'0ca5aaad4443805f1e2360ac9921d53c27750df8ac72c1e117a901c9f8b71c8d',
  'samlor-machu':'0846b9969bf2d204722c48eae791d335252261952416aeb874e8c6dcfe1fecde',
  'kuy-teav':'6818c905bd8ef4495b34f284bc7394a69274563cc4ee98920f672e726fd71987',
  'num-banh-chok':'69b467288ef3c23ef2d6b914d395d9f54175372085ee3c52fe1019489a30e1d1',
  'lok-lak':'d3f5558c07f7aff5c4c57ccf7c662544079744dc0fa8223ec869a6b061d0912e'
};
for(const [slug,expectedSha] of Object.entries(audioPreserve)){
  const guide=JSON.parse(readFileSync('src/data/atelier-recette-guides/'+slug+'.json','utf8'));
  const dir='public/audio/workshops/'+guide.slug+'/';
  const stale=dir+'atelier-coral.mp3';
  const staleManifest='src/data/atelier-recette-audio/'+slug+'.json';
  if(existsSync(stale)||existsSync(staleManifest)||guide.audio.previousAsset){
    console.error('ECHEC_MP3_V1_SUPPRESSION ancien media encore present : '+slug);
    errors++;
  }
  const v3=dir+'atelier-coral-v3.mp3';
  const v3Manifest='src/data/atelier-recette-audio/'+slug+'-v3.json';
  if(guide.audio.status==='script_only'&&(existsSync(v3)||existsSync(v3Manifest))){
    console.error('ECHEC_AUDIO_V3 dossier brouillon et piste V3 ne correspondent pas : '+slug);
    errors++;
  }
  if(guide.audio.status!=='script_only'&&slug!=='lok-lak'){
    if(!existsSync(v3)||!existsSync(v3Manifest)||guide.audio.asset?.audioUrl!=='/audio/workshops/'+guide.slug+'/atelier-coral-v3.mp3'){
      console.error('ECHEC_AUDIO_V3 MP3 et manifeste V3 requis apres validation : '+slug);
      errors++;
    } else {
      const newer=JSON.parse(readFileSync(v3Manifest,'utf8'));
      const v3Sha=createHash('sha256').update(readFileSync(v3)).digest('hex');
      const currentScriptSha=createHash('sha256').update(JSON.stringify([guide.audio.intro,...guide.phases.map(p=>p.audioScript)])).digest('hex');
      if(v3Sha!==newer.sha256||newer.sha256!==guide.audio.asset.sha256||
         newer.scriptSha256!==currentScriptSha||guide.audio.approvedScriptSha256!==currentScriptSha||newer.chapters.length!==7){
         console.error('ECHEC_AUDIO_V3 texte, MP3 et manifeste V3 incoherents : '+slug);
         errors++;
      }
    }
  }
  const live=dir+'atelier-coral-v2.mp3';
  const manifestPath='src/data/atelier-recette-audio/'+slug+'-v2.json';
  if(!existsSync(live)||!existsSync(manifestPath)){
    console.error('ECHEC_MP3_V2_PROTECTION nouvel enregistrement absent : '+slug);
    errors++;
    continue;
  }
  const m=JSON.parse(readFileSync(manifestPath,'utf8'));
  const actualSha=createHash('sha256').update(readFileSync(live)).digest('hex');
  const reference=slug==='lok-lak'?guide.audio.asset:guide.audio.supersededV2Asset;
  if(m.sha256!==expectedSha||actualSha!==expectedSha||m.audioUrl!=='/audio/workshops/'+guide.slug+'/atelier-coral-v2.mp3'||
     reference?.sha256!==expectedSha||reference.audioUrl!==m.audioUrl||m.chapters?.length!==7){
    console.error('ECHEC_MP3_V2_PROTECTION piste nouvelle modifiee, mal referencee ou manquante : '+slug);
    errors++;
  }
}
for(const name of ['piler-aromates-au-mortier','saisir-viande-poele',
  'bouillon-leger-savoureux','composer-repas-cambodgien','equilibrer-une-sauce','fraicheur-herbes-agrumes']){
  if(!existsSync('public/audio/workshops/'+name+'/atelier-coral.mp3')){
    console.error('ECHEC_AUDIO_AUTRES_ATELIERS piste utilisee ailleurs supprimee : '+name);
    errors++;
  }
}

if(errors)process.exitCode=1;
else console.log('CONTROLE_LEXIQUE_CULINAIRE_OK '+files.length+' fichiers, cinq fiches recette, cinq scripts de sept chapitres, aucun jargon interdit, 0 nouveau MP3.');
