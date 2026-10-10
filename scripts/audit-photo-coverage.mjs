import fs from 'node:fs';
import path from 'node:path';

const imageDir = 'public/images/cuisine';
const sources = [
  'src/pages/index.astro',
  'src/pages/recettes/index.astro',
  'src/pages/culture/index.astro',
  'src/pages/ingredients/index.astro',
  'src/data/recipes.ts',
  'src/data/culture.ts',
  'src/data/ingredients.ts'
];
const subject = (filename) => filename.replace(/-\d+(?=\.(?:webp|png|jpe?g)$)/i, '').replace(/\.(?:webp|png|jpe?g)$/i, '');
const files = fs.readdirSync(imageDir).filter((f) => /\.(?:webp|png|jpe?g)$/i.test(f));
const bySubject = new Map();
for (const f of files) bySubject.set(subject(f), [...(bySubject.get(subject(f)) || []), f]);
const usages = new Map();
const missing = [];
for (const source of sources) {
  const text = fs.readFileSync(source, 'utf8');
  const refs = [...text.matchAll(/\/images\/cuisine\/([\w-]+\.(?:webp|png|jpe?g))/gi)].map((m) => m[1]);
  const unique = [...new Set(refs.map((r) => subject(r)))];
  for (const ref of refs) if (!fs.existsSync(path.join(imageDir, ref))) missing.push(source + ': ' + ref);
  for (const item of unique) usages.set(item, [...(usages.get(item) || []), source]);
}
console.log('# Inventaire des photographies — Cuisine du Cambodge\n');
console.log('Une famille = le même sujet à diverses tailles, pas une photo nouvelle.\n');
console.log('| Famille visuelle | Versions présentes | Références dans sources auditables |');
console.log('| --- | ---: | --- |');
for (const [name, variants] of [...bySubject.entries()].sort((a,b) => a[0].localeCompare(b[0]))) {
  console.log('| ' + name + ' | ' + variants.length + ' | ' + (usages.get(name) || []).map(x => '`' + x + '`').join(', ') + ' |');
}
const absent = [...usages.keys()].filter((name) => !bySubject.has(name));
if (missing.length || absent.length) {
  console.error('\nReferenced media missing from public folder:\n' + missing.concat(absent).map(x => '- ' + x).join('\n'));
  process.exitCode = 1;
}
