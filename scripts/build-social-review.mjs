/** Offline social editorial reviewer.
 * Reuses the actual build-time catalog, actual 4:5 generated JPEGs and the
 * real Workflow 01 validator fallback. No HTTP calls or Meta/n8n writes.
 */
import { build } from 'esbuild';
import sharp from 'sharp';
import vm from 'node:vm';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ids = ['ingredient:kroeung','recette:amok-trey','culture:le-riz-symbole-de-vie-au-cambodge'];
const catalogBundle = await build({
  entryPoints:[path.join(root,'src/data/socialCatalog.ts')],
  bundle:true, platform:'node', format:'esm', write:false, logLevel:'error'
});
const encoded=Buffer.from(catalogBundle.outputFiles[0].text).toString('base64');
const {getSocialCatalog}=await import('data:text/javascript;base64,'+encoded);
const catalog=getSocialCatalog();
const workflow=JSON.parse(await readFile(path.join(root,'automation/n8n/01-drafts-email-approval.json'),'utf8'));
if(workflow.active)throw Error('social_preview_refuses_active_workflow');
const validatorNodes=workflow.nodes.filter(n=>n.name==='Vérifier et cadrer les textes');
if(validatorNodes.length!==1||typeof validatorNodes[0].parameters?.jsCode!=='string')
  throw Error('social_preview_validator_missing');
const runValidator=(source)=>{
  const selection={json:{source,sourceId:source.id,scheduledDate:'PREVIEW_ONLY',fingerprint:source.fingerprint,imageUrl:source.imageUrl}};
  const output=vm.runInNewContext('(function(){'+validatorNodes[0].parameters.jsCode+'\n})()',{
    $:name=>{
      if(name!=='Choisir un contenu original')throw Error('social_preview_unexpected_workflow_dependency');
      return {first:()=>selection};
    },
    $input:{first:()=>({json:{choices:[]}})}
  },{timeout:1000});
  if(!Array.isArray(output)||output.length!==1||output[0]?.json?.generationMode!=='catalogue_deterministe')
    throw Error('social_preview_unreviewed_caption_mode');
  const result=output[0].json;
  for(const fact of result.claimsUsed||[])
    if(!source.facts.includes(fact))throw Error('social_preview_unverified_fact');
  if(!result.facebookCaption||!result.instagramCaption)throw Error('social_preview_empty_caption');
  return result;
};
const reviews=[];
for(const id of ids){
  const matching=catalog.filter(item=>item.id===id);
  if(matching.length!==1)throw Error('social_preview_missing_source:'+id);
  const source=matching[0];
  if(!source.imageUrl||!/^https:\/\/www\.cuisine-du-cambodge\.com\/social-assets\/[a-z0-9-]+\.jpg$/.test(source.imageUrl))
    throw Error('social_preview_invalid_source_image:'+id);
  const file=path.join(root,'public/social-assets',id.replace(':','-')+'.jpg');
  const bytes=await readFile(file);
  const info=await sharp(bytes).metadata();
  if(info.format!=='jpeg'||info.width!==1080||info.height!==1350)
    throw Error('social_preview_invalid_image_dimensions:'+id);
  const caption=runValidator(source);
  reviews.push({
    id,title:source.title,
    imageAlt:'Visuel social pour '+source.title,
    imageRole:source.imageRole,
    imageLabel:source.title,
    imageData:'data:image/jpeg;base64,'+bytes.toString('base64'),
    facebookCaption:caption.facebookCaption,instagramCaption:caption.instagramCaption
  });
}
if(reviews.length!==3)throw Error('social_preview_incomplete');
const template=await readFile(path.join(root,'scripts/social-review-template.html'),'utf8');
const marker='__CUISINE_REVIEW_PAYLOAD__';
if(template.split(marker).length!==2)throw Error('social_preview_template_missing_marker');
const payload=JSON.stringify(reviews).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
const output=template.replace(marker,payload);
const outdir=path.join(root,'artifacts');
await mkdir(outdir,{recursive:true});
const outfile=path.join(outdir,'social-editorial-review.html');
await writeFile(outfile,output,{encoding:'utf8',flag:'w'});
console.log('social-review: 6 offline previews; actual JPEG 1080x1350; saved '+outfile+'; no Meta, n8n, Resend or DB calls');