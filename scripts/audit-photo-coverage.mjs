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
for (const file of files) bySubject.set(subject(file), [...(bySubject.get(subject(file)) || []), file]);

const usages = new Map();
const checked = new Set();
const missing = [];
const generated = new Set();

const exists = (src, source) => {
  if (!src.startsWith('/images/cuisine/')) return;
  checked.add(src);
  if (!fs.existsSync(path.join('public', src.slice(1)))) missing.push(source + ': ' + src);
};

const checkSet = (src, widths, source) => {
  if (!/-\d+\.webp$/.test(src)) return;
  for (const width of widths.split(',').map((v) => Number(v.trim())).filter(Number.isFinite)) {
    const candidate = src.replace(/-\d+\.webp$/, `-${width}.webp`);
    generated.add(candidate);
    exists(candidate, source + ' (responsive ' + width + 'w)');
  }
};

for (const source of sources) {
  const content = fs.readFileSync(source, 'utf8');
  const refs = [...content.matchAll(/\/images\/cuisine\/([\w-]+\.(?:webp|png|jpe?g))/gi)]
    .map((m) => '/images/cuisine/' + m[1]);

  // Direct src and explicitly listed srcset URLs.
  for (const ref of refs) exists(ref, source);
  for (const name of new Set(refs.map((r) => subject(path.basename(r))))) {
    usages.set(name, [...(usages.get(name) || []), source]);
  }

  // Astro-generated responsive URLs do NOT appear in the source as literals.
  // Mirror imageAtWidth() using both literal call sites and data imageWidths.
  for (const match of content.matchAll(/imageSrcSet\(\s*['"]([^'"]+\.webp)['"]\s*,\s*\[([\d,\s]+)\]\s*\)/g)) {
    checkSet(match[1], match[2], source);
  }
  for (const match of content.matchAll(/image:\s*['"](\/images\/cuisine\/[\w-]+\.webp)['"][\s\S]{0,400}?imageWidths:\s*\[([\d,\s]+)\]/g)) {
    checkSet(match[1], match[2], source);
  }
}

// Validate the intrinsic aspect ratio of the direct recipe-listing hero.
// This guards against portrait replacements accidentally declared as 3:2.
function webpSize(src) {
  const buf = fs.readFileSync(path.join('public', src.slice(1)));
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('Not a WebP file: ' + src);
  }
  const format = buf.toString('ascii', 12, 16);
  if (format === 'VP8X') {
    return [
      1 + buf[24] + (buf[25] << 8) + (buf[26] << 16),
      1 + buf[27] + (buf[28] << 8) + (buf[29] << 16)
    ];
  }
  if (format === 'VP8 ') {
    return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  }
  if (format === 'VP8L') {
    return [
      1 + buf[21] + ((buf[22] & 0x3f) << 8),
      1 + (buf[22] >> 6) + (buf[23] << 2) + ((buf[24] & 0xf) << 10)
    ];
  }
  throw new Error('Unsupported WebP format: ' + format + ' in ' + src);
}

console.log('## Dimensions réelles des visuels 1600w');
for (const file of files.filter((name) => /-1600\.webp$/.test(name))) {
  const [width, height] = webpSize('/images/cuisine/' + file);
  console.log(`- ${file}: ${width} × ${height}`);
}

const recipeListing = fs.readFileSync('src/pages/recettes/index.astro', 'utf8');
const hero = recipeListing.match(/<figure><img src="(\/images\/cuisine\/[^"]+\.webp)"[^>]*width="(\d+)" height="(\d+)"/);
if (!hero) {
  missing.push('Recipe listing primary photograph lacks a testable image path and intrinsic dimensions');
} else {
  try {
    const [actualW, actualH] = webpSize(hero[1]);
    const actual = actualW / actualH;
    const declared = Number(hero[2]) / Number(hero[3]);
    if (Math.abs(actual - declared) / actual > 0.03) {
      missing.push(`Recipe hero ${hero[1]} is ${actualW}x${actualH}, but HTML declares ${hero[2]}x${hero[3]}`);
    }
    if (actual < 1.25) missing.push(`Recipe hero ${hero[1]} is not a landscape photograph (${actualW}x${actualH})`);
  } catch (error) {
    missing.push(String(error));
  }
}

console.log('# Inventaire des photographies — Cuisine du Cambodge\n');
console.log('Une famille = le même sujet à diverses tailles, pas une nouvelle photo.\n');
console.log('| Famille visuelle | Versions présentes | Références dans sources auditables |');
console.log('| --- | ---: | --- |');
for (const [name, variants] of [...bySubject.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log('| ' + name + ' | ' + variants.length + ' | ' + (usages.get(name) || []).map((x) => '`' + x + '`').join(', ') + ' |');
}
console.log(`\nPhotographies vérifiées : ${checked.size} URLs, dont ${generated.size} variantes responsive générées.\n`);
if (missing.length) {
  console.error('Photographies manquantes ou incohérentes:\n' + missing.map((x) => '- ' + x).join('\n'));
  process.exitCode = 1;
}
