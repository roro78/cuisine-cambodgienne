import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {readFileSync,mkdirSync,mkdtempSync,copyFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const source=name=>fileURLToPath(new URL('../public/gestion-social/'+name,import.meta.url));
const port=()=>new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});

test('HTTPS mode keeps private authentication, filters, pagination, catalog and original Wait handoff',{timeout:30000},async t=>{
  const root=mkdtempSync(join(tmpdir(),'cdc-https-dashboard-'));
  const portal=join(root,'web','public','gestion-social'),privateDir=join(root,'.cuisine-asset-portal');
  mkdirSync(portal,{recursive:true});mkdirSync(privateDir,{recursive:true});
  for(const name of ['index.php','n8n-wait-readonly.php'])copyFileSync(source(name),join(portal,name));
  const item={id:'1',source_id:'recette:fixture',source_fingerprint:'a'.repeat(16),source_snapshot:JSON.stringify({title:'Private fixture',kind:'recette',url:'https://www.cuisine-du-cambodge.com/recettes/fixture/'}),scheduled_date:'2026-11-03',facebook_caption:'Private FB fixture',instagram_caption:'Private IG fixture',image_url:'https://www.cuisine-du-cambodge.com/social-assets/fixture.jpg',status:'draft',fb_state:'pending',ig_state:'pending',human_decision:null,human_note:'<script>private-note</script>',decided_at:null,approved_at:null,published_at:null,facebook_post_id:null,instagram_post_id:null,instagram_container_id:null};
  writeFileSync(join(root,'fixture.json'),JSON.stringify(item));
  // Replace only the remote transport in a TEMPORARY copy. All validation,
  // authentication, rendering and n8n handoff use the production PHP source.
  let helper=readFileSync(source('https-readonly.php'),'utf8').replace('function socialHttpsRequest(', 'function socialHttpsRequestNetwork(');
  helper+=`\nfunction socialHttpsRequest(string $url,string $token): array {
    $root=dirname(__DIR__,3);parse_str(parse_url($url,PHP_URL_QUERY),$args);
    file_put_contents($root.'/calls.jsonl',json_encode($args)."\\n",FILE_APPEND);
    if(is_file($root.'/network-error'))throw new RuntimeException('secret remote details');
    $row=json_decode(file_get_contents($root.'/fixture.json'),true);
    $rows=[$row];$status=$args['status'];
    if(($args['page']??'1')==='2')$rows[0]['id']='51';
    if($status==='published'){$rows[0]['status']='published';$rows[0]['source_snapshot']='{"title":"Published private fixture"}';}
    if($status==='sources')$rows=[];
    $target=null;if(($args['draft_id']??null)==='1'){$target=$row;unset($target['source_snapshot'],$target['human_note']);}
    return ['status'=>200,'content_type'=>'application/json','body'=>json_encode([
      'contract'=>'cdc-social-readonly-v1','readonly'=>true,'rows'=>$rows,'counts'=>['draft'=>51,'published'=>1],
      'target'=>$target,'history'=>$status==='sources'?[['source_id'=>$row['source_id'],'source_fingerprint'=>$row['source_fingerprint'],'status'=>'draft']]:[],
      'history_overflow'=>false])];
  }\n`;
  writeFileSync(join(portal,'https-readonly.php'),helper);
  let catalog=readFileSync(source('catalog-readonly.php'),'utf8').replace('function readDeployedSocialFeed()', 'function readDeployedSocialFeedNetwork()');
  catalog+=`\nfunction readDeployedSocialFeed(): ?array {return ['product'=>'cuisine-du-cambodge','schemaVersion'=>1,'items'=>[['id'=>'recette:fixture','kind'=>'recette','title'=>'Public catalog fixture','url'=>'https://www.cuisine-du-cambodge.com/recettes/fixture/','fingerprint'=>str_repeat('a',16),'imageUrl'=>'https://www.cuisine-du-cambodge.com/social-assets/fixture.jpg']]];}\n`;
  writeFileSync(join(portal,'catalog-readonly.php'),catalog);
  const hash=execFileSync('php',['-r','echo password_hash("fixture-password",PASSWORD_DEFAULT);'],{encoding:'utf8'}).trim();
  const config=enabled=>`<?php return ['admin_user'=>'fixture-operator','password_hash'=>'${hash}','social_readonly_https_enabled'=>${enabled?'true':'false'},'social_readonly_https_endpoint'=>'https://kljbnfjxwloiodwlbrrz.supabase.co/functions/v1/cuisine-social-readonly','social_readonly_https_token'=>'${'A'.repeat(48)}'];`;
  writeFileSync(join(privateDir,'config.php'),config(true));
  writeFileSync(join(root,'router.php'),`<?php if(($_SERVER['HTTP_X_TEST_TLS']??'')==='1')$_SERVER['HTTPS']='on';require __DIR__.'/web/public/gestion-social/index.php';`);
  const p=await port();const server=spawn('php',['-S','127.0.0.1:'+p,'router.php'],{cwd:root,stdio:'ignore'});
  t.after(async()=>{const stopped=once(server,'exit');server.kill();await stopped;assert.ok(root.startsWith(join(tmpdir(),'cdc-https-dashboard-')));rmSync(root,{recursive:true,force:true,maxRetries:10,retryDelay:100});});
  const url='http://127.0.0.1:'+p+'/gestion-social/';
  for(let n=0;n<50;n++){try{await fetch(url);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  const headers={'X-Test-TLS':'1'};
  const first=await fetch(url,{headers});assert.equal(first.status,200);const firstBody=await first.text();
  assert.doesNotMatch(firstBody,/Private FB fixture/);assert.ok(!existsSync(join(root,'calls.jsonl')));
  const csrf=firstBody.match(/name="csrf" value="([a-f0-9]{48})"/)[1];
  let cookie=first.headers.get('set-cookie').split(';')[0];
  assert.match(first.headers.get('set-cookie'),/secure/i);assert.match(first.headers.get('set-cookie'),/httponly/i);
  const send=params=>fetch(url,{method:'POST',headers:{...headers,Cookie:cookie,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(params),redirect:'manual'});
  assert.equal((await send({csrf:'invalid',login:'1',username:'fixture-operator',password:'fixture-password'})).status,403);
  const login=await send({csrf,login:'1',username:'fixture-operator',password:'fixture-password'});assert.equal(login.status,200);
  cookie=login.headers.get('set-cookie')?.split(';')[0]||cookie;
  assert.match(await login.text(),/Private FB fixture/);
  const authenticated=extra=>fetch(url+extra,{headers:{...headers,Cookie:cookie},redirect:'manual'});
  const second=await authenticated('?status=draft&page=2');assert.equal(second.status,200);assert.match(await second.text(),/Brouillon n°51/);
  const published=await authenticated('?status=published');assert.equal(published.status,200);assert.match(await published.text(),/Published private fixture/);
  const sources=await authenticated('?status=sources&kind=recette&source_state=seen&q=Public');assert.equal(sources.status,200);assert.match(await sources.text(),/Public catalog fixture/);
  const wrongFilter=await authenticated('?status=sources&kind=atelier');assert.match(await wrongFilter.text(),/Aucun contenu ne correspond/);
  const unavailable=await send({csrf,open_wait_post:'1'});assert.equal(unavailable.status,409,'An HTTPS row cannot authorize an unverified n8n Wait');
  const signed='https://n8n.orvekio.com/form-waiting/12345?signature=0123456789abcdef0123456789abcdef';
  const handoff=await send({csrf,open_existing_wait:'1',wait_link:signed});assert.equal(handoff.status,303);assert.equal(handoff.headers.get('location'),signed);
  assert.equal((await send({csrf:'wrong',open_existing_wait:'1',wait_link:signed})).status,403);
  const calls=readFileSync(join(root,'calls.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  assert.ok(calls.some(x=>x.page==='2'&&x.status==='draft'));assert.ok(calls.some(x=>x.draft_id==='1'));
  writeFileSync(join(root,'network-error'),'1');const failure=await authenticated('');assert.equal(failure.status,503);
  assert.doesNotMatch(await failure.text(),/secret remote details|Private FB fixture|PDO|postgres/);
  writeFileSync(join(privateDir,'config.php'),config(false));
  const before=readFileSync(join(root,'calls.jsonl'),'utf8');assert.equal((await authenticated('')).status,503,'Disabled HTTPS keeps the unconfigured legacy PDO gate');
  assert.equal(readFileSync(join(root,'calls.jsonl'),'utf8'),before,'Disabled mode must not fall back to HTTPS');
  const logout=await send({csrf,logout:'1'});assert.equal(logout.status,200);assert.match(await logout.text(),/Connexion privée/);
});
