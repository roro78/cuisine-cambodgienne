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
await writeFile(dataPath,culture,'utf8');
await writeFile(templatePath,template,'utf8');
console.log('APPLY_PASS : nouvelles couvertures C03/C06, alt, dimensions, responsive et actifs sociaux anciens conservés.');
