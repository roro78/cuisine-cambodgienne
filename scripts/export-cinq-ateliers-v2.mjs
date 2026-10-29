#!/usr/bin/env node
/* Review bundle: six readable Markdown lessons + their actual source and MP3 files.
 * Offline and read-only: no calls to TTS, no secrets, no publish.
 */
import {readFileSync,writeFileSync,existsSync,mkdirSync,rmSync,copyFileSync,statSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {loadCanonicalRecipes} from './check-workshop-blueprints.mjs';
const base=resolve('atelier-review');
rmSync(base,{recursive:true,force:true});mkdirSync(base,{recursive:true});
const recipes=await loadCanonicalRecipes();
const names=['lok-lak','kroeung-jaune','bai-sach-chrouk','samlor-machu','kuy-teav','num-banh-chok'];
const ids=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
const copy=(file,optional=false)=>{
  if(!existsSync(file)){if(optional)return false;throw Error('Fichier manquant : '+file)}
  const target=join(base,file);
  mkdirSync(dirname(target),{recursive:true});
  copyFileSync(file,target);return true;
};
const qty=(n)=>Math.round(n*1000)/1000;
const extra=(n,u,name,note='')=>({quantity:n,unit:u,name,note});
const ingredients=(slug,items)=>{
  switch(slug){
    case 'lok-lak': return [...items.slice(0,7),extra(1,'','tomate'),extra(.5,'','concombre'),extra(4,'','feuilles de salade'),extra(1,'c. à soupe','huile neutre','Facultative, spécifique à cet atelier')];
    case 'bai-sach-chrouk': return [...items.slice(0,6),extra(200,'g','pickles concombre et carotte','Préparés en amont')];
    case 'samlor-machu': return [...items.slice(0,5),extra(2,'','tomates'),extra(150,'g','ananas en dés','Choix A'),extra(250,'g','courgette','Choix B, en remplacement de l’ananas'),extra(1,'petite poignée','herbes fraîches')];
    case 'kuy-teav': return [...items.slice(0,5),extra(1,'petite botte','coriandre'),extra(2,'','ciboules'),extra(100,'g','pousses de soja'),...items.slice(6)];
    case 'num-banh-chok': return [...items.slice(0,5),extra(.5,'','concombre'),extra(100,'g','haricots verts fins'),extra(1,'poignée','herbes fraîches')];
    default:return items;
  }
};
const summary=['# CUISINE DU CAMBODGE — SIX COURS INTÉGRAUX','','Dossier de préécoute et de relecture. Une piste V2 n’est ajoutée que si son fichier réel existe et correspond au SHA-256 de son manifeste.','',
  '## Mini-lecteur mobile','','Le composant CookingWorkshopAudio.astro comporte lecture/pause, arrêt, accès au tiroir des sept chapitres et suivi facultatif. Le suivi défile aux frontières des six grandes phases ; un défilement manuel le désactive sans arrêter la lecture.','',
  '## État réel au moment de la création du ZIP','','| Atelier | Fiche complète | MP3 V2 | Durée V2 |', '|---|---|---|---|'];
for (const name of names){
  const path='src/data/atelier-recette-guides/'+name+'.json';
  const guide=JSON.parse(readFileSync(path,'utf8'));
  const recipe=recipes.find(x=>x.slug===name);
  if(!recipe)throw Error('Recette canonique absente '+name);
  copy(path);
  const edition=guide.audio.asset?.audioUrl?.endsWith('/atelier-coral-v3.mp3')?'-v3':'-v2';
  const currentManifest='src/data/atelier-recette-audio/'+name+edition+'.json';
  let current=null;
  if(guide.audio.status!=='script_only' && copy(currentManifest,true)){
    const m=JSON.parse(readFileSync(currentManifest,'utf8'));
    const file='public'+m.audioUrl;
    if(!existsSync(file))throw Error('Manifeste '+edition+' sans MP3 '+name);
    if(m.audioUrl!==guide.audio.asset?.audioUrl)throw Error('Ancien MP3 non conforme au script actif '+name);
    if(statSync(file).size<1024)throw Error('MP3 '+edition+' vide '+name);
    if(createHash('sha256').update(readFileSync(file)).digest('hex')!==m.sha256||m.sha256!==guide.audio.asset?.sha256)
      throw Error('MP3 '+edition+' altéré '+name);
    if(m.chapters.length!==7||m.chapters.some((x,i)=>x.id!==ids[i]))throw Error('Horodatages incomplets '+name);
    copy(file);current=m;
  }
  if(recipe.image)copy('public'+recipe.image,true);
  const duration=current?Math.floor(current.durationSec/60)+' min '+Math.round(current.durationSec%60)+' s':'non généré';
  summary.push('| '+guide.title+' | OUI | '+(current?'OUI, préécoute':'NON')+' | '+duration+' |');
  const out=['# '+guide.title,'','Statut : '+guide.status+'. '+(current?'MP3 de la version courante en préécoute, écoute humaine non attestée.':'Texte corrige a approuver ; les anciens MP3 sont archives hors de ce dossier, et aucun MP3 ne correspond encore au script corrige.'),'',
    'Recette : '+recipe.title+' — origine : src/data/recipes.ts.','Objectif : '+guide.learningGoal,'Résultat : '+guide.finalPreparation,
    'Durée estimée de l’atelier : environ '+guide.duration.practicalMinutes+' min.','',
    'Cuisson et repos : '+guide.duration.waitingNote,'',
    '## Matériel',...guide.equipment.map(x=>'- '+x),'',
    '## Avant de commencer',...guide.beforeStarting.map(x=>'- '+x),'',
    '## Ingrédients adaptables','',
    'Quantités calculées depuis la recette source ; Kroeung : rendement en petits pots.','',
    '| Ingrédient | 1 | 2 | 4 | 6 | 8 | 12 |','|---|---:|---:|---:|---:|---:|---:|'];
  for (const item of ingredients(name,recipe.ingredients)){
    if(typeof item.quantity!=='number')throw Error('Ingrédient impossible à adapter : '+name+'/'+item.name);
    const suffix=(item.unit||'');
    const amounts=[1,2,4,6,8,12].map(n=>qty(item.quantity*n/recipe.baseServings)+' '+suffix);
    out.push('| '+item.name+(item.note?' ('+item.note+')':'')+' | '+amounts.join(' | ')+' |');
  }
  if(name==='samlor-machu')out.push('','**Variante : choisir soit l’ananas, soit la courgette (ne pas additionner les deux).**');
  out.push('','## Allergènes',...(guide.allergens.items.length?guide.allergens.items.map(x=>'- '+x):['Aucun identifié pour la recette, vérifier les produits choisis.']),
    '','## Sécurité',...guide.safety.map(x=>'- '+x),'','## Six étapes de préparation');
  for(const [i,phase] of guide.phases.entries()){
    out.push('','### Étape '+(i+1)+' sur 6 — '+phase.title+' (environ '+phase.minutes+' min)','',
      '**À faire :**','',...phase.actions.map(x=>'- '+x),'',
      '**À observer :** '+phase.observe,'**Résultat attendu :** '+phase.check,'**À éviter :** '+phase.mistake,
      '**Si besoin :** '+phase.recovery,'**Ce que vous apprenez :** '+phase.learning,'**Précaution :** '+phase.safety);
  }
  out.push('','## Narration corrigée — sept chapitres à valider avant l’enregistrement','','### Chapitre 1 sur 7 — Introduction','',guide.audio.intro);
  for(const [i,phase] of guide.phases.entries())out.push('','### Chapitre '+(i+2)+' sur 7 — '+phase.title,'',phase.audioScript);
  if(current){
    out.push('','## Chapitrage MP3 mesuré','',
      '| Chapitre | Début (s) | Fin (s) |','|---|---:|---:|',
      ...current.chapters.map(c=>'| '+c.id+' | '+c.startSec+' | '+c.endSec+' |'),
      '','**MP3 :** '+current.audioUrl,'**SHA-256 :** '+current.sha256);
  }else out.push('','## MP3 V2','','Ces textes sont en attente de validation écrite avant tout nouvel enregistrement. Les MP3 précédents sont conservés séparément et ne correspondent plus à ces textes.');
  out.push('','## Sources de cuisine','',...((guide.sources.culinaryReferences||[]).map(x=>'- '+x.title+' : '+x.url)),
    '','## Sources de sécurité','',...((guide.sources.safetyReferences||[]).map(x=>'- '+x.title+' : '+x.url)),
    '','**Ce cours reste en brouillon sans validation d’écoute, essai culinaire ou publication OVH.**');
  const target=join(base,'FICHES-ATELIERS',name+'-COURS-COMPLET.md');
  mkdirSync(dirname(target),{recursive:true});
  writeFileSync(target,out.join('\n')+'\n');
}
const required=[
  'src/data/recipes.ts',
  'src/pages/apprendre/pratique/[slug].astro',
  'src/data/workshopPresentation.ts',
  'src/data/cookingWorkshopGuides.ts',
  'src/components/CookingWorkshopAudio.astro',
  'src/scripts/cookingWorkshopServings.ts',
  'scripts/bridge-cooking-workshops-coral.mjs',
  'scripts/check-workshop-blueprints.mjs',
  'scripts/check-new-cooking-workshop-audio.mjs',
  'scripts/check-culinary-lexicon.mjs',
  'docs/ateliers/VALIDATION-RECETTES-ET-NARRATIONS-V2.md',
  ...names.filter(name=>name!=='lok-lak').map(name=>'docs/ateliers/a-valider/'+name+'-recette-et-narration.md'),
  'tests/ateliers-cinq-browser.test.mjs',
  'docs/ateliers/REFERENTIEL-ATELIER-CUISINE-ET-MP3.md',
  'docs/ateliers/REFERENTIEL-NARRATION-IMMERSIVE-V2.md',
  'docs/ateliers/PROMPT-CONTINUATION-CINQ-ATELIERS-V2.md',
  'docs/ateliers/scripts/lok-lak-coral-v2-preproduction.md'
];
required.forEach(x=>copy(x));
summary.push('','## Contenu du ZIP','','- FICHES-ATELIERS : six cours complets Markdown, avec ingrédients adaptables, gestes, remédiations, sept scripts et sources.',
'- src/data/atelier-recette-guides : les six fichiers JSON originaux des nouveaux cours.',
'- src/data/atelier-recette-audio et public/audio/workshops : seules les V2 actives sont exportées ; les capsules courtes V1 obsolètes ont été retirées.',
'- src/pages/apprendre/pratique et src/components : pages sources Astro et mini-lecteur mobile synchronisé.',
'- docs/ateliers : référentiels obligatoires et étalon Lok Lak.',
'','**Aucun ancien MP3 des cinq scripts corrigés n’est fourni comme s’il correspondait aux nouveaux textes. Aucune nouvelle synthese, aucun deploiement OVH ni publication Meta.**');
writeFileSync(join(base,'LIRE-EN-PREMIER.md'),summary.join('\n')+'\n');
console.log('EXPORT_SIX_COURSES_SUCCESS',names.length,'courses,',summary.filter(x=>x.includes('| OUI, préécoute')).length,'V2 recordings');
