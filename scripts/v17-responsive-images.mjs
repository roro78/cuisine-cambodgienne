/**
 * V17: deterministic derivative images for responsive delivery.
 * Original files, original artwork and attribution are never altered.
 * Produces real static files for Astro dev/build and OVH's static dist/.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dir=path.join(process.cwd(),'public','images','cuisine');
const jobs=[
  ['v17-hero-amok-genere.webp',[[640,67],[1120,72]]],
  ['v17-galangal-1000.jpg',[[480,70]]],
  ['v17-mortar-hands-1600.jpg',[[800,70],[1200,72]]],
  ['v17-kroeung-final.jpg',[[360,68]]],
  ['v17-chili-450.png',[[120,70]]],
  ['v17-tablee-khmere-generee.webp',[[960,67],[1280,71]]]
];
let savings=0;
for(const [source,targets] of jobs){
  const input=path.join(dir,source);
  const {width:sourceWidth}=await sharp(input).metadata();
  const before=(await fs.stat(input)).size;
  const stem=source.replace(/\.[^.]+$/,'');
  for(const [width,quality] of targets){
    if(width>=sourceWidth)throw Error('Invalid responsive width for '+source+': '+width);
    const dest=path.join(dir,stem+'-'+width+'.webp');
    await sharp(input).rotate().resize({width,withoutEnlargement:true})
      .webp({quality,effort:4}).toFile(dest);
    const result=(await fs.stat(dest)).size;
    if(result>=before)throw Error('Derivative larger than original: '+dest);
    savings+=before-result;
    console.log('V17 image '+path.basename(dest)+' '+result+' bytes (original '+before+')');
  }
}
console.log('V17 responsive derivatives ready; per-variant byte savings summed: '+savings);
