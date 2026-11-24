'use strict';

const { createRequire } = require('node:module');
const { strict: assert } = require('node:assert');
const n8n = createRequire('/usr/local/lib/node_modules/n8n/dist/commands/execute.js');
n8n('reflect-metadata');
const { Container } = n8n('@n8n/di');
const { DbConnection, WorkflowRepository, CredentialsRepository } = n8n('@n8n/db');
const { Credentials } = n8n('n8n-core');
const { Client } = n8n('pg');
const { parse } = n8n('flatted');

const ids = ['G7jJCMw6bLQE7dD4', 'AVEoRlWHNF5oBlkS', 'JGqZbuNzma9ZpD7H'];
const page = '206899719342067';
const instagram = '17841403611622522';
const mode = process.argv[2];
const allowed = new Set(['probe', 'send']);

async function credential(node, type) {
  const ref = node?.credentials?.[type];
  assert.ok(ref?.id);
  const row = await Container.get(CredentialsRepository).findOneByOrFail({id: ref.id, type});
  return new Credentials({id: row.id, name: row.name}, row.type, row.data).getData();
}

async function auth(node) {
  const header = await credential(node, 'httpHeaderAuth');
  assert.match(String(header.name), /^authorization$/i);
  assert.match(String(header.value), /^Bearer[ \t]+\S+$/i);
  return {[header.name]: header.value};
}

function node(flow, name) {
  const matches = flow.nodes.filter(entry => entry.name === name);
  assert.equal(matches.length, 1);
  return matches[0];
}

async function response(url, options={}) {
  const r = await fetch(url, {...options, redirect:'error', signal:AbortSignal.timeout(8000)});
  return {http:r.status, data:await r.json().catch(()=>({}))};
}

function reason(settings) {
  const n = settings?.resultData?.error?.node?.name ?? settings?.resultData?.lastNodeExecuted;
  const labels = {
    'Lire le catalogue du site':'catalogue',
    'Choisir un contenu original':'catalogue_ou_droits',
    'Télécharger le JPEG à vérifier':'jpeg',
    'Empreinte du JPEG social':'jpeg',
    'Confirmer le JPEG et ses droits':'droits',
    'Rédiger via Llama sur Ollama':'ollama',
    'Vérifier et cadrer les textes':'legendes',
    'Envoyer la demande de validation Resend':'resend',
    'Publier la photo Facebook':'facebook',
    'Créer le conteneur Instagram':'instagram',
    'Vérifier le statut conteneur':'instagram',
    'Publier Instagram une seule fois':'instagram',
    'Sauver le conteneur Instagram':'postgresql',
    'Enregistrer le brouillon':'postgresql',
    'Historique Cuisine uniquement':'postgresql',
    'Claim atomique uniquement si validé':'postgresql',
    'Réserver un conteneur à examiner':'postgresql',
    'Mémoriser le résultat Facebook':'postgresql',
    'Persister publication Instagram':'postgresql',
    'Persister la décision humaine':'postgresql',
  };
  return Object.hasOwn(labels,n) ? labels[n] : 'n8n';
}

async function databaseQueue(workflow) {
  const c = await credential(node(workflow,'Enregistrer le brouillon'),'postgres');
  assert.ok(c.host && c.user && !c.sshTunnel);
  const client = new Client({host:c.host,port:Number(c.port??5432),database:c.database??'postgres',user:c.user,
    password:c.password,ssl:c.allowUnauthorizedCerts===true ? {rejectUnauthorized:false} : !['disable',undefined].includes(c.ssl),
    connectionTimeoutMillis:5000,statement_timeout:4500});
  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    const {rows} = await client.query(`SELECT id::text,status,fb_state,ig_state,publishing_started_at,updated_at
      FROM cuisine_social.posts
      WHERE publishing_started_at >= NOW() - INTERVAL '7 days'
      AND (status IN ('publishing','manual_review') OR ig_state='manual_review' OR fb_state='manual_review')
      ORDER BY id LIMIT 100`);
    await client.query('COMMIT');
    return {ok:true,rows};
  } finally { await client.end().catch(()=>{}); }
}

