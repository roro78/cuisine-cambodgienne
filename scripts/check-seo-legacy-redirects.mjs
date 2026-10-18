// Contrat de non-régression des anciennes URL et du build statique OVH.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

assert.ok(existsSync('public/.htaccess'), 'Apache redirect file missing');
assert.ok(existsSync('src/pages/recettes/index.astro'), 'Recipe catalogue target missing');
assert.ok(readFileSync('src/data/culture.ts', 'utf8').includes("slug: 'le-riz-symbole-de-vie-au-cambodge'"),
  'Restored rice article route missing from the culture data');

const apache = readFileSync('public/.htaccess', 'utf8');
const lines = apache.split(/\r?\n/).map((line) => line.trim());
const expectedRules = [
  'RedirectMatch 301 ^/recettes-cambodgiennes/?$ https://www.cuisine-du-cambodge.com/recettes/',
  'RedirectMatch 301 ^/le-riz-symbole-de-vie-au-cambodge/?$ https://www.cuisine-du-cambodge.com/culture/le-riz-symbole-de-vie-au-cambodge/'
];
for (const rule of expectedRules) {
  assert.ok(lines.includes(rule), `Missing permanent Apache redirect: ${rule}`);
}
assert.ok(!/recettes_khmeres_poulet_curry|nom-krob-totim|samla-mchou-yuan|les-marches-cambodgiens/.test(apache),
  'Do not redirect historical pages to different recipes or topics');

if (existsSync('dist/')) {
  assert.ok(existsSync('dist/.htaccess'), 'Compiled output is missing the Apache redirect file');
  assert.equal(readFileSync('dist/.htaccess', 'utf8'), apache, 'Compiled Apache redirect differs from source');
}
console.log('PASS: two relevant 301 redirects, existing targets and Apache output.');
