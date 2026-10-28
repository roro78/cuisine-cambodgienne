import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=JSON.parse(readFileSync(new URL(
  '../automation/n8n/04-ollama-editorial-benchmark-manual.json',import.meta.url),'utf8'));
const nodes=workflow.nodes;
const serialized=JSON.stringify(workflow);

test('isolated Ollama editorial pilot never modifies production workflows',()=>{
  assert.equal(workflow.active,false);
  assert.equal(nodes.length,4);
  assert.equal(nodes.filter(n=>n.type==='n8n-nodes-base.manualTrigger').length,1);
  assert.equal(nodes.filter(n=>n.type==='n8n-nodes-base.httpRequest').length,1);
  for(const kind of ['scheduleTrigger','webhook','postgres','executeWorkflow','wait',
    'gmail','resend','facebookGraphApi','gitHub','supabase','emailSend']){
    assert.ok(!nodes.some(n=>n.type.toLowerCase().includes(kind.toLowerCase())),
      'Unsafe production node: '+kind);
  }
  assert.ok(!/\/api\/v1\/executions|graph\.facebook\.com|api\.resend\.com|api\.openai\.com/.test(serialized));
});
test('manual benchmark requires Docker-internal Ollama with JSON schema, no credential',()=>{
  const http=nodes.find(n=>n.type==='n8n-nodes-base.httpRequest');
  assert.equal(http.parameters.url,'http://ollama:11434/api/chat');
  assert.equal(http.parameters.method,'POST');
  assert.equal(http.parameters.options.timeout,120000);
  assert.equal(http.parameters.body,'={{JSON.stringify($json.request)}}');
  assert.equal(http.parameters.authentication,undefined);
  const code=nodes.find(n=>n.name==='Préparer essai synthétique').parameters.jsCode;
  assert.match(code,/think:false/);
  assert.match(code,/stream:false/);
  assert.match(code,/maxLength/);
  assert.match(code,/additionalProperties:false/);
  assert.match(code,/\bconst model='llama3\.2:latest'/);
});
test('n8n only scores structure and explicitly refuses publication',()=>{
  const scoring=nodes.find(n=>n.name==='Évaluer schéma sans publier').parameters.jsCode;
  assert.match(scoring,/schema_valid/);
  assert.match(scoring,/human_approved:false/);
  assert.match(scoring,/publishable:false/);
  assert.match(scoring,/fields=null/);
  for(const n of nodes){
    assert.equal(n.credentials,undefined);
    assert.ok(!n.parameters?.jsCode?.includes('PRIVATE_REAL_TOKEN'));
  }
});
