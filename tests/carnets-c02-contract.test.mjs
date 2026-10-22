import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/data/culture.ts', 'utf8');
const template = readFileSync('src/pages/culture/[slug].astro', 'utf8');
const start = source.indexOf("    slug: 'poivre-de-kampot'");
const end = source.indexOf("    slug: 'comprendre-le-kroeung'");
assert.ok(start >= 0 && end > start, 'C02 must retain its stable slug and surrounding articles');
const c02 = source.slice(start, end);

assert.match(c02, /title: 'Le poivre de Kampot, de la plantation à la table'/);
assert.match(c02, /image: '\/images\/cuisine\/kampot-1600\.webp'/);
const localWebp = readFileSync('public/images/cuisine/kampot-1600.webp');
assert.equal(localWebp.toString('ascii', 0, 4), 'RIFF', 'WebP RIFF magic');
assert.equal(localWebp.toString('ascii', 8, 12), 'WEBP', 'WebP format signature');
assert.equal(localWebp.toString('ascii', 12, 16), 'VP8 ', 'WebP lossy frame format');
const naturalWidth = localWebp.readUInt16LE(26) & 0x3fff;
const naturalHeight = localWebp.readUInt16LE(28) & 0x3fff;
assert.equal(naturalWidth, 1600, 'Do not confuse original camera dimensions with encoded WebP');
assert.equal(naturalHeight, 1067);
assert.match(c02, new RegExp('imageWidth: ' + naturalWidth + ','), 'Declared image width must match real binary');
assert.match(c02, new RegExp('imageHeight: ' + naturalHeight + ','), 'Declared image height must match real binary');
assert.match(c02, /readingTime: '5 min'/);
assert.equal([...c02.matchAll(/^\s{8}title:\s/gm)].length, 7, 'The draft must contain seven H2 chapters');
assert.equal([...c02.matchAll(/^\s{8}paragraphs:\s\[/gm)].length, 7, 'Every chapter must have paragraphs');
assert.doesNotMatch(c02, /tourismGuide|https:\/\/tourismcambodia\.org/, 'Do not keep the broken reference in C02');
assert.match(c02, /kampotpepper-kppa\.com\/fr\/production/);
assert.match(c02, /fao\.org\/one-country-one-priority-product/);
assert.match(c02, /cambodiaip\.gov\.kh/);
assert.doesNotMatch(template, /article\.sources\.map\s*\(/, 'No public documentary bibliography');
assert.equal([...source.matchAll(/^\s{4}slug: '/gm)].length, 7, 'Seven original slugs must survive');

console.log('PASS: C02 preview contains seven chapters, unchanged route/media, internal evidence and no visible bibliography.');
