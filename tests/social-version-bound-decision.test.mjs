import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const w=JSON.parse(readFileSync(new URL('../automation/n8n/01-drafts-email-approval.json',import.meta.url),'utf8'));
const get=n=>{const a=w.nodes.filter(x=>x.name===n);assert.equal(a.length,1);return a[0]};
const decision=get('Interpréter la décision');
const persist=get('Persister la décision humaine');
const source={id:'recette:amok',fingerprint:'version-111',kind:'recette',
  title:'Amok',url:'https://www.cuisine-du-cambodge.com/recettes/amok/',
  imageUrl:'https://www.cuisine-du-cambodge.com/social-assets/recette-amok.jpg'};
const original={sourceId:source.id,fingerprint:source.fingerprint,source,
  scheduledDate:'2026-10-26',imageUrl:source.imageUrl,
  facebookCaption:'Texte Facebook exact',instagramCaption:'Texte Instagram exact'};
const evaluate=(label='Approuver',note='',post=original,id='9007199254740993')=>vm.runInNewContext(
 '(function(){\n'+decision.parameters.jsCode+'\n})()',{
 $input:{first:()=>({json:{data:{Decision:label,Commentaire:note}}})},
 $:name=>({first:()=>({json:name==='Enregistrer le brouillon'?{id}:post})})
 });
const params=obj=>vm.runInNewContext(persist.parameters.options.queryReplacement.slice(3,-2),{$json:obj});
test('approval decisions carry the exact immutable content and BIGINT id into prepared SQL parameters',()=>{
 for(const [label,state,note] of [['Approuver','approved',''],['Refuser','rejected',''],
                                  ['Demander une modification','revision_requested','Modifier la légende']]){
  const out=evaluate(label,note)[0].json;
  assert.equal(out.decision,state);
  assert.equal(out.id,'9007199254740993');
  const replacements=Array.from(params(out));
  assert.equal(replacements.length,10);
  assert.deepEqual(replacements.slice(0,5),[state,note,out.id,source.id,source.fingerprint]);
  assert.deepEqual(JSON.parse(replacements[5]),source);
  assert.equal(replacements[6],original.scheduledDate);
  assert.equal(replacements[7],original.facebookCaption);
  assert.equal(replacements[8],original.instagramCaption);
  assert.equal(replacements[9],original.imageUrl);
 }
});
test('unknown or missing response and missing source snapshot never become a decision',()=>{
 for(const label of ['',null,'OUI','Approuve','<script>'])
  assert.throws(()=>evaluate(label),/decision_non_reconnue/);
 assert.throws(()=>evaluate('Demander une modification'),/commentaire_requis_pour_modification/);
 for(const broken of [
  {...original,source:{...source,fingerprint:'other'}},
  {...original,source:{...source,imageUrl:'https://evil.example/photo.jpg'}},
  {...original,imageUrl:'https://evil.example/photo.jpg'},
  {...original,instagramCaption:''},
  {...original,source:null},
 ])assert.throws(()=>evaluate('Approuver','',broken),/version_brouillon_non_identifiable/);
});
test('one guarded PostgreSQL UPDATE atomically checks all originally reviewed fields',()=>{
 const sql=persist.parameters.query;
 assert.match(sql,/WHERE id=\$3 AND status='draft'/);
 for(const part of ['human_decision IS NULL','decided_at IS NULL','approved_at IS NULL',
 'source_id=$4','source_fingerprint=$5','source_snapshot=$6::jsonb',
 'scheduled_date=$7::date','facebook_caption=$8','instagram_caption=$9',
 'image_url=$10',"fb_state='pending'","ig_state='pending'",
 'facebook_post_id IS NULL','instagram_post_id IS NULL','instagram_container_id IS NULL'])
  assert.ok(sql.includes(part),'Missing CAS guard: '+part);
 assert.match(sql,/RETURNING id,status,human_note/);
 assert.equal((sql.match(/\bUPDATE\b/gi)||[]).length,1);
});
test('compare-and-swap simulation blocks double-click, changed photo, changed caption and published post',()=>{
 const candidate={id:'9007199254740993',status:'draft',human_decision:null,
 decided_at:null,approved_at:null,source_id:source.id,source_fingerprint:source.fingerprint,
 source_snapshot:source,scheduled_date:original.scheduledDate,
 facebook_caption:original.facebookCaption,instagram_caption:original.instagramCaption,
 image_url:original.imageUrl,fb_state:'pending',ig_state:'pending',
 facebook_post_id:null,instagram_container_id:null,instagram_post_id:null};
 const expected=params(evaluate()[0].json);
 const matches=r=>r.status==='draft'&&r.human_decision===null&&r.decided_at===null&&r.approved_at===null&&
 r.id===expected[2]&&r.source_id===expected[3]&&r.source_fingerprint===expected[4]&&
 JSON.stringify(r.source_snapshot)===JSON.stringify(JSON.parse(expected[5]))&&
 r.scheduled_date===expected[6]&&r.facebook_caption===expected[7]&&
 r.instagram_caption===expected[8]&&r.image_url===expected[9]&&
 r.fb_state==='pending'&&r.ig_state==='pending'&&!r.facebook_post_id&&!r.instagram_container_id&&!r.instagram_post_id;
 assert.equal(matches(candidate),true);
 const approved={...candidate,status:'approved',human_decision:'approved',approved_at:'2026-10-26'};
 assert.equal(matches(approved),false);
 for(const drift of [{image_url:'changed'},{facebook_caption:'changed'},{instagram_caption:'changed'},
                    {source_fingerprint:'new'},{source_snapshot:{...source,title:'Changed'}},
                    {fb_state:'published'},{facebook_post_id:'123'}])
  assert.equal(matches({...candidate,...drift}),false,JSON.stringify(drift));
});
