import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../public/gestion-social/index.php',import.meta.url),'utf8');

test('the dashboard fetches and displays the actual decision history alongside network state',()=>{
 for(const field of ['human_decision','human_note','decided_at::text AS decided_at',
   'approved_at::text AS approved_at','published_at::text AS published_at',
   'facebook_post_id','instagram_post_id'])
   assert.ok(src.includes(field),field);
 for(const label of ['Décision humaine','Modification demandée','Référence Facebook',
   'Référence Instagram','Vérification manuelle','En attente'])
   assert.ok(src.includes(label),label);
 assert.match(src,/h\(\(string\)\$row\['human_note'\]\)/);
 assert.match(src,/h\(\(string\)\$row\['facebook_post_id'\]\)/);
 assert.match(src,/h\(\(string\)\$row\['instagram_post_id'\]\)/);
});
test('complete captions remain accessible without an inner scrolling trap on smartphones',()=>{
 const rule=src.match(/\.caption\{[^}]+\}/)?.[0];
 assert.ok(rule,'Missing caption CSS rule');
 assert.match(rule,/white-space:pre-wrap/);
 assert.match(rule,/overflow-wrap:anywhere/);
 assert.doesNotMatch(rule,/max-height|overflow:auto|line-clamp/);
});

test('the dashboard explains catalog-to-draft intake and exposes per-source review counts',()=>{
 for(const fragment of [
  'social-feed.json','chaque jour à 7 h','cuisine_social.posts',
  'créer une page ne déclenche pas immédiatement un e-mail',
  "'draft'] ?? 0", "'revision_requested'] ?? 0",
  'Aucun brouillon en attente de validation','sourceKindLabels',
  'Carnet culturel','Recette','Atelier','À valider'
 ]) assert.ok(src.includes(fragment),fragment);
 assert.match(src,/h\(\$kindLabel\)/,'Content kind must be escaped in HTML');
 assert.match(src,/\$snap\['kind'\]/,'Source kind must use immutable draft snapshot');
});
