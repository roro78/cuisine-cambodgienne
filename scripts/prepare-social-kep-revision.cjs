/**
 * Prepare a temporary definition of the existing 01 workflow for the single Kep revision.
 * Inputs and output are files kept outside the public site. This tool makes no network calls.
 */
const assert = require('node:assert/strict');
const {readFileSync, writeFileSync} = require('node:fs');
const {runInNewContext} = require('node:vm');

const revision = 'kep-20261127-v2';
const trigger = 'Relancer la validation Kep n°7';
const sourceId = 'culture:kep-marche-crabe-poivre';
const fingerprint = 'e6a30d62b5f91d55';
const scheduledDate = '2026-11-27';
const oldImagePath = '/social-assets/culture-kep-marche-crabe-poivre-v20261126.jpg';
const newImagePath = '/social-assets/culture-kep-marche-crabe-poivre-v20261127.jpg';
const origin = 'https://www.cuisine-du-cambodge.com';

function prepare(workflow, feed) {
  const staged = structuredClone(workflow);
  assert.equal(staged.name, 'Cuisine du Cambodge - 01 - Brouillon IA et validation email');
  assert.ok(staged.nodes.every(node => !node.type.endsWith('.manualTrigger')));
  const find = name => {
    const matches = staged.nodes.filter(node => node.name === name);
    assert.equal(matches.length, 1, name);
    return matches[0];
  };
  const selector = find('Choisir un contenu original');
  const item = feed.items.find(entry => entry.id === sourceId);
  assert.equal(item?.fingerprint, fingerprint);
  const result = runInNewContext('(function(){'+selector.parameters.jsCode+'})()', {
    $: () => ({first: () => ({json: {...feed, items:[item]}})}),
    $input: {all: () => []},
  }, {timeout:1000});
  assert.equal(result.length, 1);
  const selected = result[0].json;
  assert.equal(selected.imageUrl, origin+newImagePath);
  assert.equal(selected.source.socialRights.license, 'CC0 1.0');
  assert.equal(selected.editorialOptions.length, 2);
  selector.parameters.jsCode = "if ($("+JSON.stringify(trigger)+").isExecuted) return "+
    JSON.stringify([{json:{...selected, scheduledDate, approvalRevision:revision}}])+";\n"+
    selector.parameters.jsCode;
  staged.nodes.push({
    id:'cuisine-kep-revision-20261127', name:trigger, type:'n8n-nodes-base.manualTrigger',
    typeVersion:1, position:[-480, 580], parameters:{},
  });
  staged.connections[trigger] = {main:[[{node:selector.name,type:'main',index:0}]]};

  const insert = find('Enregistrer le brouillon').parameters;
  assert.match(insert.query, /^INSERT INTO cuisine_social\.posts/);
  assert.match(insert.query, /ON CONFLICT \(scheduled_date\) DO NOTHING RETURNING id,scheduled_date$/);
  const initialInsert = insert.query.replace('VALUES ($1,$2,$3::jsonb,$4::date,$5,$6,$7)',
    "SELECT $1,$2,$3::jsonb,$4::date,$5,$6,$7 WHERE $8::text = 'initial'");
  assert.notEqual(initialInsert, insert.query);
  insert.query = `WITH revised AS (
  UPDATE cuisine_social.posts
  SET source_snapshot = $3::jsonb || jsonb_build_object(
        '_social_approval_revision', $8::text,
        '_social_approval_history', jsonb_build_array(jsonb_build_object(
          'revision', 'initial', 'status', status, 'human_decision', human_decision,
          'human_note', human_note, 'decided_at', decided_at,
          'facebook_caption', facebook_caption, 'instagram_caption', instagram_caption,
          'image_url', image_url, 'source_snapshot', source_snapshot, 'updated_at', updated_at
        ))
      ),
      facebook_caption = $5, instagram_caption = $6, image_url = $7,
      status = 'draft', human_decision = NULL, human_note = NULL, decided_at = NULL, updated_at = NOW()
  WHERE $8::text = '${revision}' AND id = 7 AND scheduled_date = DATE '${scheduledDate}'
    AND scheduled_date = $4::date AND source_id = '${sourceId}' AND source_id = $1
    AND source_fingerprint = '${fingerprint}' AND source_fingerprint = $2
    AND source_snapshot->>'id' = $1 AND source_snapshot->>'fingerprint' = $2
    AND NOT (source_snapshot ?| ARRAY['_social_approval_revision','_social_approval_history','_social_approval_seal'])
    AND image_url = '${origin+oldImagePath}' AND $7 = '${origin+newImagePath}'
    AND source_snapshot->'socialRights'->>'sha256' = 'a0564c5ddd41938c2b070ce2a2f2026e8781cbcbf8093ef6c10d1b8546370f'
    AND $3::jsonb->'socialRights'->>'sha256' = '${selected.source.socialRights.sha256}'
    AND $3::jsonb->'socialRights'->'approved' = 'true'::jsonb
    AND ((status = 'draft' AND human_decision IS NULL AND decided_at IS NULL)
      OR (status = 'revision_requested' AND human_decision = 'revision_requested' AND decided_at IS NOT NULL))
    AND approved_at IS NULL AND publishing_started_at IS NULL AND published_at IS NULL
    AND fb_state = 'pending' AND ig_state = 'pending'
    AND facebook_post_id IS NULL AND instagram_container_id IS NULL AND instagram_post_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM cuisine_social.posts other WHERE other.source_id = $1 AND other.id <> 7)
  RETURNING id,scheduled_date,source_snapshot->>'_social_approval_revision' AS approval_revision
), inserted AS (
  ${initialInsert},'initial'::text AS approval_revision
)
SELECT id,scheduled_date,approval_revision FROM revised
UNION ALL
SELECT id,scheduled_date,approval_revision FROM inserted`;
  assert.ok(insert.options.queryReplacement.endsWith('$json.imageUrl]}}'));
  insert.options.queryReplacement = insert.options.queryReplacement.replace(
    '$json.imageUrl]}}', '$json.imageUrl,$json.approvalRevision ?? "initial"]}}');

  const resend = find('Envoyer la demande de validation Resend').parameters;
  const subjectEnd = ".json.scheduledDate,text:";
  assert.ok(resend.body.includes(subjectEnd));
  resend.body = resend.body.replace(subjectEnd,
    ".json.scheduledDate+($('Enregistrer le brouillon').first().json.approval_revision === "+
    JSON.stringify(revision)+" ? ' — Kep, version corrigée' : ''),text:");

  const decision = find('Interpréter la décision').parameters;
  assert.ok(decision.jsCode.endsWith('return [{json:{id,decision,note}}];'));
  decision.jsCode = decision.jsCode.replace('return [{json:{id,decision,note}}];',
    'const approvalRevision=saved.approval_revision ?? "initial";\n'+
    'if (!["initial","'+revision+'"].includes(approvalRevision)) throw Error("version_de_validation_non_identifiee");\n'+
    'return [{json:{id,decision,note,approvalRevision}}];');

  const persist = find('Persister la décision humaine').parameters;
  assert.ok(persist.query.includes("AND NOT (source_snapshot ? '_social_approval_revision')"));
  persist.query = persist.query.replace("AND NOT (source_snapshot ? '_social_approval_revision')",
    "AND COALESCE(source_snapshot->>'_social_approval_revision','initial')=$4");
  assert.ok(persist.options.queryReplacement.endsWith('$json.id]}}'));
  persist.options.queryReplacement = persist.options.queryReplacement.replace(
    '$json.id]}}','$json.id,$json.approvalRevision]}}');
  return staged;
}

module.exports = {prepare};
if (require.main === module) {
  const [workflowPath, feedPath, destination] = process.argv.slice(2);
  assert.ok(workflowPath && feedPath && destination, 'Usage: node prepare-social-kep-revision.cjs workflow.json feed.json destination.json');
  const draft = JSON.parse(readFileSync(workflowPath));
  const feed = JSON.parse(readFileSync(feedPath));
  const prepared = Array.isArray(draft) ? [prepare(draft[0], feed)] : prepare(draft, feed);
  writeFileSync(destination, JSON.stringify(prepared,null,2)+'\n', {flag:'wx',mode:0o600});
}
