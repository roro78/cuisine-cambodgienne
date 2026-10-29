#!/usr/bin/env node
/**
 * CMS OVH reception: anonymous and READ ONLY.
 * --dir dist checks a built Astro tree; --url https://... checks a live host.
 * This never logs HTML bodies, accepts credentials, POSTs or triggers publication.
 */
import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const names=['social-feed.json','editorial-source-index.json','editorial-guided-fields.json'];
const sensitiveKeys=new Set(['audioScript','sources','sourceReferences','culinaryReferences',
  'github_token','password_hash','secret','private_config','service_role','access_token']);
function plain(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
function fail(reason){throw new Error(reason);}
function requireKeys(item,allowed,required=allowed){
  if(!plain(item) || Object.keys(item).some(k=>!allowed.includes(k))
    || required.some(k=>!(k in item)))fail('UNEXPECTED_KEYS');
}
export function verifyCmsIndexes(feeds) {
  const [social,canonical,guided]=names.map(n=>feeds[n]);
  if(social?.product!=='cuisine-du-cambodge'||social?.schemaVersion!==1
     || !Array.isArray(social.items)||!social.items.length||social.items.length>250)
    fail('SOCIAL_FEED_INVALID');
  if(canonical?.product!=='cuisine-du-cambodge'||canonical?.schemaVersion!==1
     || canonical?.digest!=='sha256-full-astro-record-v1'
     || !Array.isArray(canonical.items)||canonical.items.length!==social.items.length)
    fail('CANONICAL_FEED_INVALID');
  if(guided?.product!=='cuisine-du-cambodge'||guided?.schemaVersion!==1
     || guided?.dataContract!=='approved-public-form-fields-v2'
     || !Array.isArray(guided.items)||guided.items.length>250)
    fail('GUIDED_FEED_INVALID');
  const socialIds=new Set;
  for(const item of social.items){
    if(!plain(item)||typeof item.id!=='string'||socialIds.has(item.id)
      || !/^(recette|culture|atelier|ingredient|technique):[a-z0-9-]+$/.test(item.id)
      || !/^[0-9a-f]{16}$/.test(item.fingerprint))fail('SOCIAL_ID_INVALID');
    socialIds.add(item.id);
  }
  const canonicalById=new Map;
  for(const item of canonical.items){
    requireKeys(item,['id','kind','model','fingerprint']);
    if(!socialIds.has(item.id)||canonicalById.has(item.id)
      || item.kind!==item.id.split(':')[0]
      || !/^[0-9a-f]{64}$/.test(item.fingerprint)
      || !['recipes','restoredRecipes','culture','workshops','cookingWorkshopGuides',
        'ingredients','recipeTechniques'].includes(item.model))fail('CANONICAL_ID_INVALID');
    canonicalById.set(item.id,item);
  }
  if(canonicalById.size!==socialIds.size)fail('CANONICAL_MISSING_ID');
  const guidedIds=new Set;
  for(const item of guided.items){
    requireKeys(item,['id','model','fingerprint','editable','fields']);
    const base=canonicalById.get(item.id);
    if(!base || guidedIds.has(item.id) || item.model!==base.model
       || item.fingerprint!==base.fingerprint || typeof item.editable!=='boolean'
       || !plain(item.fields)||!['recette','atelier','culture','ingredient','technique'].includes(item.id.split(':')[0])
       || !['recipes','restoredRecipes','workshops','cookingWorkshopGuides','culture','ingredients','recipeTechniques'].includes(item.model)
       || item.editable!==true)
      fail('GUIDED_DIGEST_MISMATCH');
    guidedIds.add(item.id);
    const allowed={
      recipes:['intro','description','context','beforeYouStart','prepHeading',
        'servingTip','servingHeading','servingsLabel','moment','location','keyPoints',
        'notes','substitutions','equipment','faqs','baseServings','prepTime',
        'cookTime','ingredients','steps'],
      restoredRecipes:['kicker','description','intro','servings','imageCaption',
        'tips','prepTime','cookTime','ingredients','steps'],
      culture:['eyebrow','intro','seoDescription','readingTime','sections'],
      ingredients:['intro','seoDescription','role','deepDive','profile','uses',
        'tips','choose','keep','pairings','mistakes','seoKeywords'],
      recipeTechniques:['description','introduction','preparation','yieldLabel',
        'supplies','steps','alternatives','questions'],
      workshops:['steps'],
      cookingWorkshopGuides:['finalPreparation','learningGoal','portionLabel',
        'beforeStarting','equipment','phases']
    };
    const required={
      recipes:['intro','description','context','baseServings','prepTime','cookTime','ingredients','steps'],
      restoredRecipes:['description','intro','prepTime','cookTime','ingredients','steps'],
      culture:['eyebrow','intro','seoDescription','sections'],
      ingredients:['intro','seoDescription','role','uses'],
      recipeTechniques:['description','introduction','steps'],
      workshops:['steps'],
      cookingWorkshopGuides:['finalPreparation','learningGoal','phases']
    };
    requireKeys(item.fields,allowed[item.model],required[item.model]);
    const fields=JSON.stringify(item.fields);
    for(const key of sensitiveKeys)if(fields.includes('"'+key+'":'))fail('GUIDED_PRIVATE_FIELDS');
  }
  // Every published canonical content must inherit the same guided editor.
  // A future recipe/Carnet/atelier cannot silently fall back to a raw JSON form.
  // Check exact ID equality, not a fixed count (35 is today's snapshot only).
  if(guidedIds.size!==canonicalById.size
     || [...canonicalById.keys()].some(id=>!guidedIds.has(id)))
    fail('GUIDED_COVERAGE_INCOMPLETE');
  return {social:social.items.length,canonical:canonical.items.length,guided:guided.items.length};
}
export function verifyCmsLogin({status,headers,body}){
  if(status!==200)fail('CMS_LOGIN_HTTP_'+status);
  const h=(key)=>headers.get(key)||'';
  if(!h('content-type').toLowerCase().includes('text/html'))fail('CMS_HTML_REQUIRED');
  if(!h('cache-control').includes('no-store'))fail('CMS_CACHE_CONTROL_MISSING');
  if(!h('x-robots-tag').includes('noindex'))fail('CMS_ROBOTS_MISSING');
  if(!h('content-security-policy').includes("default-src 'none'"))fail('CMS_CSP_MISSING');
  if(!body.includes('Connexion administrateur')||!body.includes('name="csrf"')
    || !body.includes('name="password"'))fail('CMS_LOGIN_FORM_MISSING');
  if(body.includes('<?php')||body.includes('cmsSave(')
    || body.includes('editorial-drafts/') || body.includes('password_hash')
    || body.includes('github_token'))fail('CMS_SOURCE_OR_SECRET_EXPOSED');
  return {login:'login_only',csrf:true,https:true};
}
async function getRemote(origin,{fetcher=fetch}={}){
  const base=new URL(origin);
  if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash
    ||base.pathname!=='/'||base.port)fail('HTTPS_HOST_REQUIRED');
  const out={};
  for(const name of names){
    const response=await fetcher(new URL(name,base),{
      method:'GET',redirect:'error',signal:AbortSignal.timeout(12000),
      headers:{Accept:'application/json','Cache-Control':'no-cache'}});
    if(!response.ok)fail('HTTP_'+name+'_'+response.status);
    const type=response.headers.get('content-type')||'';
    if(!type.includes('json'))fail('CONTENT_TYPE_'+name);
    const raw=await response.text();
    if(raw.length>524288)fail('JSON_TOO_LARGE_'+name);
    try{out[name]=JSON.parse(raw);}
    catch{fail('INVALID_JSON_'+name);}
  }
  const counts=verifyCmsIndexes(out);
  const response=await fetcher(new URL('gestion-contenus/',base),{
    method:'GET',redirect:'error',signal:AbortSignal.timeout(12000),
    headers:{Accept:'text/html','Cache-Control':'no-cache'}});
  const html=await response.text();
  if(html.length>262144)fail('CMS_LOGIN_TOO_LARGE');
  verifyCmsLogin({status:response.status,headers:response.headers,body:html});
  // Private PHP implementation must never be served or accessible directly.
  for(const privateModule of ['lib.php','publication-gap-audit.php']){
    const result=await fetcher(new URL('gestion-contenus/'+privateModule,base),{
      method:'GET',redirect:'error',signal:AbortSignal.timeout(12000)});
    const body=await result.text();
    if(result.status===200 || body.includes('<?php'))
      fail('CMS_PRIVATE_MODULE_EXPOSED_'+privateModule);
  }
  return {...counts,login:'protected',library:'blocked'};
}
async function getDist(dir){
  const out={};
  for(const name of names){
    const path=join(dir,name);
    const info=await stat(path);
    if(!info.isFile()||info.size>524288)fail('DIST_JSON_SIZE_'+name);
    out[name]=JSON.parse(await readFile(path,'utf8'));
  }
  const counts=verifyCmsIndexes(out);
  for(const name of ['index.php','lib.php','publication-gap-audit.php','.htaccess']){
    const path=join(dir,'gestion-contenus',name);
    if(!(await stat(path)).isFile())fail('CMS_PHP_FILE_MISSING_'+name);
  }
  const ht=await readFile(join(dir,'gestion-contenus','.htaccess'),'utf8');
  for(const module of ['lib.php','publication-gap-audit.php']){
    const tag='<Files "'+module+'">';
    const begin=ht.indexOf(tag);
    const end=ht.indexOf('</Files>',begin);
    if(begin<0||end<0||!ht.slice(begin,end).includes('Require all denied'))
      fail('CMS_APACHE_PROTECTION_MISSING_'+module);
  }
  return counts;
}
export async function cmsReception({dir,url,fetcher}={}){
  if(Boolean(dir)===Boolean(url))fail('CHOOSE_DIR_OR_URL');
  return dir?getDist(resolve(dir)):getRemote(url,{fetcher});
}
async function main(){
  const args=process.argv.slice(2);
  const flag=args[0],value=args[1];
  if(args.length!==2||!['--dir','--url'].includes(flag)||!value)
    fail('USAGE_--dir_DIST_OR_--url_HTTPS');
  const mode=flag==='--dir'?'local_build':'remote_ovh';
  try{
    const result=await cmsReception(flag==='--dir'?{dir:value}:{url:value});
    process.stdout.write('CMS_OVH_RECEPTION_PASS '+JSON.stringify({mode,...result})+'\n');
  }catch(e){
    process.stderr.write('CMS_OVH_RECEPTION_BLOCKED '+JSON.stringify({
      mode,reason:e instanceof Error?e.message:'UNKNOWN'
    })+'\n');
    process.exitCode=1;
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
  await main();
