import kroeung from './atelier-recette-guides/kroeung-jaune.json';
import lokLak from './atelier-recette-guides/lok-lak.json';
import samlorMachu from './atelier-recette-guides/samlor-machu.json';
import numBanhChok from './atelier-recette-guides/num-banh-chok.json';
import kuyTeav from './atelier-recette-guides/kuy-teav.json';
import baiSachChrouk from './atelier-recette-guides/bai-sach-chrouk.json';

// Source of truth for discovery after release. Legacy tutorials remain untouched.
export const cookingWorkshopGuides=[kroeung,lokLak,samlorMachu,numBanhChok,kuyTeav,baiSachChrouk];
export const releasedCookingWorkshopGuides=cookingWorkshopGuides.filter(guide=>guide.status==='release_ready');
// Les six fiches peuvent être raccordées pour revue sans prétendre qu'elles sont
// publiables : photos, droits et tests de navigation restent indépendants de l'écoute.
const audioApprovedGuides=cookingWorkshopGuides.filter(guide=>
  guide.review.audioListeningValidated===true &&
  guide.review.recipeValidated===true &&
  guide.review.editorialValidated===true &&
  Boolean(guide.audio.asset));
export const integratedCookingWorkshopGuides=audioApprovedGuides.length===6
  ? audioApprovedGuides : releasedCookingWorkshopGuides;
export function getIntegratedCookingWorkshopForRecipe(slug:string){
  return integratedCookingWorkshopGuides.filter(guide=>guide.sourceRecipeSlug===slug);
}
export function getReleasedCookingWorkshopForRecipe(slug:string){
  return releasedCookingWorkshopGuides.filter(guide=>guide.sourceRecipeSlug===slug);
}
