import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

test('full Astro revision index is aligned with the social ids without exposing editorial data', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cdc-canonical-index-'));
  try {
    const compiled = await build({
      entryPoints: [fileURLToPath(new URL('../src/pages/editorial-source-index.json.ts', import.meta.url))],
      bundle: true, platform: 'node', format: 'esm', target: 'node22',
      write: false, logLevel: 'silent'
    });
    const output = join(dir, 'editorial-index.mjs');
    await writeFile(output, compiled.outputFiles[0].text, 'utf8');
    const mod = await import(pathToFileURL(output).href);
    const first = mod.getEditorialSourceIndex();
    assert.ok(first.length >= 30, 'too few Astro content records');
    assert.equal(first.length, new Set(first.map(x => x.id)).size);
    assert.deepEqual(first, mod.getEditorialSourceIndex());
    const result = await mod.GET({});
    const payload = await result.json();
    assert.equal(payload.product, 'cuisine-du-cambodge');
    assert.equal(payload.digest, 'sha256-full-astro-record-v1');
    assert.equal(payload.items.length, first.length);
    assert.ok(payload.items.some(x => x.id === 'recette:amok-trey'));
    assert.ok(payload.items.some(x => x.kind === 'culture'));
    assert.ok(payload.items.some(x => x.kind === 'atelier'));
    for (const item of payload.items) {
      assert.deepEqual(Object.keys(item).sort(), ['fingerprint','id','kind','model']);
      assert.match(item.fingerprint, /^[a-f0-9]{64}$/);
    }
    const text = JSON.stringify(payload);
    for (const forbidden of ['audioScript', 'ingredients', 'sections', 'sourceReferences',
      'culinaryReferences', 'sources', 'editorial_text', 'media', 'password', 'mp3'])
      assert.ok(!text.includes('"' + forbidden + '"'), 'sensitive or duplicate data: ' + forbidden);

    const recipe = {slug:'amok-trey',ingredients:[{name:'poisson',quantity:600}],
      steps:[{title:'Cuire',text:'Cuire à vapeur'}]};
    const original = mod.editorialRecordFingerprint('recipes', recipe);
    assert.equal(original, mod.editorialRecordFingerprint('recipes', recipe));
    assert.notEqual(original, mod.editorialRecordFingerprint('recipes',
      {...recipe, ingredients:[{name:'poisson',quantity:650}]}),
      'ingredient change must alter the canonical fingerprint');
    const atelier = {slug:'a',phases:[{audioScript:'Texte Coral v1'}],media:{mp3:'a.mp3'}};
    assert.notEqual(mod.editorialRecordFingerprint('cookingWorkshopGuides',atelier),
      mod.editorialRecordFingerprint('cookingWorkshopGuides',
        {...atelier,phases:[{audioScript:'Texte Coral v2'}]}),
      'narration changes must alter canonical fingerprint');
    assert.notEqual(mod.editorialRecordFingerprint('cookingWorkshopGuides',atelier),
      mod.editorialRecordFingerprint('cookingWorkshopGuides',
        {...atelier,media:{mp3:'b.mp3'}}),
      'MP3 reference changes must alter canonical fingerprint');
  } finally { await rm(dir, {recursive:true,force:true}); }
});
