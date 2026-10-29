import kroeung from './atelier-recette-guides/kroeung-jaune.json';
import lokLak from './atelier-recette-guides/lok-lak.json';
import samlorMachu from './atelier-recette-guides/samlor-machu.json';
import numBanhChok from './atelier-recette-guides/num-banh-chok.json';
import kuyTeav from './atelier-recette-guides/kuy-teav.json';
import baiSachChrouk from './atelier-recette-guides/bai-sach-chrouk.json';

type WorkshopBlueprint = typeof kroeung | typeof lokLak | typeof samlorMachu
  | typeof numBanhChok | typeof kuyTeav | typeof baiSachChrouk;

/**
 * Shared blueprint registry. Future validated JSON blueprints enter the ONE
 * common Astro template without creating a hand-authored page per workshop.
 * Existing six retain their historical order for stable catalog rendering.
 */
const modules = import.meta.glob<WorkshopBlueprint>('./atelier-recette-guides/*.json', {
  eager: true, import: 'default'
});
const knownOrder = [
  'kroeung-jaune','lok-lak','samlor-machu','num-banh-chok','kuy-teav','bai-sach-chrouk'
];
const allEntries = Object.entries(modules);
const sortKey = (path:string) => {
  const basename = path.split('/').at(-1)?.replace(/\.json$/,'') ?? '';
  const knownIndex = knownOrder.indexOf(basename);
  return knownIndex>=0 ? String(knownIndex).padStart(4,'0') : '9999-'+basename;
};
allEntries.sort((a,b)=>sortKey(a[0]).localeCompare(sortKey(b[0])));
export const cookingWorkshopGuides = allEntries.map(([,guide])=>guide);

if (cookingWorkshopGuides.length !== new Set(cookingWorkshopGuides.map(guide=>guide.slug)).size)
  throw new Error('Duplicate cooking workshop slug in blueprints');

export const releasedCookingWorkshopGuides = cookingWorkshopGuides
  .filter(guide=>guide.status==='release_ready');

// Keep the historical six-way SEO cutover even if future workshops enter as
// unapproved drafts. Never let an extra JSON silently reactivate old tutorials.
export const completeCookingWorkshopCutoverReady = knownOrder.every(sourceSlug=>
  releasedCookingWorkshopGuides.some(guide=>guide.sourceRecipeSlug===sourceSlug)
);
export const integratedCookingWorkshopGuides = completeCookingWorkshopCutoverReady
  ? releasedCookingWorkshopGuides : [];
export function getIntegratedCookingWorkshopForRecipe(slug:string) {
  return integratedCookingWorkshopGuides.filter(guide=>guide.sourceRecipeSlug===slug);
}
export function getReleasedCookingWorkshopForRecipe(slug:string) {
  return releasedCookingWorkshopGuides.filter(guide=>guide.sourceRecipeSlug===slug);
}
