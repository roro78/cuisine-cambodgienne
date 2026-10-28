import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../public/gestion-contenus/index.php',import.meta.url),'utf8');
const lib=readFileSync(new URL('../public/gestion-contenus/lib.php',import.meta.url),'utf8');
const ht=readFileSync(new URL('../public/gestion-contenus/.htaccess',import.meta.url),'utf8');
test('CMS privé sous HTTPS et protégé contre les modifications anonymes',()=>{
 for(const marker of [
  'HTTPS obligatoire','session.use_strict_mode','session.use_only_cookies',
  "'secure'=>true","'httponly'=>true","'samesite'=>'Strict'",
  'hash_equals','password_verify','session_regenerate_id',
  'cmsLoginAttempt','cmsSave(', 'csrf','Cache-Control: no-store'
 ]) assert.ok(ui.includes(marker),marker);
 assert.match(ui,/Content-Security-Policy: default-src 'none'/);
 assert.match(ht,/Require all denied/);
 assert.match(ht,/lib.php/);
 // The new row add/remove controls need a single nonce-bound inline helper.
 // Retain strict CSP and forbid scripts without the exact generated nonce.
 assert.match(ui,/script-src 'nonce-\{\$nonce\}'/);
 // A PHP short echo contains "?>" inside the HTML attribute; do not
 // mistake that ">" for the end of the opening <script> tag.
 assert.equal((ui.match(/<script\b/g)||[]).length,1);
 assert.equal((ui.match(/<script nonce="<\?= cmsEsc\(\$nonce\) \?>">/g)||[]).length,1);
 assert.doesNotMatch(ui,/<script[^\n]+src=/);
 assert.doesNotMatch(ui,/github_token|N8N_API_KEY|service_role/);
});
test('Propositions versionnées sans publication directe',()=>{
 for(const marker of [
  'editorial-drafts','source_fingerprint','cmsVersions','flock',
  'tempnam','rename','SOURCE_CHANGED','CONFLICT','cmsSourceList',
  'social-feed.json','CURLOPT_SSL_VERIFYPEER=>true','CURLOPT_FOLLOWLOCATION=>false'
 ])assert.ok(lib.includes(marker),marker);
 assert.match(lib,/hash\('sha256',\$id\)/);
 assert.match(ui,/Texte éditorial proposé/);
 assert.match(ui,/Prêt pour relecture \(non publié\)/);
 assert.match(ui,/Historique immuable/);
 assert.match(ui,/les brouillons ne modifient pas le site publié/i);
 assert.doesNotMatch(ui+lib,/\b(?:INSERT INTO|UPDATE cuisine_social|DELETE FROM|DROP TABLE)\b/i);
 assert.doesNotMatch(ui+lib,/graph\.facebook\.com|graph\.instagram\.com|api\.resend\.com|api\/v1\/executions/);
});

test('P0B conserve uniquement des propositions structurees sans mutations des MP3',()=>{
 for(const marker of ['cmsValidateStructuredDraft','STRUCTURE_FIELDS',
   'STRUCTURE_QUANTITY','STRUCTURE_PHASE_IDS','cmsPatchTextList',
   "'recette'=>['ingredients','steps','baseServings','prepTime','cookTime'"])
   assert.ok(lib.includes(marker),marker);
 assert.match(ui,/name="structure_json"/);
 assert.match(ui,/les MP3 en production restent inchangés/);
 assert.match(ui,/n'écrit aucun fichier Astro, média ou MP3/);
 assert.doesNotMatch(ui+lib,/PUT \/repos|github_token|audio\.mp3\.write/);
});
test('la bibliothèque distingue brouillons et source modifiée sans publication',()=>{
 assert.match(ui,/\$latestById/);
 assert.match(ui,/cmsVersions\(\$dir,\$src\['id'\]\)/);
 assert.match(ui,/Prêt pour relecture/);
 assert.match(ui,/Source actualisée depuis le brouillon/);
 assert.match(ui,/Nouvelle sauvegarde bloquée/);
 assert.match(ui,/\$staleDraft\?' disabled'/);
});


test('calendrier privé : une projection défaillante ne bloque pas toute la bibliothèque',()=>{
 assert.match(ui,/function_exists\('cmsCalendarPlan'\)/);
 assert.match(ui,/CALENDAR_CODE_MISMATCH/);
 assert.match(ui,/CALENDAR_DATA_UNAVAILABLE/);
 assert.match(ui,/\[CDC_CMS_CALENDAR\]/);
 assert.match(ui,/\\$calendarError!==''/);
 assert.match(ui,/Les projets privés et leurs versions/);
 assert.match(ui,/http_response_code\(503\)/);
 assert.doesNotMatch(ui,/error_log\([^\n]*\$e->getMessage\(\)/);
});
