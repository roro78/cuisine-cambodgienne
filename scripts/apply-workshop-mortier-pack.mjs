#!/usr/bin/env node
/** Verify then import the four approved workshop WebP files. Run locally in a Git checkout. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (key) => args.find((s) => s.startsWith(key + '='))?.slice(key.length + 1);
const sourceRoot = path.resolve(arg('--source') || path.join(root, 'atelier-pilote-mortier'));
const apply = args.includes('--apply');
if (args.includes('--help')) {
  console.log('Usage: node scripts/apply-workshop-mortier-pack.mjs --source=/path/to/unzipped/pack [--check | --apply]');
  process.exit(0);
}
const approved = [
  { name: 'mortier-etape-01.webp', hash: '756b53f1d0ab96dae9fbaaffa3e0001c08c10bdf11e84cf9989e5b51180c21c9', height: 827 },
  { name: 'mortier-etape-02.webp', hash: '5fd27c9bd6fc97b07eda5d068c94299333854ba0b95803a2728cca9d04fa0e31', height: 930 },
  { name: 'mortier-etape-03.webp', hash: '52da14b5755c20fab7ae7e3e1d8d33bafb8876bd7347431313face2fbfbf78ce', height: 930 },
  { name: 'mortier-etape-04.webp', hash: 'cbfb1e8a04b585320500e6aad585c65d291954bec07e8a09907d778fcbc4554e', height: 930 }
];
const destDir = path.join(root, 'public/images/workshops');
const inputs = [];
for (const file of approved) {
  const src = path.join(sourceRoot, 'public/images/workshops', file.name);
  const bytes = await fs.readFile(src);
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== file.hash) throw new Error(file.name + ': unapproved SHA-256: ' + hash);
  if (bytes.subarray(0, 4).toString() !== 'RIFF' || bytes.subarray(8, 12).toString() !== 'WEBP') throw new Error(file.name + ': not WebP');
  const metadata = await sharp(bytes).metadata();
  if (metadata.format !== 'webp' || metadata.width !== 1240 || metadata.height !== file.height) throw new Error(file.name + ': unexpected dimensions');
  console.log('PASS', file.name, bytes.length, 'bytes', metadata.width + 'x' + metadata.height, hash.slice(0, 12));
  inputs.push({ name: file.name, bytes });
}
if (!apply) { console.log('CHECK ONLY: add --apply to import and enable gallery.'); process.exit(0); }
await fs.mkdir(destDir, { recursive: true });
for (const item of inputs) await fs.writeFile(path.join(destDir, item.name), item.bytes);
const dataPath = path.join(root, 'src/data/workshopAudio.ts');
let data = await fs.readFile(dataPath, 'utf8');
if (data.includes('mortarImagePackReady = false')) {
  data = data.replace('mortarImagePackReady = false', 'mortarImagePackReady = true');
  await fs.writeFile(dataPath, data);
} else if (!data.includes('mortarImagePackReady = true')) throw new Error('Gallery flag not found');
console.log('APPLIED: 4 WebP imported and gallery enabled. Run npm run check, npm run build, npm run test:editorial; commit the files.');
