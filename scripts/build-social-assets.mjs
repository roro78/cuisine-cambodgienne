/**
 * Produce native JPEGs for Instagram from existing site media (no new AI images).
 * The public social feed and this script use the same typed catalog source.
 * Images remain subject to human rights/editorial review before any publication.
 */
import { build } from 'esbuild';
import sharp from 'sharp';
import { socialPhotoTransform, inspectSocialDimensions } from './social-image-layout.mjs';
import { mkdir, access } from 'node:fs/promises';
import path from 'node:path';

const output = await build({
  entryPoints: [path.resolve('src/data/socialCatalog.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  logLevel: 'error'
});
const encoded = Buffer.from(output.outputFiles[0].text).toString('base64');
const { getSocialCatalog } = await import(`data:text/javascript;base64,${encoded}`);
const items = getSocialCatalog();
const destination = path.resolve('public/social-assets');
await mkdir(destination, { recursive: true });
let built = 0;
for (const item of items) {
  if (!item.originalImageUrl) continue;
  const input = path.resolve('public', new URL(item.originalImageUrl).pathname.slice(1));
  await access(input).catch(() => { throw new Error(`Source image missing for ${item.id}: ${input}`); });
  const out = path.join(destination, `${item.kind}-${item.id.split(':')[1]}.jpg`);
  await (await socialPhotoTransform(sharp(input), { sourceId: item.id }))
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(out);
  const meta = await sharp(out).metadata();
  if (meta.format !== 'jpeg') throw new Error(`Invalid social JPEG: ${out}`);
  inspectSocialDimensions(meta, item.id);
  built += 1;
}
console.log(`social-assets: ${built} validated JPEGs from ${items.length} site sources`);
