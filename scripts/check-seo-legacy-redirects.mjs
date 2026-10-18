// Contrat de non-régression des anciennes URL du site.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const srcFile = 'public/.htaccess';
const target = 'src/pages/recettes/index.astro';
assert.ok(existsSync(srcFile), 'Apache redirect file is missing in public/');
assert.ok(existsSync(target), 'The intended /recettes/ target page is missing');
const apache = readFileSync(srcFile, 'utf8');
const rule = /^RedirectMatch 301 \^\/recettes-cambodgiennes\/\?\$ https:\/\/www\.cuisine-du-cambodge\.com\/recettes\/$/m;
assert.match(apache, rule, 'Missing explicit permanent redirect to the equivalent recipe catalogue');
assert.match(apache, /^RedirectMatch 301 \\^\\/le-riz-symbole-de-vie-au-cambodge\\/\\?\\$ https:\\/\\/www\\.cuisine-du-cambodge\\.com\\/culture\\/le-riz-symbole-de-vie-au-cambodge\\/$/m, 'Missing exact permanent redirect for the recreated rice article');
assert.ok(readFileSync('src/data/culture.ts', 'utf8').includes("slug: 'le-riz-symbole-de-vie-au-cambodge'"), 'Restored rice cultural article route is missing');
assert.ok(!/recettes_khmeres_poulet_curry|nom-krob-totim|samla-mchou-yuan|les-marches-cambodgiens/.test(apache),
  'Do not redirect different historical content to an unrelated page');
if (existsSync('dist/')) {
  assert.ok(existsSync('dist/.htaccess'), 'Astro did not copy .htaccess to the deployment root');
  assert.equal(readFileSync('dist/.htaccess', 'utf8'), apache, 'The compiled Apache redirect file is not identical');
}
console.log('PASS: specific 301 redirect and destination route; no misleading redirects.');
