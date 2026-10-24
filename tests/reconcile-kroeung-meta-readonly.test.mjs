import test from 'node:test';
import assert from 'node:assert/strict';
import { auditMeta, graphGet, scanEdge, PAGE_ID } from '../scripts/reconcile-kroeung-meta-readonly.mjs';

const fake = (routeFn) => async (url, init) => {
  assert.equal(init.method, 'GET');
  assert.equal(init.redirect, 'error');
  assert.match(init.headers.Authorization, /^Bearer /);
  assert.equal(init.headers.Accept, 'application/json');
  const u = new URL(url);
  assert.equal(u.hostname, 'graph.facebook.com');
  assert.equal(u.searchParams.get('access_token'), null);
  assert.equal(u.searchParams.get('appsecret_proof'), null);
  const result = routeFn(u, init);
  return {status:result.status || 200,ok:(result.status || 200)<400,
    json:async()=>result.body ?? result};
};
const tok = 'not-a-real-token-1234';
const page = {id:PAGE_ID,name:'Cuisine',instagram_business_account:{id:'1784140000001',username:'cuisine'}};
const pageRoute = u => u.pathname === '/v26.0/'+PAGE_ID;
const post = {id:'facebook_1',created_time:'2026-10-21T21:00:00+0000',
  message:'Découvrez le kroeung jaune !',permalink_url:'https://www.facebook.com/1'};
const photo = {id:'photo_1',created_time:'2026-10-22T08:00:00+0000',
  name:'kroeung maison',link:'https://www.facebook.com/photo/1'};
const ig = {id:'ig_1',timestamp:'2026-10-23T12:00:00+0000',
  caption:'Le kroeung cambodgien',permalink:'https://www.instagram.com/p/abc/'};

test('Graph requests have GET-only method and redact paging query tokens', async()=>{
  const payload=await graphGet('https://graph.facebook.com/v26.0/123/media?access_token=SECRET',
    tok,fake(()=>({data:[]})));
  assert.deepEqual(payload,{data:[]});
});
test('refuse unsafe pagination URL and wrong-host token forwarding', async()=>{
  await assert.rejects(()=>graphGet('https://example.com/v26.0/foo',
    tok,fake(()=>({data:[]}))),/UNSAFE_PAGINATION/);
});
test('detect candidate Page posts/photos and linked Instagram', async()=>{
  const f=fake(u=>{
    if(pageRoute(u)) return page;
    if(u.pathname.endsWith('/published_posts')) return {data:[post]};
    if(u.pathname.endsWith('/photos')) return {data:[photo]};
    if(u.pathname.endsWith('/media')) return {data:[ig]};
    throw Error('unexpected path');
  });
  const result=await auditMeta({token:tok,fetcher:f});
  assert.equal(result.verdict,'POSSIBLE_DUPLICATE_REVIEW');
  assert.equal(result.candidateCount,3);
  assert.equal(result.writesPerformed,false);
  assert.ok(!JSON.stringify(result).includes(tok));
});
test('pagination traversed, and no keyword match is not clearance to repost', async()=>{
  const f=fake(u=>{
    if(pageRoute(u)) return page;
    if(u.pathname.endsWith('/published_posts') && !u.searchParams.has('after'))
      return {data:[{...post,message:'autre publication'}],
        paging:{next:'https://graph.facebook.com/v26.0/'+PAGE_ID+'/published_posts?after=cursor&access_token=SECRET'}};
    if(u.pathname.endsWith('/published_posts')) return {data:[]};
    return {data:[]};
  });
  const out=await auditMeta({token:tok,fetcher:f});
  assert.equal(out.facebookPublishedPosts.pages,2);
  assert.equal(out.verdict,'NO_KEYWORD_CANDIDATE_IN_SCANNED_EDGES');
  assert.match(out.warning,/never proves absence/);
});
test('truncation / unavailable Instagram blocks verdict', async()=>{
  const f=fake(u=>{
    if(pageRoute(u)) return page;
    if(u.pathname.endsWith('/published_posts'))
      return {data:[],paging:{next:'https://graph.facebook.com/v26.0/'+PAGE_ID+'/published_posts?after=next'}};
    return {data:[]};
  });
  const out=await auditMeta({token:tok,fetcher:f,maxPages:1});
  assert.equal(out.facebookPublishedPosts.state,'TRUNCATED');
  assert.equal(out.verdict,'BLOCKED_INCOMPLETE_INVENTORY');
  const noIg=await auditMeta({token:tok,fetcher:fake(u=>pageRoute(u)?
    {id:PAGE_ID}:{data:[]})});
  assert.equal(noIg.instagramLink,'NOT_AVAILABLE_FROM_PAGE');
  assert.equal(noIg.verdict,'BLOCKED_INCOMPLETE_INVENTORY');
});
test('Graph 401 and Page mismatch fail closed without revealing credential', async()=>{
  const f=fake(()=>({status:401,body:{error:{message:'secret-token',code:190}}}));
  const a=await auditMeta({token:tok,fetcher:f});
  assert.equal(a.verdict,'BLOCKED');
  assert.equal(a.pageIdentity,'Meta_HTTP_401');
  assert.ok(!JSON.stringify(a).includes('secret'));
  const wrong=await auditMeta({token:tok,fetcher:fake(()=>({id:'123'}))});
  assert.equal(wrong.pageIdentity,'PAGE_MISMATCH');
  assert.equal(wrong.verdict,'BLOCKED');
});
test('pagination cannot cycle or leave Graph domain', async()=>{
  const f=fake(u=>({data:[],paging:{
    next:'https://graph.facebook.com/v26.0/123/media?access_token=SECRET'}}));
  await assert.rejects(()=>scanEdge({url:'https://graph.facebook.com/v26.0/123/media',
    kind:'ig',token:tok,fetcher:f}),/UNSAFE_PAGINATION/);
});
