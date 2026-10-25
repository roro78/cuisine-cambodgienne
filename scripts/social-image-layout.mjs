/** Product-first social render. Original photographs are never changed.
 * Landscape photos stay readable on mobile: center-weighted 1080×840 window
 * with a soft photographic extension in a 1080×1080 canvas, rather than a
 * 4:5 hard crop that cuts the dish. No solid colored bars / false photography.
 */
import sharp from 'sharp';

export const SOCIAL_DIMENSIONS = Object.freeze({ width: 1080, height: 1080 });
export const inspectSocialDimensions = (metadata, sourceId) => {
  if (!metadata || metadata.width !== SOCIAL_DIMENSIONS.width ||
      metadata.height !== SOCIAL_DIMENSIONS.height)
    throw new Error('social_asset_dimensions_invalid:' + sourceId);
};

const featherMask=(w,h,axis)=> {
  const vertical=axis==='vertical';
  const stops='<stop offset="0%" stop-color="white" stop-opacity="0"/>'+
   '<stop offset="11%" stop-color="white" stop-opacity="1"/>'+
   '<stop offset="89%" stop-color="white" stop-opacity="1"/>'+
   '<stop offset="100%" stop-color="white" stop-opacity="0"/>';
  const gradient=vertical
    ? '<linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">'+stops+'</linearGradient>'
    : '<linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">'+stops+'</linearGradient>';
  return Buffer.from('<svg width="'+w+'" height="'+h+'" xmlns="http://www.w3.org/2000/svg"><defs>'+gradient+'</defs><rect width="100%" height="100%" fill="url(#edge)"/></svg>');
};

/** Asynchronous because the same original is used for the sharp foreground and soft extension.
 * Returns a sharp pipeline, ready for JPEG conversion. The foreground is not
 * zoomed to 4:5 and the blurred extension never contains added factual objects.
 */
export const socialPhotoTransform=async(pipeline,{sourceId='unknown'}={})=>{
  if(!pipeline||typeof pipeline.toBuffer!=='function')throw new TypeError('social_image_source_missing:'+sourceId);
  const source=await pipeline.rotate().toBuffer();
  const meta=await sharp(source).metadata();
  if(!meta.width||!meta.height)throw new Error('social_image_invalid_source:'+sourceId);
  const {width,height}=SOCIAL_DIMENSIONS;
  const base=await sharp(source).resize(width,height,{fit:'cover',position:'centre'})
    .blur(26).modulate({brightness:0.9,saturation:0.92}).ensureAlpha().png().toBuffer();
  const landscape=meta.width/meta.height>=1.20;
  const box=landscape?{width,height:840}:{width:880,height};
  const overlay=await sharp(source).resize(box.width,box.height,{
    fit:'cover',position:'centre',withoutEnlargement:false
  }).ensureAlpha().png().toBuffer();
  const softened=await sharp(overlay).composite([{
    input:featherMask(box.width,box.height,landscape?'vertical':'horizontal'),
    blend:'dest-in'
  }]).png().toBuffer();
  return sharp(base).composite([{
    input:softened,
    top:Math.floor((height-box.height)/2),
    left:Math.floor((width-box.width)/2)
  }]).flatten({background:'#fff'});
};