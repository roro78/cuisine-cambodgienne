import postgres from 'npm:postgres@3.4.5';
import { createSocialReader } from './index.ts';

function assert(ok: unknown, message = 'assertion failed'): asserts ok { if (!ok) throw new Error(message); }
function equal(a: unknown, b: unknown) { assert(JSON.stringify(a) === JSON.stringify(b), `${JSON.stringify(a)} != ${JSON.stringify(b)}`); }
const token = 'A'.repeat(48);
const url = 'https://example.invalid/functions/v1/cuisine-social-readonly';
const role = {correct_user:true,safe_role:true,schema_usage:true,can_read:true,no_other_rights:true,rls_enabled:true,viewer_policy:true,safe_memberships:true,postgres_tls:true,readonly_transaction:true};
const entry = {id:'1',source_id:'recette:fixture',source_fingerprint:'a'.repeat(16),source_snapshot:'{"title":"Fixture"}',scheduled_date:'2026-11-03',facebook_caption:'FB',instagram_caption:'IG',image_url:'https://www.cuisine-du-cambodge.com/social-assets/fixture.jpg',status:'draft',fb_state:'pending',ig_state:'pending',human_decision:null,human_note:null,decided_at:null,approved_at:null,published_at:null,facebook_post_id:null,instagram_post_id:null,instagram_container_id:null};
function setup(overrides: Record<string,string|undefined> = {}, unsafeRole: boolean | keyof typeof role = false, rows: unknown[] = [entry], history: unknown[] = []) {
  const environment: Record<string,string|undefined> = {
    CDC_SOCIAL_READONLY_ENABLED:'true',CDC_SOCIAL_REVIEW_TOKEN:token,
    CDC_SOCIAL_READONLY_PG_URL:'postgres://cuisine_social_viewer.kljbnfjxwloiodwlbrrz:fixture-password@aws-1-eu-west-3.pooler.supabase.com:5432/postgres',
    CDC_SOCIAL_READONLY_PG_CA:'-----BEGIN CERTIFICATE-----\nQUJD\n-----END CERTIFICATE-----',...overrides,
  };
  const calls: {connection?:unknown; options?:unknown; sql:{query:string,values:unknown[]}[];closed:number} = {sql:[],closed:0};
  const tx = Object.assign(async (parts: TemplateStringsArray, ...values: unknown[]) => {
    const query = parts.join('?'); calls.sql.push({query,values});
    if (query.includes('FROM pg_roles r')) return [{...role,...(unsafeRole?{[typeof unsafeRole==='string'?unsafeRole:'safe_memberships']:false}:{})}];
    if (query.includes('GROUP BY status')) return [{status:'draft',total:51}];
    if (query.includes('DISTINCT ON')) return history;
    if (query.includes('WHERE id::text=')) return rows;
    return [];
  }, {unsafe: async (query:string,values:unknown[]) => {calls.sql.push({query,values});return rows;}});
  const connect = ((connection:unknown,options:unknown) => {
    calls.connection=connection;calls.options=options;
    return {begin:async (fn:(tx:unknown)=>unknown)=>await fn(tx),end:()=>{calls.closed++;return Promise.resolve();}};
  }) as unknown as typeof postgres;
  return {handler:createSocialReader((key)=>environment[key],connect),calls};
}
function request(query='', supplied:string|null=token, method='GET') {
  return new Request(url+query,{method,headers:supplied?{'x-cdc-social-read-token':supplied}:{}});
}

