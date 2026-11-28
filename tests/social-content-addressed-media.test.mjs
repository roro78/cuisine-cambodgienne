import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,readFile,writeFile,rm,readdir,symlink,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {selectQualifiedMedia,loadLocalSocialMedia,createSocialMediaBundle} from '../scripts/package-social-media.mjs';
import {probeSocialMedia} from '../scripts/probe-social-media.mjs';
import {installSocialMediaAssets} from '../scripts/install-social-media-assets.mjs';

const publicDir=fileURLToPath(new URL('../public/',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const SITE='https://www.cuisine-du-cambodge.com';
const temp=async t=>{
  const dir=await mkdtemp(join(tmpdir(),'cdc-social-media-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  return dir;
};
const createJPEG=(width=1080,height=1080)=>sharp({create:{width,height,channels:3,background:'#996643'}}).jpeg().toBuffer();
async function future(t){
  const dir=await temp(t),source=join(dir,'public');
  await mkdir(join(source,'images'),{recursive:true});
  await mkdir(join(source,'social-assets'));
  const original=await createJPEG(1200,900);
  const bytes=await createJPEG();
  const path='/images/future.jpg',filename='recette-future-offline-v99.jpg';
  await writeFile(join(source,'images/future.jpg'),original);
  await writeFile(join(source,'social-assets',filename),bytes);
  const imageUrl=SITE+'/social-assets/'+filename,sourceId='recette:future-offline',fingerprint='0123456789abcdef';
  const qualified=[{sourceId,fingerprint,imageUrl,source:{id:sourceId,fingerprint,imageUrl,originalImageUrl:SITE+path,
    socialRights:{approved:true,path,sha256:sha(bytes),originalSha256:sha(original),author:'Fixture',
      license:'Création éditoriale interne',original:SITE+path,adaptation:'Fixture',credit:'Fixture hors production'}}}];
  return {dir,publicDir:source,outputDir:join(dir,'bundle'),qualified,bytes,filename};
}

test('reuse the real catalogue and daily rights gate; stage every currently qualified JPEG including Kep v2',async t=>{
  const dir=await temp(t);
  const selected=await loadLocalSocialMedia();
  const outputDir=join(dir,'bundle');
  const manifest=await createSocialMediaBundle({publicDir,outputDir,...selected});
  assert.equal(manifest.entries.length,selected.qualified.length);
  assert.ok(manifest.entries.length>=12);
  assert.ok(manifest.excluded.length>0);
  assert.ok(manifest.entries.some(e=>e.sourceId==='culture:kep-marche-crabe-poivre'&&e.approvedImageUrl.endsWith('-v20261127.jpg')));
  for(const entry of manifest.entries){
    assert.equal(entry.path,'assets/'+entry.sha256+'.jpg');
    const data=await readFile(join(outputDir,entry.path));
    assert.equal(sha(data),entry.sha256);
    assert.equal(data.length,entry.bytes);
    const original=await readFile(join(publicDir,'social-assets',entry.approvedImageUrl.split('/').pop()));
    assert.deepEqual(data,original); // never recode or alter an approval asset
  }
  assert.deepEqual(JSON.parse(await readFile(join(outputDir,'manifest.json'),'utf8')),manifest);
  assert.ok((await readdir(join(outputDir,'assets'))).every(name=>/^[a-f0-9]{64}\.jpg$/.test(name)));
});

test('the actual selector does not trust a forged rights record from the public feed',async()=>{
  const workflow=JSON.parse(await readFile(new URL('../automation/n8n/01-drafts-email-approval.json',import.meta.url),'utf8'));
  const source={id:'recette:amok-trey',kind:'recette',fingerprint:'1234123412341234',
    title:'Amok',url:SITE+'/recettes/amok-trey/',
    facts:['Le poisson cuit doucement à la vapeur avec des ingrédients soigneusement préparés.'],
    originalImageUrl:SITE+'/images/cuisine/v19-amok-trey-1440.webp',imageUrl:SITE+'/social-assets/recette-amok-trey.jpg'};
  const forged={...source,id:'recette:future-unqualified',imageUrl:SITE+'/social-assets/recette-future-unqualified.jpg',
    socialRights:{approved:true,sha256:'f'.repeat(64)}};
  const feed={product:'cuisine-du-cambodge',schemaVersion:1,items:[source,forged]};
  const result=selectQualifiedMedia(feed,workflow);
  assert.equal(result.qualified.length,1);
  assert.deepEqual(result.excluded,[forged.id]);
  assert.throws(()=>selectQualifiedMedia({...feed,items:[source,source]},workflow),/media_catalogue_id_invalid/);
});

test('generic packager accepts a future already-qualified fixture without a name list; never overwrites',async t=>{
  const f=await future(t);
  const manifest=await createSocialMediaBundle(f);
  assert.equal(manifest.entries.length,1);
  const entry=manifest.entries[0];
  assert.equal(entry.path,'assets/'+sha(f.bytes)+'.jpg');
  assert.deepEqual(await readFile(join(f.outputDir,entry.path)),f.bytes);
  const saved=await readFile(join(f.outputDir,'manifest.json'));
  await assert.rejects(createSocialMediaBundle(f),{code:'EEXIST'});
  assert.deepEqual(await readFile(join(f.outputDir,'manifest.json')),saved);
});

test('staging installs qualified JPEGs atomically and tolerates concurrent reruns',async t=>{
  const f=await future(t);
  const manifest=await createSocialMediaBundle(f);
  const entry=manifest.entries[0];
  const destination=join(f.dir,'served');
  await mkdir(destination);
  const legacy='a'.repeat(64)+'.jpg';
  await writeFile(join(destination,legacy),'historic');
  const results=await Promise.all([
    installSocialMediaAssets(f.outputDir,destination),
    installSocialMediaAssets(f.outputDir,destination),
  ]);
  assert.deepEqual(results.map(x=>x.added).sort(),[0,1]);
  assert.deepEqual(await readFile(join(destination,entry.sha256+'.jpg')),f.bytes);
  assert.equal(await readFile(join(destination,legacy),'utf8'),'historic');
  assert.equal((await stat(join(destination,entry.sha256+'.jpg'))).mode & 0o777,0o644);
  assert.deepEqual(await installSocialMediaAssets(f.outputDir,destination),{added:0,verified:1});
  assert.equal((await readdir(destination)).length,2);
});

test('staging rejects changed bytes and symlinks without replacing served objects',async t=>{
  const f=await future(t);
  const manifest=await createSocialMediaBundle(f);
  const entry=manifest.entries[0];
  const destination=join(f.dir,'served');
  await mkdir(destination);
  const staged=join(f.outputDir,entry.path);
  const served=join(destination,entry.sha256+'.jpg');
  await writeFile(staged,Buffer.alloc(entry.bytes));
  await assert.rejects(installSocialMediaAssets(f.outputDir,destination),/media_digest_mismatch/);
  assert.deepEqual(await readdir(destination),[]);
  await writeFile(staged,f.bytes);
  await symlink(staged,served);
  await assert.rejects(installSocialMediaAssets(f.outputDir,destination),/media_file_invalid/);
  assert.deepEqual(await readFile(staged),f.bytes);
});

test('wrong digest, unapproved rights, foreign URL, and changed original fail before creating output',async t=>{
  const f=await future(t);
  const selection=()=>structuredClone(f.qualified);
  for(const [mutate,reason] of [
    [s=>{s.source.socialRights.sha256='f'.repeat(64)},/media_digest_mismatch/],
    [s=>{s.source.socialRights.approved=false},/media_rights_invalid/],
    [s=>{s.imageUrl=s.source.imageUrl='https://other.invalid/private.jpg'},/media_url_invalid/],
    [s=>{s.source.socialRights.originalSha256='f'.repeat(64)},/media_original_digest_mismatch/],
    [s=>{s.source.socialRights.path='/images/../private.jpg'},/media_original_invalid/],
  ]){
    const qualified=selection();mutate(qualified[0]);
    await assert.rejects(createSocialMediaBundle({...f,qualified}),reason);
    await assert.rejects(stat(f.outputDir),{code:'ENOENT'});
  }
});

test('matching digest cannot authorize a PNG, wrong dimensions or a symbolic link',async t=>{
  const f=await future(t);
  const file=join(f.publicDir,'social-assets',f.filename);
  const rights=f.qualified[0].source.socialRights;
  const png=await sharp({create:{width:1080,height:1080,channels:3,background:'#123456'}}).png().toBuffer();
  await writeFile(file,png);rights.sha256=sha(png);
  await assert.rejects(createSocialMediaBundle(f),/media_not_jpeg/);
  const small=await createJPEG(600,600);
  await writeFile(file,small);rights.sha256=sha(small);
  await assert.rejects(createSocialMediaBundle(f),/social_asset_dimensions_invalid/);
  await rm(file);
  await symlink(join(f.publicDir,'images/future.jpg'),file);
  await assert.rejects(createSocialMediaBundle(f),/media_file_not_regular/);
  await assert.rejects(stat(f.outputDir),{code:'ENOENT'});
});

test('read-only HTTP probe uses only digest-based paths, both profiles, no redirect, exact bytes',async t=>{
  const f=await future(t);
  const manifest=await createSocialMediaBundle(f);
  const requests=[];
  const baseUrl='https://media.example.test/cdc/sha256/';
  const fetchImpl=async(url,options)=>{
    requests.push({url,options});
    return new Response(f.bytes,{status:200,headers:{'Content-Type':'image/jpeg','Content-Length':String(f.bytes.length)}});
  };
  const results=await probeSocialMedia({manifest,baseUrl,fetchImpl});
  assert.equal(results.length,2);
  assert.deepEqual(requests.map(r=>r.options.headers['User-Agent']),['CuisineDuCambodge-MediaProbe/1.0','Meta-ExternalAgent']);
  for(const request of requests){
    assert.equal(request.url,baseUrl+sha(f.bytes)+'.jpg');
    assert.equal(request.options.method,'GET');
    assert.equal(request.options.redirect,'error');
  }
  requests.length=0;
  await assert.rejects(probeSocialMedia({manifest:{...manifest,entries:[...manifest.entries,{sha256:'bad'}]},baseUrl,fetchImpl}),/media_manifest_entry_invalid/);
  assert.equal(requests.length,0);
  await assert.rejects(probeSocialMedia({manifest,baseUrl:'http://media.example.test/',fetchImpl}),/media_probe_base_invalid/);
  assert.equal(requests.length,0);
});

test('probe rejects rate limits, HTML, truncation, changed bytes, and redirect',async t=>{
  const f=await future(t);
  const manifest=await createSocialMediaBundle(f);
  const baseUrl='https://media.example.test/cdc/sha256/';
  const changed=Buffer.from(f.bytes);changed[changed.length-3]^=1;
  for(const [status,mime,body,reason] of [
    [429,'text/html','rate limit',/media_http_429/],
    [200,'text/html','blocked',/media_mime_invalid/],
    [200,'image/jpeg',f.bytes.subarray(0,100),/media_body_length_mismatch/],
    [200,'image/jpeg',changed,/media_remote_digest_mismatch/],
    [302,'text/html','redirect',/media_http_302/],
    [200,'image/jpeg',Buffer.concat([f.bytes,Buffer.from('x')]),/media_body_too_large/],
  ]){
    let calls=0;
    await assert.rejects(probeSocialMedia({manifest,baseUrl,fetchImpl:async()=>{
      calls++;return new Response(body,{status,headers:{'Content-Type':mime}});
    }}),reason);
    assert.equal(calls,1);
  }
});
