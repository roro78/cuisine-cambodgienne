import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../public/gestion-contenus/index.php',import.meta.url),'utf8');
const lib=readFileSync(new URL('../public/gestion-contenus/lib.php',import.meta.url),'utf8');

test('AI brief actions remain behind the existing session and CSRF gate',()=>{
 const call=ui.indexOf('$saved=cmsAiBriefGenerate(');
 assert.ok(call>ui.indexOf('Session expirée. Rechargez.'));
 assert.ok(call>ui.indexOf('if($auth){'));
 assert.ok(call>ui.indexOf('if($newMode){'));
 assert.match(ui,/isset\(\$_POST\['create_save'\]\) && !isset\(\$_POST\['ai_brief_generate'\]\)/);
 assert.match(ui,/\$creation!==null \|\| \(\$_POST\['creation_id'\]\?\?''\)!==''/);
 assert.match(ui,/name="csrf" value="<\?= cmsEsc\(\$_SESSION\['csrf'\]\) \?>"/);
});

test('the browser cannot choose an adapter, credentials or AI provenance',()=>{
 assert.doesNotMatch(ui,/\$_POST\['(?:adapter|model_label|origin|ai_brief|api_key|endpoint)'\]/);
 assert.match(ui,/cmsCreationSave\(\$private,\$posted,\$catalog,\$expected,\$cid,\s*null,null,null,\$canonicalById\)/);
 assert.doesNotMatch(ui,/\$_POST\['source_binding'\]/);
 assert.match(lib,/\(\$options\['enabled'\]\?\?false\)!==true\)return null/);
 assert.doesNotMatch(ui+lib,/fixture-only|mock_response|https:\/\/.*\/api\/chat/);
 assert.match(ui,/L’assistance IA n’est pas disponible pour le moment/);
 assert.match(ui,/cmsCreationFormHtml\(\$createKind/);
});
