import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const php=readFileSync(new URL('../public/gestion-contenus/index.php',import.meta.url),'utf8');

test('UX navigation uses the four existing destinations and stays behind authentication',()=>{
  const start=php.indexOf('<nav class="ux-home"');
  assert.ok(start>php.indexOf('<?php else: ?>'),'navigation must follow login gate');
  const nav=php.slice(start,php.indexOf('</nav>',start));
  for(const href of ['?new=1','?library=1','?calendar=1'])
    assert.ok(nav.includes('href="'+href+'"'),href);
  assert.ok(nav.includes("$publicationsReady?'../gestion-social/':'?publications=1'"));
  for(const title of ['Créer','Mes contenus','Publications','Calendrier'])
    assert.ok(nav.includes('<strong>'+title+'</strong>'),title);
  assert.ok(php.includes('Aucun déclenchement n8n, Facebook, Instagram'));
  assert.ok(php.includes('Les publications sociales disposent d\'une connexion privée distincte.'));
  assert.ok(php.includes('.ux-tile:focus-visible'));
  assert.ok(php.includes('@media(max-width:650px){.ux-home'));
});
test('UX workshop audio entry reuses the linked draft and never claims TTS is enabled',()=>{
  assert.ok(php.includes('id="atelier-audio-draft"'));
  assert.ok(php.includes('cmsAtelierScriptsHtml('));
  assert.ok(php.includes('#atelier-audio-draft'));
  assert.ok(php.includes("cmsEsc($studioLinked['id'])"));
  assert.ok(php.includes('Aucun audio n\'est généré depuis cet écran.'));
  assert.ok(!php.includes('name="generate_mp3"'));
});
