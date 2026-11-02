import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {socialDashboardFiles} from '../scripts/package-social-dashboard-ovh.mjs';
const ui=readFileSync(new URL('../public/gestion-contenus/index.php',import.meta.url),'utf8');
const ht=readFileSync(new URL('../public/gestion-social/.htaccess',import.meta.url),'utf8');
test('social entry needs explicit private reception and all five local files',()=>{
 assert.ok(ui.includes("($cfg['social_dashboard_received']??false)===true"));
 for(const name of socialDashboardFiles)assert.ok(ui.includes("'"+name+"'"));
 assert.ok(ui.includes("$publicationsReady?'../gestion-social/':'?publications=1'"));
 assert.ok(ui.includes('id="cms-publications-status"'));
 assert.ok(ui.includes('Aucune publication ni validation sociale'));
});
test('internal social helpers are blocked by Apache and public source is never packaged',()=>{
 for(const helper of ['catalog-readonly','n8n-wait-readonly','diagnostic-cli'])assert.ok(ht.includes(helper));
 assert.ok(ht.includes('Require all denied'));
 assert.deepEqual([...socialDashboardFiles],['index.php','catalog-readonly.php','n8n-wait-readonly.php','diagnostic-cli.php','.htaccess']);
 assert.ok(!socialDashboardFiles.some(x=>/config|sql|json/.test(x)));
});
