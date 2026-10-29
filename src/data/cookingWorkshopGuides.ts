import kroeung from './atelier-recette-guides/kroeung-jaune.json';
import lokLak from './atelier-recette-guides/lok-lak.json';
import samlorMachu from './atelier-recette-guides/samlor-machu.json';
import numBanhChok from './atelier-recette-guides/num-banh-chok.json';
import kuyTeav from './atelier-recette-guides/kuy-teav.json';
import baiSachChrouk from './atelier-recette-guides/bai-sach-chrouk.json';

/**
 * Blueprints registered once here, rendered by the SINGLE dynamic Astro page.
 * New workshops add a validated JSON and one registration, NEVER a new .astro.
 * Explicit imports remain compatible with Astro AND standalone Node/esbuild
 * editorial index tests (unlike import.meta.glob in a shared data module).
 */
export const cookingWorkshopGuides=[kroeung,lokLak,samlorMachu,numBanhChok,kuyTeav,baiSachChrouk];
export const releasedCookingWorkshopGuides=cookingWorkshopGuides.filter(guide=>guide.status==='release_ready');

// Preserve the historical six-way cutover if a new private/review workshop is
// added; a seventh blueprint must not reactivate legacy tutorial URLs.
const baselineSourceSlugs=['kroeung-jaune','lok-lak','samlor-machu',
  'num-banh-chok','kuy-teav','bai-sach-chrouk'];
export const completeCookingWorkshopCutoverReady=baselineSourceSlugs.every(slug=>
  releasedCookingWorkshopGuides.some(guide=>guide.sourceRecipeSlug===slug));
export const integratedCookingWorkshopGuides=completeCookingWorkshopCutoverReady
  ? releasedCookingWorkshopGuides : [];
export function getIntegratedCookingWorkshopForRecipe(slug:string){
  return integratedCookingWorkshopGuides.filter(guide=>guide.sourceRecipeSlug===slug);
}
export function getReleasedCookingWorkshopForRecipe(slug:string){
  return releasedCookingWorkshopGuides.filter(guide=>guide.sourceRecipeSlug===slug);
}
