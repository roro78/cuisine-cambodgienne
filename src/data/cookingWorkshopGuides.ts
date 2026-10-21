import kroeung from './atelier-recette-guides/kroeung-jaune.json';
import lokLak from './atelier-recette-guides/lok-lak.json';
import samlorMachu from './atelier-recette-guides/samlor-machu.json';
import numBanhChok from './atelier-recette-guides/num-banh-chok.json';
import kuyTeav from './atelier-recette-guides/kuy-teav.json';
import baiSachChrouk from './atelier-recette-guides/bai-sach-chrouk.json';

// Source of truth for discovery after release. Legacy tutorials remain untouched.
export const cookingWorkshopGuides=[kroeung,lokLak,samlorMachu,numBanhChok,kuyTeav,baiSachChrouk];
export const releasedCookingWorkshopGuides=cookingWorkshopGuides.filter(guide=>guide.status==='release_ready');
// No draft replaces an indexable page: listening approval is not a release gate.
export const completeCookingWorkshopCutoverReady=
  cookingWorkshopGuides.length===6 && releasedCookingWorkshopGuides.length===6;
export const integratedCookingWorkshopGuides=completeCookingWorkshopCutoverReady
  ? releasedCookingWorkshopGuides : [];
export function getIntegratedCookingWorkshopForRecipe(slug:string){
  return integratedCookingWorkshopGuides.filter(guide=>guide.sourceRecipeSlug===slug);
}
export function getReleasedCookingWorkshopForRecipe(slug:string){
  return releasedCookingWorkshopGuides.filter(guide=>guide.sourceRecipeSlug===slug);
}
