import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {socialPhotoTransform,SOCIAL_DIMENSIONS,inspectSocialDimensions} from '../scripts/social-image-layout.mjs';

test('real product-centred square fills photographic corners and avoids deep portrait cropping',async()=>{
  // White centre product against dark wood, with safe margin in the landscape source.
  const source=await sharp({
    create:{width:1600,height:900,channels:3,background:'#4e5c43'}
  }).composite([{input:{
    create:{width:670,height:450,channels:3,background:'#ddb447'}
  },left:465,top:225}]).png().toBuffer();
  const output=await (await socialPhotoTransform(sharp(source),{sourceId:'recette:offline'}))
    .jpeg({quality:85}).toBuffer();
  const info=await sharp(output).metadata();
  assert.equal(info.format,'jpeg');
  assert.deepEqual([info.width,info.height],[1080,1080]);
  assert.doesNotThrow(()=>inspectSocialDimensions(info,'recette:offline'));
  const center=await sharp(output).extract({left:490,top:490,width:100,height:100}).stats();
  const corner=await sharp(output).extract({left:10,top:10,width:100,height:100}).stats();
  assert.ok(Number.isFinite(center.channels[0].mean) && Number.isFinite(corner.channels[0].mean),
    'Rendered photo must preserve valid pixel values before manual visual approval');
  assert.ok(corner.channels[0].mean>0,'photographic backdrop should fill the square with no empty band');
});
test('image dimensions fail closed for legacy portrait 4:5 and malformed outputs',()=>{
  assert.throws(()=>inspectSocialDimensions({width:1080,height:1350},'old'),/dimensions_invalid/);
  assert.throws(()=>inspectSocialDimensions({width:900,height:900},'x'),/dimensions_invalid/);
});
test('Kroeung uses a legible product in a mortar only for social, without editing the original article',()=>{
  const catalog=readFileSync(new URL('../src/data/socialCatalog.ts',import.meta.url),'utf8');
  const ingredient=readFileSync(new URL('../src/data/ingredients.ts',import.meta.url),'utf8');
  assert.match(catalog,/ingredient\.slug === 'kroeung'/);
  assert.match(catalog,/mortier-etape-04\.webp/);
  assert.match(ingredient,/image: '\/images\/cuisine\/kroeung-1600\.webp'/);
  const build=readFileSync(new URL('../scripts/build-social-assets.mjs',import.meta.url),'utf8');
  assert.match(build,/socialPhotoTransform/);
  const layout=readFileSync(new URL('../scripts/social-image-layout.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(layout,/sharp\.strategy\.attention/);
  assert.match(layout,/featherMask/);
});