Deno.test('anonymous, public-key and wrong-token callers never open a database', async()=>{
  for (const supplied of [null,'anon-public-key','sb_publishable_fixture','B'.repeat(48)]) {
    const {handler,calls}=setup(); equal((await handler(request('',supplied))).status,401);assert(!calls.connection);
  }
});
Deno.test('methods, disabled function, missing CA and wrong database identity fail closed',async()=>{
  const first=setup();equal((await first.handler(request('',token,'POST'))).status,405);assert(!first.calls.connection);
  for(const env of [{CDC_SOCIAL_READONLY_ENABLED:undefined},{CDC_SOCIAL_READONLY_PG_CA:undefined},
    {CDC_SOCIAL_READONLY_PG_URL:'postgres://postgres:secret@aws-1-eu-west-3.pooler.supabase.com:5432/postgres'},
    {CDC_SOCIAL_READONLY_PG_URL:'postgres://cuisine_social_viewer.kljbnfjxwloiodwlbrrz:secret@aws-1-eu-west-3.pooler.supabase.com:6543/postgres'}]){
    const {handler,calls}=setup(env);equal((await handler(request())).status,503);assert(!calls.connection);
  }
});
Deno.test('duplicate, injected and oversized parameters are rejected before database access',async()=>{
  for(const query of ['?status=draft&status=all','?status=bad','?page=0','?page=100001','?page=1.5','?extra=1','?draft_id=9223372036854775808',"?draft_id=1%27%3BDELETE"]){
    const {handler,calls}=setup();equal((await handler(request(query))).status,400);assert(!calls.connection);
  }
});
Deno.test('pagination is bound, TLS uses the CA and each session/transaction is read-only',async()=>{
  const {handler,calls}=setup();const response=await handler(request('?status=draft&page=2'));
  equal(response.status,200);const body=await response.json();equal(body.contract,'cdc-social-readonly-v1');equal(body.readonly,true);
  equal(body.rows[0].source_snapshot,entry.source_snapshot);
  const select=calls.sql.find(x=>x.query.includes('OFFSET $2'));equal(select?.values,['draft',50]);
  const options=calls.options as {ssl:{ca:string;rejectUnauthorized:boolean;servername:string},connection:{default_transaction_read_only:boolean;statement_timeout:number}};
  equal(options.ssl.rejectUnauthorized,true);equal(options.ssl.servername,'aws-1-eu-west-3.pooler.supabase.com');assert(options.ssl.ca.includes('BEGIN CERTIFICATE'));
  equal(options.connection.default_transaction_read_only,true);equal(options.connection.statement_timeout,5000);
  assert(calls.sql[0].query.includes('SET TRANSACTION READ ONLY'));equal(calls.closed,1);
  assert(calls.sql.every(x=>!/^\s*(INSERT|UPDATE|DELETE|ALTER|CREATE|GRANT|REVOKE)\b/i.test(x.query)));
});
Deno.test('unsafe role stops before any post is read and emits a fixed public error',async()=>{
  for(const guard of Object.keys(role) as (keyof typeof role)[]){
    const {handler,calls}=setup({},guard);const response=await handler(request());equal(response.status,503);equal(await response.json(),{error:'unavailable'});
    assert(!calls.sql.some(x=>x.query.includes('FROM cuisine_social.posts')));equal(calls.closed,1);
  }
});
Deno.test('network/driver startup errors never disclose connection secrets',async()=>{
  const fail=(()=>{throw new Error('secret-connection-password');}) as unknown as typeof postgres;
  const good=setup();
  // Reuse a fully configured environment without invoking a real database.
  const handler=createSocialReader((key)=>({CDC_SOCIAL_READONLY_ENABLED:'true',CDC_SOCIAL_REVIEW_TOKEN:token,
    CDC_SOCIAL_READONLY_PG_URL:'postgres://cuisine_social_viewer.kljbnfjxwloiodwlbrrz:secret@aws-1-eu-west-3.pooler.supabase.com:5432/postgres',
    CDC_SOCIAL_READONLY_PG_CA:'-----BEGIN CERTIFICATE-----\nQUJD\n-----END CERTIFICATE-----'} as Record<string,string>)[key],fail);
  const response=await handler(request());equal(response.status,503);equal(await response.json(),{error:'unavailable'});assert(!good.calls.connection);
});
Deno.test('source history overflow is explicit and does not select paginated rows',async()=>{
  const history=Array.from({length:1001},(_,i)=>({source_id:'recette:fixture-'+i,source_fingerprint:'a'.repeat(16),status:'draft'}));
  const {handler,calls}=setup({},false,[],history);const response=await handler(request('?status=sources'));
  equal(response.status,200);const body=await response.json();equal(body.history_overflow,true);equal(body.history,[]);equal(body.rows,[]);
  assert(!calls.sql.some(x=>x.query.includes('OFFSET')));
});
Deno.test('draft lookup binds the exact identity and response bounds count UTF-8 bytes',async()=>{
  const {handler,calls}=setup();equal((await handler(request('?draft_id=9223372036854775807'))).status,200);
  equal(calls.sql.find(x=>x.query.includes('WHERE id::text='))?.values,['9223372036854775807']);
  const large=setup({},false,[{...entry,facebook_caption:'é'.repeat(800000)}]);
  equal((await large.handler(request())).status,503);equal(large.calls.closed,1);
});
