/** Social feed export uses true full-bleed photography, not beige letterboxing.
 * Keep the source media unchanged (site and article remain untouched).
 * Crop is for social variants only and is subject to human editorial review.
 */
import sharp from 'sharp';

export const SOCIAL_DIMENSIONS = Object.freeze({ width: 1080, height: 1350 });
export const inspectSocialDimensions = (metadata, sourceId) => {
  if (!metadata || metadata.width !== SOCIAL_DIMENSIONS.width ||
      metadata.height !== SOCIAL_DIMENSIONS.height)
    throw new Error('social_asset_dimensions_invalid:' + sourceId);
};
export const socialPhotoTransform = (pipeline, {sourceId = 'unknown'} = {}) => {
  if (!pipeline || typeof pipeline.rotate !== 'function') {
    throw new TypeError('social_image_source_missing:' + sourceId);
  }
  // Sharp cover fills the 4:5 frame entirely. Attention chooses a subject-aware
  // crop, but a human must approve that the plated dish/ingredient is represented.
  return pipeline
    .rotate()
    .resize(SOCIAL_DIMENSIONS.width, SOCIAL_DIMENSIONS.height, {
      fit: 'cover',
      position: sharp.strategy.attention,
      withoutEnlargement: false,
    })
    .flatten({ background: '#ffffff' });
};
