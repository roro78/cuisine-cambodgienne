/**
 * Optional PRESENTATION choices for the shared Astro cooking-workshop page.
 * Every new validated guide inherits the defaults automatically; an unusual
 * serving unit or historical canonical route can be expressed as data here.
 * Never change the approved culinary/audio blueprint just to alter its layout.
 */
export type WorkshopPortionKind = 'assiette'|'bol'|'pot';
interface Presentation {
  publicSlug?: string;
  portionKind?: WorkshopPortionKind;
  heroCaption?: string;
  heroServingsLabel?: string;
  promise?: string;
  finishTitle?: string;
  finishText?: string;
  finishLink?: string;
  finishLabel?: string;
}
const presentation: Record<string,Presentation> = {
  'kroeung-jaune':{
    publicSlug:'kroeung-jaune',
    portionKind:'pot',
    heroCaption:'Visuel éditorial du kroeung jaune préparé au mortier.',
    heroServingsLabel:'petit pot',
    promise:'Vous préparerez les aromates, apprendrez pourquoi les fibres se coupent finement et découvrirez comment leur texture évolue au mortier. À la fin, vous saurez reconnaître une pâte liée, fine et très parfumée.',
    finishTitle:'Un petit pot de kroeung utilisable en cuisine.',
    finishText:'La pâte se tient et ne comporte presque plus de longues fibres. Transférez-la dans un contenant propre et utilisez-la pour parfumer une préparation cuite. Le kroeung n’est pas un plat à déguster seul.',
    finishLink:'/recettes/amok-trey/',
    finishLabel:'Utiliser le kroeung dans un Amok Trey'
  },
  'samlor-machu':{portionKind:'bol'},
  'kuy-teav':{portionKind:'bol'},
  'num-banh-chok':{portionKind:'bol'}
};
export function getWorkshopPresentation(guide:{sourceRecipeSlug:string;slug:string}) {
  const options=presentation[guide.sourceRecipeSlug] ?? {};
  const portionKind=options.portionKind ?? 'assiette';
  const singular=portionKind==='pot'?'petit pot':portionKind==='bol'?'bol':'assiette';
  return {
    publicSlug:options.publicSlug ?? guide.slug,
    portionKind,
    singular,
    heroCaption:options.heroCaption ?? 'Visuel éditorial de la préparation.',
    promise:options.promise,
    finishTitle:options.finishTitle,
    finishText:options.finishText,
    finishLink:options.finishLink,
    finishLabel:options.finishLabel
  };
}
