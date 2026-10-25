import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { socialPhotoTransform, SOCIAL_DIMENSIONS, inspectSocialDimensions } from '../scripts/social-image-layout.mjs';

test('social JPEG crops to portrait 4:5 with no letterbox', async () => {
  // In-memory portrait source: no reliance on OVH, Meta, local art or external files.
  const input = await sharp({
    create: { width: 1600, height: 900, channels: 3, background: '#9c5746' }
  }).jpeg().toBuffer();
  const output = await socialPhotoTransform(sharp(input), {sourceId: 'recette:offline'})
    .jpeg({quality:85}).toBuffer();
  const info = await sharp(output).metadata();
  assert.equal(info.format, 'jpeg');
  assert.equal(info.width, SOCIAL_DIMENSIONS.width);
  assert.equal(info.height, SOCIAL_DIMENSIONS.height);
  assert.doesNotThrow(()=>inspectSocialDimensions(info,'recette:offline'));
  const {data,info:raw}=await sharp(output).raw().toBuffer({resolveWithObject:true});
  const top=Array.from(data.subarray(0, raw.channels));
  const midStart=Math.floor(raw.height/2)*raw.width*raw.channels;
  const mid=Array.from(data.subarray(midStart,midStart+raw.channels));
  assert.deepEqual(top,mid,'Both upper and middle feed pixels are photo, no added beige padding');
});
test('social asset dimensions fail closed instead of accepting letterboxed or tiny exports', () => {
  assert.throws(()=>inspectSocialDimensions({width:1080,height:1080},'x'),/dimensions_invalid/);
  assert.throws(()=>inspectSocialDimensions({width:300,height:1350},'x'),/dimensions_invalid/);
});
test('Kroeung uses a relevant mortar source only for social, without editing article or recipe', () => {
  const catalog=readFileSync(new URL('../src/data/socialCatalog.ts',import.meta.url),'utf8');
  const ingredient=readFileSync(new URL('../src/data/ingredients.ts',import.meta.url),'utf8');
  assert.match(catalog,/ingredient\.slug === 'kroeung'/);
  assert.match(catalog,/v19-mortier-kroeung-1200\.webp/);
  assert.match(ingredient,/image: '\/images\/cuisine\/kroeung-1600\.webp'/);
  const build=readFileSync(new URL('../scripts/build-social-assets.mjs',import.meta.url),'utf8');
  assert.match(build,/socialPhotoTransform/);
  assert.doesNotMatch(build,/fit: 'contain'/);
  assert.doesNotMatch(build,/#f4efe6/);
});
