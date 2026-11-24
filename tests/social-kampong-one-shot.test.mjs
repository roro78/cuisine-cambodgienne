import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';

const workflow = JSON.parse(readFileSync(new URL('../automation/n8n/01-drafts-email-approval.json', import.meta.url)));
const manual = 'Préparer manuellement Kampong Speu V6 (25 novembre)';
const formatter = 'Vérifier et cadrer les textes';
const node = name => workflow.nodes.find(item => item.name === name);
const next = name => workflow.connections[name].main[0][0].node;
const hash = value => createHash('sha256').update(value).digest('hex');

function prepare(now) {
  class FixedDate extends Date {
    constructor() { super(now); }
  }
  return runInNewContext('(function(){'+node(formatter).parameters.jsCode+'})()', {
    $: name => {
      assert.equal(name, manual, 'manual preparation must never read the automatic selection');
      return {isExecuted:true};
    },
    Date: FixedDate,
    Intl,
  }, {timeout:3000})[0].json;
}

test('manual trigger rejoins the existing insert and two-step Wait without generation', () => {
  assert.equal(node(manual).type,'n8n-nodes-base.manualTrigger');
  assert.equal(next(manual),formatter);
  assert.equal(next(formatter),'Enregistrer le brouillon');
  assert.match(node(next(formatter)).parameters.query,/ON CONFLICT \(scheduled_date\) DO NOTHING RETURNING id/);
  assert.equal(next(next(formatter)),'Brouillon inséré ?');
  assert.equal(next('Brouillon inséré ?'),'Envoyer la demande de validation Resend');
  assert.equal(next('Envoyer la demande de validation Resend'),'Attendre une décision via formulaire');
  assert.equal(next('Attendre une décision via formulaire'),'Interpréter la décision');
  assert.equal(next('Interpréter la décision'),'Persister la décision humaine');
  assert.equal(next('Tous les jours à 07 h'),'Lire le catalogue du site');
  assert.equal(workflow.active,false);
  assert.equal(workflow.settings.timezone,'Europe/Paris');
});

test('only the approved asset and verbatim captions go into the 25 November proposal', () => {
  for (const now of ['2026-11-24T23:17:00+01:00','2026-11-25T20:00:00+01:00']){
    const data = prepare(now);
    assert.equal(data.scheduledDate,'2026-11-25');
    assert.equal(data.sourceId,'culture:sucre-de-palme-kampong-speu');
    assert.equal(data.source.id,data.sourceId);
    assert.equal(data.source.fingerprint,'58677de429e00662');
    assert.equal(data.fingerprint,data.source.fingerprint);
    assert.equal(data.imageUrl,'https://www.cuisine-du-cambodge.com/social-assets/culture-sucre-de-palme-kampong-speu.jpg');
    assert.equal(data.imageUrl,data.source.imageUrl);
    assert.equal(hash(data.facebookCaption),'a9a7ac3c772c22ea44964922e3f97ce5c19827bf59a57f196bc8aa47b64e774b');
    assert.equal(hash(data.instagramCaption),'ffb37d4f160b5534c2dd60e36d73e3c5097ed04ac9f9a5944d108a861245fb2c');
    assert.deepEqual(Object.keys(data).sort(), ['facebookCaption','fingerprint','imageUrl','instagramCaption','scheduledDate','source','sourceId'].sort());
  }
});

test('preparation closes at midnight Europe/Paris and refuses a stale launch', () => {
  assert.throws(()=>prepare('2026-11-23T23:59:59+01:00'),/fenetre_preparation_kampong_terminee/);
  assert.throws(()=>prepare('2026-11-26T00:00:00+01:00'),/fenetre_preparation_kampong_terminee/);
});