async function probe(flows) {
  const repo = Container.get(WorkflowRepository);
  const {rows, triggers} = await repo.manager.transaction(async tx => {
    await tx.query('SET TRANSACTION READ ONLY');
    await tx.query("SET LOCAL statement_timeout='4500ms'");
    const rows = await tx.query(`SELECT e.id::text, e."workflowId", e.status,e.mode,e."startedAt",
      CASE WHEN e.status IN ('error','crashed') THEN d.data ELSE NULL END AS failure
      FROM execution_entity e LEFT JOIN execution_data d ON e.id=d."executionId"
      WHERE e."workflowId"=ANY($1::varchar[]) AND e."startedAt"> NOW()-INTERVAL '50 hours'
      ORDER BY e."startedAt" DESC LIMIT 350`,[ids]);
    const triggers = await tx.query(`SELECT "workflowId", "versionId", status
      FROM workflow_publication_trigger_status WHERE "workflowId"=ANY($1::varchar[])`,[ids]);
    return {rows,triggers};
  });
  const executions=rows.map(({failure,...e})=>({
    ...e, category:failure ? (()=>{try{return reason(parse(failure));}catch{return 'n8n';}})() : null
  }));
  const [graph, queue, ollama] = await Promise.all([
    (async()=>{
      try{
        const [fb, ig] = await Promise.all([
          auth(node(flows[1],'Publier la photo Facebook')),
          auth(node(flows[2],'Vérifier le statut conteneur')),
        ]);
        const [p, i] = await Promise.all([
          response('https://graph.facebook.com/v26.0/'+page+'?fields=id,instagram_business_account{id,username}',{headers:fb}),
          response('https://graph.facebook.com/v26.0/'+instagram+'?fields=id,username',{headers:ig}),
        ]);
        return {ok:p.http===200 && i.http===200 && p.data.id===page &&
          p.data.instagram_business_account?.id===instagram && i.data.id===instagram &&
          i.data.username==='cuisineducambodge', pageHttp:p.http, instagramHttp:i.http,
          revoked:p.data?.error?.code===190 || i.data?.error?.code===190};
      } catch { return {ok:false}; }
    })(),
    databaseQueue(flows[0]).catch(error=>({ok:false,code:/^[A-Z0-9_]+$/.test(String(error.code))?error.code:null})),
    response('http://ollama:11434/api/tags').then(r=>r.http===200 &&
      r.data.models?.some(model=>model.name==='llama3.2:latest')===true).catch(()=>false),
  ]);
  return {executions,triggers,graph,queue,ollama, publicationService:process.env.N8N_USE_WORKFLOW_PUBLICATION_SERVICE==='true',
    flows:flows.map(({id, active, versionId, activeVersionId})=>({id,active,versionId,activeVersionId}))};
}

async function send(workflow) {
  const payload = JSON.parse(process.argv[3]||'{}');
  assert.match(payload.key,/^cdc-social-[a-z0-9-]{1,95}$/);
  assert.equal(typeof payload.text,'string');
  assert.ok(payload.text.length>0 && payload.text.length<6000);
  const mail=node(workflow,'Envoyer la demande de validation Resend');
  assert.equal(mail.parameters.url,'https://api.resend.com/emails');
  const from=mail.parameters.body.match(/\bfrom:'([^'<>]+<[^'<>\s]+@[^'<>\s]+>)'/u)?.[1];
  const recipient=mail.parameters.body.match(/\bto:\['([^'<>\s]+@[^'<>\s]+)'\]/u)?.[1];
  assert.ok(from && recipient && !from.includes('CONFIGURER') && !recipient.includes('CONFIGURER'));
  const headers=await auth(mail);
  const r=await response(mail.parameters.url,{method:'POST',
    headers:{...headers,'Content-Type':'application/json','Idempotency-Key':payload.key},
    body:JSON.stringify({from,to:[recipient],subject:payload.test ? '[Cuisine du Cambodge] TEST — surveillance sociale' :
      '[Cuisine du Cambodge] Alerte — automatisation sociale',text:payload.text})});
  if(!(r.http>=200 && r.http<300 && /^[a-z0-9-]+$/i.test(r.data.id??''))) {
    console.error('CDC_RESEND_HTTP',r.http);
    throw Error('resend_refus');
  }
  return {resendId:r.data.id};
}

async function main() {
  assert.ok(allowed.has(mode));
  const db=Container.get(DbConnection);
  try {
    await db.init();
    const repo=Container.get(WorkflowRepository);
    const flows=await Promise.all(ids.map(id=>repo.findOneByOrFail({id})));
    const result=mode==='send' ? await send(flows[0]) : await probe(flows);
    console.log('CDC_SOCIAL_MONITOR '+JSON.stringify(result));
  } finally { await db.close(); }
}
main().catch(()=>{console.error('CDC_SOCIAL_MONITOR_FAILED');process.exitCode=1;});
