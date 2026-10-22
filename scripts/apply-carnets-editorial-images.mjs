/**
 * Import contrôlé des deux couvertures éditoriales validées en conversation.
 * À exécuter sur une branche GitHub NON fusionnée, après extraction des WebP joints.
 * Idempotent, bloque tout asset manquant, corrompu ou interverti.
 * Ne modifie ni les images historiques ni les workflows sociaux.
 */
import assert from 'node:assert/strict';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const apply = process.argv.includes('--apply');
const expectedBranch = 'docs/carnets-c03-c06-images-editoriales-20261022';
if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REF_NAME !== expectedBranch) {
  throw new Error('Branche GitHub non autorisée pour cet import.');
}

const assets = [
  {
    slug:'comprendre-le-kroeung',
    next:'comprendre-amok',
    prefix:'carnet-kroeung-memoire',
    oldImage:'/images/cuisine/kroeung-1600.webp',
    oldAlt:'Plat sauté de légumes et de viande présenté dans une assiette, illustration culinaire non historique',
    newAlt:'Scène illustrative de deux générations autour de la mémoire culinaire cambodgienne, avec des aromates sur une table',
    oldWidth:1600,oldHeight:1067,
    sizes:{
      480:['cc26f91218e498fd7ff2cba7d117c963409a79c03521e326212cf25b4f0476f2',320],
      800:['37d473e7171c3326a72e2953a68565192f80d83fd36ded58895c9967f83aafd9',533],
      1200:['476a0384e44f12c1b921a036def0def3dd1d09091258415ceaa8a7423f7b1b66',800],
      1536:['744e270075e5e0a9039daa0749d6ca937a868b01b3762b419a8d10effeb66440',1024]
    }
  },
  {
    slug:'prahok-fermentation-umami',
    next:'construire-repas-cambodgien',
    prefix:'carnet-prahok-tonle-sap',
    oldImage:'/images/cuisine/prahok-1600.webp',
    oldAlt:'Bol de prahok ktis entouré de crudités, illustration d’un plat et non d’une scène de production',
    newAlt:'Scène illustrative de pêcheurs, vendeuses et embarcations dans un village lacustre inspiré du Tonlé Sap',
    oldWidth:1600,oldHeight:2133,
    sizes:{
      480:['0bc46350066732fca2b5706bab278fbc3934bc382bae2f94fd32485c45fe11b2',320],
      800:['10d0da9c8c8373a2e0f50393e16d32b167d9795e6eec068b8304efa9d6ccf37d',533],
      1200:['97a985a4c41961685203b7f88cae5cee3aae0827505eab133c9578eea7233e94',800],
      1536:['ff9c7f0613ad34d89201119b08ccb2605e7dd7ea968e4ff8f9353124fa90d80c',1024]
    }
  }
];

function replaceExactlyOnce(text, old, next, label) {
  assert.equal(text.split(old).length,2,'Dérive du code ou doublon : '+label);
  return text.replace(old,next);
}
for (const asset of assets) {
  for (const [w,[hash,h]] of Object.entries(asset.sizes)) {
    const name='public/images/cuisine/'+asset.prefix+'-'+w+'.webp';
    const buf=await readFile(name);
    assert.equal(createHash('sha256').update(buf).digest('hex'),hash,'Empreinte invalide : '+name);
    const m=await sharp(buf).metadata();
    assert.equal(m.format,'webp','Format invalide : '+name);
    assert.equal(m.width,Number(w),'Largeur invalide : '+name);
    assert.equal(m.height,h,'Hauteur invalide : '+name);
    console.log('VERIFIED',name,(await stat(name)).size+' bytes');
  }
}
console.log('PRECHECK_PASS 8/8 WebP, SHA-256 et dimensions exacts');
if(!apply) {
  console.log('DRY_RUN : aucune modification du code (ajouter --apply après validation).');
  process.exit(0);
}

