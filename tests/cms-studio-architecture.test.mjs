import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=source('public/gestion-contenus/index.php');
const lib=source('public/gestion-contenus/lib.php');
const guided=source('src/pages/editorial-guided-fields.json.ts');
const buildTest=source('tests/php/editorial-all-guided-smoke.php');
const receipt=source('scripts/check-cms-ovh-readiness.mjs');

test('Studio is one reusable PHP template, never one form per individual page',()=>{
 const common=['recette','culture','atelier','ingredient','technique'];
 for(const kind of common){
  assert.match(ui,new RegExp("'"+kind+"'"),'missing shared filter '+kind);
  assert.match(lib,new RegExp("'"+kind+"'"),'missing shared validator '+kind);
 }
 for(const symbol of ['cmsGuidedHtml','cmsGuidedPreviewHtml','cmsGuidedRowTitle',
                       'cmsAssertGuidedCoverage','cmsBuildGuidedPatch']){
  assert.match(lib,new RegExp('function '+symbol+'\\('),'missing component '+symbol);
 }
 assert.equal((lib.match(/function cmsGuidedHtml\(/g)||[]).length,1);
 assert.equal((lib.match(/function cmsGuidedPreviewHtml\(/g)||[]).length,1);
 assert.equal((ui.match(/id="cms-fields"/g)||[]).length,1);
 assert.match(ui,/foreach\(\$guidedValues as \$field=>\$value\)/);
 assert.match(ui,/cmsGuidedHtml\('guided\['\.\$field\.\']'/);
 assert.match(ui,/cmsGuidedPreviewHtml\('fiche',\$display\['structure'\]\)/);
 assert.match(ui,/Mode avancé \(JSON\)/);
 assert.match(ui,/Afficher le JSON technique \(mode expert\)/);
 assert.match(ui,/id="cms-save"/);
 assert.match(ui,/id="cms-preview"/);
 assert.match(ui,/@media\s*\(max-width:650px\)/);
 assert.doesNotMatch(ui,/Ce résumé présente l'atelier dans le catalogue/);
 assert.doesNotMatch(ui,/Bai Sach Chrouk|Samlor Machu|Amok Trey/i);
});

test('all present and future pages are covered by a typed guided manifest',()=>{
 const canonicalKinds=['recipes','restoredRecipes','workshops','cookingWorkshopGuides',
   'culture','ingredients','recipeTechniques'];
 for(const kind of canonicalKinds)
   assert.ok(guided.includes("model: '"+kind+"'"),'missing public projection for '+kind);
 assert.match(receipt,/GUIDED_COVERAGE_INCOMPLETE/);
 assert.match(lib,/GUIDED_COVERAGE_INCOMPLETE/);
 assert.match(ui,/cmsAssertGuidedCoverage/);
 assert.match(ui,/manifeste éditorial ne correspond pas à toutes les pages/);
 assert.doesNotMatch(buildTest,/count\(\$catalog\)===35/);
 assert.match(buildTest,/cmsAssertGuidedCoverage\(\$guides,\$canon\)/);
 assert.match(buildTest,/FUTURE_PAGE_MISSING_EDITOR_ACCEPTED/);
 assert.match(guided,/approved-public-form-fields-v2/);
});

test('security and append-only private drafts cannot be replaced by a generic publisher',()=>{
 for(const token of ['hash_equals','cmsSave(','csrf','source_fingerprint','canonical_fingerprint'])
   assert.ok(ui.includes(token),token);
 assert.match(lib,/cmsEsc/);
 assert.match(lib,/cmsGuidedPreviewHtml/);
 assert.match(lib,/STRUCTURE_GUIDED_KEYS/);
 assert.match(guided,/NEVER export phase audioScript, MP3 URLs/);
 assert.doesNotMatch(ui+lib,/(?:graph\.facebook\.com|graph\.instagram\.com|api\/v1\/executions)/);
});

test('calendar runtime diagnostics distinguish helper vs record errors without private leakage',()=>{
 assert.match(ui,/cmsCalendarPlan\(\[\],\$calendarMonth,\$calendarKind,\$calendarStatus\)/);
 assert.ok(ui.includes("'CALENDAR_ENGINE_RUNTIME_ERROR'"));
 assert.ok(ui.includes("'CALENDAR_RECORD_RUNTIME_ERROR'"));
 assert.match(lib,/!is_string\(\$item\['kind'\]\?\?null\)/);
 assert.match(lib,/!isset\(\$knownKinds\[\$item\['kind'\]\]\)/);
});

test('calendar reports safe, specific diagnostics without revealing private draft contents',()=>{
 for(const code of ['CALENDAR_CODE_MISMATCH','CALENDAR_DRAFT_INVALID',
  'CALENDAR_DATE_INVALID','CALENDAR_FILTER_INVALID',
  'CALENDAR_RUNTIME_ERROR','CALENDAR_DATA_UNAVAILABLE'])
   assert.ok(ui.includes("'"+code+"'"),'missing safe calendar code: '+code);
 for(const code of ['CALENDAR_CORRUPT_DRAFT','CALENDAR_CORRUPT_DATE'])
   assert.ok(ui.includes("'"+code+"'"),'missing known calendar exception: '+code);
 assert.match(ui,/\$calendarErrors\[\$e->getMessage\(\)\]/);
 assert.match(ui,/error_log\('\[CDC_CMS_CALENDAR\] '/);
 assert.doesNotMatch(ui,/error_log\([^;]*\$e->getMessage\(\)/s);
 assert.match(ui,/http_response_code\(503\)/);
 assert.match(ui,/Les projets privés et leurs versions/);
});

test('Coral Studio keeps workshop content before narration and MP3 as separate actions',()=>{
 assert.match(ui,/Guide vocal de l’atelier — après validation du contenu/);
 assert.match(ui,/1\. Enregistrer et vérifier la recette et les six phases/);
 assert.match(ui,/2\. Préparer et relire les sept narrations/);
 assert.match(ui,/3\. Générer le MP3 Coral après les validations humaines/);
 assert.match(ui,/<button name="coral_prepare" value="1" formnovalidate data-coral-prepare>Préparer les 7 narrations<\/button>/);
 assert.match(ui,/Préparer les narrations — 7 textes à relire/);
 assert.doesNotMatch(ui,/Préparer le MP3/);
 assert.match(lib,/Sept textes vocaux — relecture préalable au MP3/);
 assert.match(lib,/Aucun MP3 n’est produit sur cette page/);
});

test('Coral Studio places the recipe and detailed phases BEFORE narration in one form',()=>{
 const recipe=ui.indexOf('<?= cmsAtelierReferenceHtml(');
 const phases=ui.indexOf('<?= cmsAtelierPhaseDetailsHtml(');
 const narration=ui.indexOf('<section id="atelier-audio-draft"');
 const scripts=ui.indexOf('<?= cmsAtelierScriptsHtml(');
 assert.ok(recipe>0&&recipe<phases&&phases<narration&&narration<scripts,
   'workshop source must be visible before the optional voice step');
});
