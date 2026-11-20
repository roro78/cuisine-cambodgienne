import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const reference = join(root, 'releases/amok-trey-v4');
const manifest = JSON.parse(readFileSync(join(reference, 'manifest.json'), 'utf8'));
const dist = resolve(process.argv[2] ?? join(root, 'dist'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const recipePath = 'recettes/amok-trey/index.html';
const target = join(dist, recipePath);
const generatedBytes = readFileSync(target);
const generated = generatedBytes.toString('utf8');
const releasedRecipe = manifest.files.find(file => file.path === recipePath);
assert.ok([manifest.sourceRecipeSha256, releasedRecipe.sha256].includes(digest(generatedBytes)),
  'Source recipe changed since this release contract; review and version the new release');
const original = readFileSync(join(reference, 'recipe-before.html'));
assert.equal(digest(original), manifest.referenceRecipeSha256, 'Historical recipe reference changed');

// FileZilla release preparation inserted this generated section immediately
// before the existing glossary. Preserve every byte outside that insertion.
const sections = [...generated.matchAll(/<section class="recipe-workshops"[^>]*>.*?<\/section>/gs)]
  .map(match => match[0]).filter(section => section.includes('href="/apprendre/pratique/amok-trey/"'));
assert.equal(sections.length, 1, 'Exactly one generated Amok workshop link is required');
const anchor = '<aside class="glossary-strip" aria-labelledby="glossary-title"';
const before = original.toString('utf8');
assert.equal(before.split(anchor).length, 2, 'Historical insertion anchor changed');
assert.ok(!before.includes('/apprendre/pratique/amok-trey/'), 'Reference already contains the new workshop');
const offset = before.indexOf(anchor);
const packaged = Buffer.from(before.slice(0, offset) + sections[0] + ' ' + before.slice(offset));

// Validate the complete result and its historical runtime before any write.
for (const file of manifest.files) {
  const bytes = file.path === recipePath ? packaged : readFileSync(join(dist, file.path));
  assert.equal(digest(bytes), file.sha256, 'Release output differs from approved manifest: ' + file.path);
}
const assets = manifest.runtime.map(asset => {
  const bytes = readFileSync(join(reference, asset.file));
  assert.equal(digest(bytes), asset.sha256, 'Historical runtime changed: ' + asset.file);
  const destination = join(dist, asset.path);
  if (existsSync(destination)) {
    assert.equal(digest(readFileSync(destination)), asset.sha256, 'Runtime destination conflict');
  }
  return { bytes, destination };
});
for (const asset of assets) {
  mkdirSync(dirname(asset.destination), { recursive: true });
  writeFileSync(asset.destination, asset.bytes);
}
writeFileSync(target, packaged);
for (const file of manifest.files) {
  assert.equal(digest(readFileSync(join(dist, file.path))), file.sha256);
  console.log(file.sha256 + '  ' + file.path);
}
console.log('AMOK_V4_REPRODUCTION_PASS 5/5');