const dataPath='src/data/culture.ts';
let culture=await readFile(dataPath,'utf8');
for(const asset of assets) {
  const start=culture.indexOf("    slug: '"+asset.slug+"'");
  const stop=culture.indexOf("    slug: '"+asset.next+"'",start);
  assert.ok(start>=0&&stop>start,'Slug canonique absent : '+asset.slug);
  let current=culture.slice(start,stop);
  const targetImage='/images/cuisine/'+asset.prefix+'-1536.webp';
  const beforeImage="image: '"+asset.oldImage+"'";
  const afterImage="image: '"+targetImage+"'";
  if (current.includes(afterImage)) {
    console.log('ALREADY_APPLIED',asset.slug);
    continue;
  }
  current=replaceExactlyOnce(current,beforeImage,afterImage,asset.slug+' image');
  current=replaceExactlyOnce(current,"imageAlt: '"+asset.oldAlt.replaceAll("'","\\'")+"'","imageAlt: '"+asset.newAlt.replaceAll("'","\\'")+"'",asset.slug+' alt');
  current=replaceExactlyOnce(current,'imageWidth: '+asset.oldWidth+',','imageWidth: 1536,',asset.slug+' width');
  current=replaceExactlyOnce(current,'imageHeight: '+asset.oldHeight+',','imageHeight: 1024,',asset.slug+' height');
  current=replaceExactlyOnce(current,'imageWidths: [480, 800, 1200, 1600],', 'imageWidths: [480, 800, 1200, 1536],\n    socialImage: \''+asset.oldImage+'\',\n    socialImageRole: \'article\',',asset.slug+' social safe');
  culture=culture.slice(0,start)+current+culture.slice(stop);
}
assert.equal([...culture.matchAll(/^    slug: '/gm)].length,7,'Le nombre de slugs des Carnets doit rester sept');

const templatePath='src/pages/culture/[slug].astro';
let template=await readFile(templatePath,'utf8');
const captionAnchor=") : article.slug === 'construire-repas-cambodgien' ? (";
const captionInsert=") : article.slug === 'comprendre-le-kroeung' || article.slug === 'prahok-fermentation-umami' ? (\n            <>Illustration éditoriale de la culture cambodgienne.</>\n          ) : article.slug === 'construire-repas-cambodgien' ? (";
if(!template.includes(captionInsert)) {
  template=replaceExactlyOnce(template,captionAnchor,captionInsert,'caption illustrative culturelle');
}
// Adapt the two editorial contracts only once real binary assets have passed all SHA and dimension checks.
const testPatches=[
  {
    path:'tests/carnets-c03-contract.test.mjs',
    lines:[
      ["assert.match(c03,/image: ","assert.match(c03,/image: '\\/images\\/cuisine\\/carnet-kroeung-memoire-1536\\.webp'/,'Verified editorial hero C03');"],
      ["assert.match(c03,/imageAlt: ","assert.match(c03,/imageAlt: 'Scène illustrative de deux générations/,'New cover should be unmistakably illustrative');"],
      ["assert.doesNotMatch(c03,/socialImage:","assert.match(c03,/socialImage: '\\/images\\/cuisine\\/kroeung-1600\\.webp'/,'Legacy social image preserved');\nassert.match(c03,/socialImageRole: 'article'/);\nfor(const width of [480,800,1200,1536]) assert.ok(existsSync('public/images/cuisine/carnet-kroeung-memoire-'+width+'.webp'),'Missing new C03 variant '+width);"]
    ]
  },
  {
    path:'tests/carnets-c06-contract.test.mjs',
    lines:[
      ["assert.match(c06,/image: ","assert.match(c06,/image: '\\/images\\/cuisine\\/carnet-prahok-tonle-sap-1536\\.webp'/,'Verified editorial hero C06');"],
      ["assert.match(c06,/imageAlt: ","assert.match(c06,/imageAlt: 'Scène illustrative de pêcheurs/,'New cultural illustration should not pretend to be a report photo');"],
      ["assert.match(credits,/Photo : Thomas Wanhoff","assert.match(c06,/socialImage: '\\/images\\/cuisine\\/prahok-1600\\.webp'/,'Legacy social image preserved');\nassert.match(c06,/socialImageRole: 'article'/);\nfor(const width of [480,800,1200,1536]) assert.ok(existsSync('public/images/cuisine/carnet-prahok-tonle-sap-'+width+'.webp'),'Missing new C06 variant '+width);\nassert.match(credits,/Photo : Thomas Wanhoff · CC BY-SA 2\\.0/,'Legacy social image license remains documented');"]
    ]
  }
];
for(const target of testPatches) {
  let t=await readFile(target.path,'utf8');
  for(const [prefix,newText] of target.lines) {
    const line=t.split('\n').filter(x=>x.trimStart().startsWith(prefix));
    assert.equal(line.length,1,'Unexpected test contract shape: '+target.path+' / '+prefix);
    t=replaceExactlyOnce(t,line[0],newText,target.path);
  }
  await writeFile(target.path,t,'utf8');
}

const planPath='docs/carnets/PLAN-REFONTE-CARNETS.md';
let plan=await readFile(planPath,'utf8');
plan=replaceExactlyOnce(plan,'v2.8 (QA finale 7/7 PASS avec photo Kep locale ; D2/D3 non validés)','v2.9 (couvertures éditoriales C03/C06 importées, QA finale à confirmer)','Pilot version');
const marker='## 10. Journal chronologique immuable\n\n### 2026-10-22 — J18';
const entry='## 10. Journal chronologique immuable\n\n### 2026-10-22 — J19 — couvertures C03/C06 illustratives intégrées\n- **Images acceptées en conversation :** C03 scène entre générations autour des aromates, C06 scène lacustre avec pêche et marché, sans tutoriel au mortier. Ce sont des **illustrations éditoriales composées**, non des reportages de personnes ou lieux attestés ; aucune mention de source documentaire en page.\n- **8 WebP vérifiés par SHA-256 et Sharp**, quatre formats 480/800/1200/1536 pour chaque Carnet, 1536×1024 au maximum. Données image, alt et légende mises à jour uniquement sur C03/C06.\n- **Catalogue social préservé :** anciennes photographies C03 et C06 conservées dans socialImage et socialImageRole article. Aucune modification des flux n8n/Meta, d\'Ateliers ni de Recettes.\n- **Gate :** images importées exclusivement sur branche QA à réceptionner, CI/Chromium obligatoires après import ; D2, D3 textes et publication restent ouverts, aucun merge ou OVH.\n\n### 2026-10-22 — J18';
plan=replaceExactlyOnce(plan,marker,entry,'Pilot J19 journal');
await writeFile(planPath,plan,'utf8');
await writeFile(dataPath,culture,'utf8');
await writeFile(templatePath,template,'utf8');
console.log('APPLY_PASS : couvertures C03/C06, contrats éditoriaux et plan J19, images sociales historiques conservées.');
