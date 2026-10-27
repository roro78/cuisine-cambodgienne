import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifyCmsIndexes,verifyCmsLogin,cmsReception} from '../scripts/check-cms-ovh-readiness.mjs';
import {packageCmsRelease} from '../scripts/package-cms-ovh-release.mjs';

const sha='a'.repeat(64),source='recette:amok-trey',model='recipes';
function fixture(){
 const social={product:'cuisine-du-cambodge',schemaVersion:1,
  items:[{id:source,kind:'recette',fingerprint:'b'.repeat(16)}]};
 const canonical={product:'cuisine-du-cambodge',schemaVersion:1,
  digest:'sha256-full-astro-record-v1',
  items:[{id:source,kind:'recette',model,fingerprint:sha}]};
 const guided={product:'cuisine-du-cambodge',schemaVersion:1,
  dataContract:'approved-public-form-fields-v1',
  items:[{id:source,model,fingerprint:sha,editable:true,
   fields:{baseServings:4,prepTime:'30 min',cookTime:'25 min',
    ingredients:[{quantity:600,unit:'g',name:'poisson'}],
    steps:[{title:'Préparer',text:'Mélanger'}]}}]};
 return {'social-feed.json':social,'editorial-source-index.json':canonical,
  'editorial-guided-fields.json':guided};
}
const login='<html><p>Connexion administrateur</p><input name="csrf"><input name="password"></html>';
const safeHeaders=new Headers({'content-type':'text/html; charset=UTF-8',
 'cache-control':'no-store, private','x-robots-tag':'noindex, nofollow',
 'content-security-policy':"default-src 'none'; form-action 'self'"});
test('reject missing, stale and leaked public indexes',()=>{
 const feeds=fixture();
 assert.deepEqual(verifyCmsIndexes(feeds),{social:1,canonical:1,guided:1});
 feeds['editorial-guided-fields.json'].items[0].fingerprint='f'.repeat(64);
 assert.throws(()=>verifyCmsIndexes(feeds),/GUIDED_DIGEST_MISMATCH/);
 feeds['editorial-guided-fields.json'].items[0].fingerprint=sha;
 feeds['editorial-guided-fields.json'].items[0].fields.audioScript='private';
 assert.throws(()=>verifyCmsIndexes(feeds),/GUIDED_PRIVATE_FIELDS/);
 feeds['editorial-guided-fields.json'].items[0].fields={baseServings:4};
 assert.throws(()=>verifyCmsIndexes(feeds),/UNEXPECTED_KEYS/);
});
test('the unauthenticated CMS returns only a private-login screen',()=>{
 assert.deepEqual(verifyCmsLogin({status:200,headers:safeHeaders,body:login}),
  {login:'login_only',csrf:true,https:true});
 assert.throws(()=>verifyCmsLogin({status:503,headers:safeHeaders,body:login}),
  /CMS_LOGIN_HTTP_503/);
 assert.throws(()=>verifyCmsLogin({status:200,headers:safeHeaders,body:'<?php '.$login}),
  /CMS_SOURCE_OR_SECRET_EXPOSED/);
 assert.throws(()=>verifyCmsLogin({status:200,headers:new Headers,body:login}),
  /CMS_HTML_REQUIRED/);
});
test('remote verification fetches only public pages and checks library denial',async()=>{
 const feeds=fixture(),requested=[];
 const fetcher=async url=>{
  const pathname=new URL(url).pathname;
  requested.push(pathname);
  if(pathname==='/gestion-contenus/lib.php')return new Response('Denied',{status:403});
  if(pathname==='/gestion-contenus/')return new Response(login,{status:200,headers:safeHeaders});
  const document=feeds[pathname.slice(1)];
  if(document)return new Response(JSON.stringify(document),{status:200,
   headers:{'content-type':'application/json'}});
  return new Response('',{status:404});
 };
 const result=await cmsReception({url:'https://www.cuisine-du-cambodge.com/',fetcher});
 assert.deepEqual(result,{social:1,canonical:1,guided:1,login:'protected',library:'blocked'});
 assert.equal(requested.length,5);
 const unavailable=async()=>new Response('',{status:404});
 await assert.rejects(cmsReception({url:'https://www.cuisine-du-cambodge.com/',fetcher:unavailable}),
  /HTTP_social-feed.json_404/);
 await assert.rejects(cmsReception({url:'http://example.com/',fetcher}),/HTTPS_HOST_REQUIRED/);
});
test('release package includes exactly six public files and private rollback manifest',async()=>{
 const root=await mkdtemp(join(tmpdir(),'cdc-ovh-'));
 try{
  const dist=join(root,'dist'),out=join(root,'package');
  await mkdir(join(dist,'gestion-contenus'),{recursive:true});
  const feeds=fixture();
  for(const [name,value] of Object.entries(feeds))
   await writeFile(join(dist,name),JSON.stringify(value));
  await writeFile(join(dist,'gestion-contenus','index.php'),'<?php echo "private";');
  await writeFile(join(dist,'gestion-contenus','lib.php'),'<?php function example(){}');
  await writeFile(join(dist,'gestion-contenus','.htaccess'),
   '<Files "lib.php">\nRequire all denied\n</Files>\n');
  const packageInfo=await packageCmsRelease({dist,out});
  assert.equal(packageInfo.files.length,6);
  assert.equal(packageInfo.requires.manualUpload,true);
  assert.equal((await cmsReception({dir:out})).social,1);
  const manifest=JSON.parse(await readFile(join(out,'CMS-OVH-MANIFEST.json'),'utf8'));
  assert.equal(manifest.contract,'cdc-ovh-cms-bundle-v1');
  assert.match(await readFile(join(out,'README.txt'),'utf8'),/BACK UP/);
 }finally{await rm(root,{recursive:true,force:true})}
});
