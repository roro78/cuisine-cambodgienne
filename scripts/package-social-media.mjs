#!/usr/bin/env node
/**
 * #121: offline package of the already qualified social JPEGs.
 * No server, network call, database change, n8n activation or Meta write.
 * Use the real daily selector as the only source of eligibility.
 */
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile,lstat,realpath} from 'node:fs/promises';
import {resolve,dirname,join,relative,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import sharp from 'sharp';
import {inspectSocialDimensions} from './social-image-layout.mjs';

const SITE='https://www.cuisine-du-cambodge.com';
const SOURCE=/^(?:recette|ingredient|culture|atelier|technique):[a-z0-9-]+$/;
const SHA=/^[a-f0-9]{64}$/;
const JPEG=/^https:\/\/www\.cuisine-du-cambodge\.com\/social-assets\/([a-z0-9-]+\.jpg)$/;
const ORIGINAL=/^\/images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:webp|jpe?g|png)$/i;
const MAX_JPEG=8*1024*1024;
const MAX_ORIGINAL=32*1024*1024;
const root=fileURLToPath(new URL('../',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const ensure=(condition,message)=>{if(!condition)throw Error(message);};
const inside=(parent,child)=>{
  const rel=relative(parent,child);
  return rel===''||(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('../')&&!rel.startsWith('..\\'));
};

/** Evaluate the checked-in selector with each catalogue entry in isolation.
 * Empty history is intentional: this is a package, never a publication decision.
 * The selector still controls rights, source identity, original path and asset version.
 */
export function selectQualifiedMedia(feed,workflow){
  ensure(feed?.product==='cuisine-du-cambodge'&&feed.schemaVersion===1&&Array.isArray(feed.items),'media_catalogue_invalid');
  ensure(feed.items.length<=10000,'media_catalogue_too_large');
  const selectors=workflow?.nodes?.filter(n=>n.name==='Choisir un contenu original'&&n.type==='n8n-nodes-base.code')??[];
  ensure(selectors.length===1&&typeof selectors[0].parameters?.jsCode==='string','media_selector_invalid');
  const seen=new Set(),qualified=[],excluded=[];
  for(const entry of feed.items){
    ensure(typeof entry?.id==='string'&&SOURCE.test(entry.id)&&!seen.has(entry.id),'media_catalogue_id_invalid');
    seen.add(entry.id);
    let result;
    try{
      result=runInNewContext('(function(){\n'+selectors[0].parameters.jsCode+'\n})()',{
        $:name=>{
          ensure(name==='Lire le catalogue du site','media_selector_node_unexpected');
          return {first:()=>({json:{...feed,items:[entry]}})};
        },
        $input:{all:()=>[]}
      },{timeout:1000});
    }catch(error){
      if(error?.message==='aucune_source_inedite_aux_droits_verifies'){
        excluded.push(entry.id);
        continue;
      }
      throw error;
    }
    ensure(Array.isArray(result)&&result.length===1&&result[0]?.json?.sourceId===entry.id,'media_selector_result_invalid');
    const chosen=JSON.parse(JSON.stringify(result[0].json));
    ensure(chosen.fingerprint===entry.fingerprint&&chosen.source?.id===entry.id,'media_selector_identity_mismatch');
    qualified.push(chosen);
  }
  ensure(qualified.length>0,'media_no_qualified_asset');
  return {qualified,excluded};
}

async function safeRead(base,rel,limit){
  const file=resolve(base,rel);
  ensure(file!==base&&inside(base,file),'media_path_escape');
  const info=await lstat(file);
  ensure(info.isFile()&&!info.isSymbolicLink()&&await realpath(file)===file,'media_file_not_regular:'+rel);
  ensure(info.size>0&&info.size<=limit,'media_file_size_invalid:'+rel);
  const bytes=await readFile(file);
  ensure(bytes.length===info.size,'media_file_changed:'+rel);
  return bytes;
}

/** Stage into a new private directory. Only its assets/ child is intended to be served.
 * All validation precedes the first output write. Never replace existing output or source files.
 */
export async function createSocialMediaBundle({publicDir,outputDir,qualified,excluded=[]}){
  const base=await realpath(publicDir);
  const requested=resolve(outputDir);
  const out=join(await realpath(dirname(requested)),requested.split(/[\\/]/).pop());
  ensure(!inside(base,out),'media_output_inside_public');
  ensure(Array.isArray(qualified)&&qualified.length>0&&qualified.length<=1000,'media_selections_invalid');
  ensure(Array.isArray(excluded)&&excluded.every(id=>typeof id==='string'&&SOURCE.test(id)),'media_excluded_invalid');
  const seen=new Set(),objects=new Map(),entries=[];
  for(const selected of qualified){
    const id=selected?.sourceId;
    const rights=selected?.source?.socialRights;
    ensure(typeof id==='string'&&SOURCE.test(id)&&!seen.has(id)&&selected.source.id===id,'media_source_invalid');
    seen.add(id);
    ensure(/^[a-f0-9]{16}$/.test(selected.fingerprint??'')&&selected.source.fingerprint===selected.fingerprint,'media_fingerprint_invalid:'+id);
    ensure(rights?.approved===true&&SHA.test(rights.sha256??'')&&SHA.test(rights.originalSha256??'')&&
      ['author','license','original','adaptation','credit'].every(k=>typeof rights[k]==='string'&&rights[k].trim()),'media_rights_invalid:'+id);
    const match=JPEG.exec(selected.imageUrl??'');
    ensure(match&&selected.source.imageUrl===selected.imageUrl,'media_url_invalid:'+id);
    const [kind,slug]=id.split(':');
    ensure(match[1].startsWith(kind+'-'+slug+'-'),'media_asset_source_mismatch:'+id);
    ensure(typeof rights.path==='string'&&ORIGINAL.test(rights.path)&&
      selected.source.originalImageUrl===SITE+rights.path,'media_original_invalid:'+id);

    const bytes=await safeRead(base,'social-assets/'+match[1],MAX_JPEG);
    ensure(sha(bytes)===rights.sha256,'media_digest_mismatch:'+id);
    const original=await safeRead(base,rights.path.slice(1),MAX_ORIGINAL);
    ensure(sha(original)===rights.originalSha256,'media_original_digest_mismatch:'+id);
    const image=sharp(bytes,{limitInputPixels:1080*1080,failOn:'error'});
    const meta=await image.metadata();
    ensure(meta.format==='jpeg','media_not_jpeg:'+id);
    inspectSocialDimensions(meta,id);
    // Force full pixel decoding; header metadata alone is not enough.
    await image.raw().toBuffer();
    const name=rights.sha256+'.jpg';
    objects.set(name,bytes);
    entries.push({sourceId:id,fingerprint:selected.fingerprint,approvedImageUrl:selected.imageUrl,
      sha256:rights.sha256,bytes:bytes.length,path:'assets/'+name,
      author:rights.author,license:rights.license,original:rights.original,adaptation:rights.adaptation});
  }
  ensure(excluded.every(id=>!seen.has(id)),'media_excluded_conflict');
  entries.sort((a,b)=>a.sourceId.localeCompare(b.sourceId));
  const manifest={schemaVersion:1,product:'cuisine-du-cambodge',entries,excluded:[...new Set(excluded)].sort()};
  await mkdir(out,{mode:0o700}); // exclusive: no overwrite or live-directory update
  const assets=join(out,'assets');
  await mkdir(assets,{mode:0o755});
  for(const [name,bytes] of objects)await writeFile(join(assets,name),bytes,{flag:'wx',mode:0o644});
  // Write the manifest last. An incomplete staging directory is never a valid package.
  await writeFile(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
  return manifest;
}

export async function loadLocalSocialMedia(){
  const {build}=await import('esbuild');
  const bundled=await build({entryPoints:[join(root,'src/data/socialCatalog.ts')],
    bundle:true,platform:'node',format:'esm',write:false,logLevel:'error'});
  const {getSocialCatalog}=await import('data:text/javascript;base64,'+
    Buffer.from(bundled.outputFiles[0].text).toString('base64'));
  const workflow=JSON.parse(await readFile(join(root,'automation/n8n/01-drafts-email-approval.json'),'utf8'));
  return selectQualifiedMedia({product:'cuisine-du-cambodge',schemaVersion:1,items:getSocialCatalog()},workflow);
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  try{
    ensure(process.argv.length===3,'Usage: node scripts/package-social-media.mjs /path/to/new-private-staging-directory');
    const selected=await loadLocalSocialMedia();
    const m=await createSocialMediaBundle({publicDir:join(root,'public'),outputDir:process.argv[2],...selected});
    console.log('SOCIAL_MEDIA_PACKAGE_READY',m.entries.length,'qualified;',m.excluded.length,'excluded; no deployment');
  }catch(error){console.error(error.message);process.exitCode=1;}
}
