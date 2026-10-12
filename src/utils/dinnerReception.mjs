import { PILOT_SLUGS, PILOT_SIDE_SLUG } from './dinnerPreview.mjs';
import { buildPilotDinnerPack } from './dinnerPack.mjs';
import { SERVICE_TIMES, readRecipeDuration } from './dinnerTimeline.mjs';

/**
 * An original editorial service notebook, designed for a home-cooking rehearsal.
 * The clock derives solely from existing public recipe durations.
 * It has not been validated in a real kitchen and is NOT a food-safety timer.
 */
export const RECEPTION_STATUS = 'Parcours éditorial en cours d’essai · Ni atelier animé ni produit commercialisé';
export const RECEPTION_SIDE_NOTE = 'L’accompagnement ajoute un temps de travail distinct. Aucun chevauchement de cuissons ni maintien au chaud n’a été testé.';
export const RECEPTION_SAFETY = 'N’assaisonnez et ne goûtez la base de l’Amok qu’avant l’ajout des œufs et du poisson crus. Ne goûtez jamais une préparation contenant ces ingrédients crus. Contrôlez la cuisson complète des aliments avant le service.';
export const RECEPTION_VALIDATION = 'À confirmer par un essai culinaire réel : enchaînement du service, tailles des portions, cuisson, matériel, dressage et dégustation.';

const script = [
  {
    id: 'choix',
    number: '01',
    eyebrow: 'Avant de recevoir',
    title: 'Un menu qui respire',
    description: 'Choisissez les plats en fonction de votre table, puis repérez ce qui demande de l’attention. La liste des courses est calculée depuis les recettes ; les finitions sans quantité sont à prévoir selon vos goûts.',
    tasks: [
      { id: 'sources', label: 'Relire les fiches recettes et leurs substitutions avant les achats.' },
      { id: 'courses', label: 'Rassembler les ingrédients frais et les aromates ; vérifier les allergies et restrictions des convives.' },
      { id: 'outils', label: 'Vérifier les ramequins, le panier vapeur et l’espace de préparation.' }
    ],
    lesson: 'Le fil gourmand : coco et aromates pour le plat, fraîcheur pour le partage, douceur du coco au dessert. C’est une intention de menu, pas une dégustation déjà validée.'
  },
  {
    id: 'mise-en-place',
    number: '02',
    eyebrow: 'En cuisine',
    title: 'Tout préparer avant la vapeur',
    description: 'Mesurez et disposez les ingrédients des recettes choisies. Gardez séparés les produits crus, les herbes de finition et les ustensiles propres : le confort du service se prépare ici.',
    tasks: [
      { id: 'aromates', label: 'Préparer le kroeung et les herbes selon la fiche Amok Trey.' },
      { id: 'separation', label: 'Prévoir une zone propre pour les finitions, distincte des ingrédients crus.' },
      { id: 'convives', label: 'Ajuster le nombre de contenants à servir au nombre réel de convives.' }
    ],
    lesson: 'Repère à observer : la base aromatique doit être homogène avant l’incorporation des ingrédients crus. Rectifiez l’assaisonnement à ce stade uniquement.'
  },
  {
    id: 'feu',
    number: '03',
    eyebrow: 'Le temps juste',
    title: 'Respecter le rythme du plat',
    description: 'Le conducteur donne des heures théoriques pour l’Amok Trey, déduites des temps indiqués dans sa recette. Un temps de marge sert à s’organiser, pas à garantir le service à la minute.',
    tasks: [
      { id: 'depart', label: 'Réserver le créneau de préparation du plat et la marge avant cuisson.' },
      { id: 'vapeur', label: 'Contrôler le matériel vapeur avant de commencer la cuisson.' },
      { id: 'cuisson', label: 'Vérifier une cuisson complète ; ne pas se fier uniquement à l’horloge.' }
    ],
    lesson: 'Repère à observer : le centre doit être pris et le poisson complètement cuit. Si le résultat ne correspond pas, poursuivez la cuisson en privilégiant la sécurité.'
  },
  {
    id: 'table',
    number: '04',
    eyebrow: 'Le geste de recevoir',
    title: 'Servir avec générosité',
    description: 'Placez les herbes fraîches à portée de main et prévoyez la place des plats à partager. Une table bien organisée permet de profiter du repas plutôt que de courir entre la cuisine et les assiettes.',
    tasks: [
      { id: 'dressage', label: 'Préparer l’espace de dressage et les contenants de service.' },
      { id: 'herbes', label: 'Ajouter les herbes de finition au dernier moment, avec des ustensiles propres.' },
      { id: 'question', label: 'Demander aux convives ce qu’ils ont préféré : parfum, texture, fraîcheur ou contraste.' }
    ],
    lesson: 'Le point de dégustation, après cuisson complète : le parfum du kroeung, la douceur du coco et la fraîcheur des herbes doivent se distinguer sans s’effacer.'
  },
  {
    id: 'dessert',
    number: '05',
    eyebrow: 'La dernière bouchée',
    title: 'Finir sur une note douce',
    description: 'Le Chek Ktis a ses propres durées de préparation et de cuisson. Elles sont affichées séparément : le menu ne prétend pas avoir été chronométré de bout en bout.',
    tasks: [
      { id: 'coco', label: 'Préparer le lait de coco et les bananes selon la fiche Chek Ktis.' },
      { id: 'texture', label: 'Observer la texture des bananes pendant la cuisson douce.' },
      { id: 'retour', label: 'Noter ce qu’il faudra ajuster lors du prochain essai.' }
    ],
    lesson: 'Repère à observer : les bananes doivent rester tendres sans se défaire ; la crème coco doit rester agréable et souple.'
  }
];

const sidePhase = {
  id: 'partage',
  number: '03 bis',
  eyebrow: 'Facultatif · À partager',
  title: 'Une bouchée de caractère',
  description: 'Le Prahok Ktis associe prahok, porc, kroeung et coco. C’est une préparation séparée : son temps ne peut pas être ajouté au planning de l’Amok sans essai de coordination.',
  tasks: [
    { id: 'prahok', label: 'Lire la recette de Prahok Ktis et prévoir un créneau de travail distinct.' },
    { id: 'porc', label: 'Vérifier la cuisson complète du porc avant toute dégustation ou correction d’assaisonnement.' },
    { id: 'cru', label: 'Préparer les crudités avec des ustensiles propres, séparés du porc cru.' }
  ],
  lesson: 'Un peu de fraîcheur change l’équilibre : servez ce plat avec les crudités indiquées dans la recette. Adaptez la quantité de prahok progressivement, seulement après cuisson complète.'
};

export function buildReceptionNotebook(recipes, { guests = 2, serviceTime = '20:00', includeSide = false } = {}) {
  if (typeof includeSide !== 'boolean') throw new TypeError('Invalid optional dish selection');
  if (!SERVICE_TIMES.includes(serviceTime)) throw new RangeError('Unsupported service time');
  const pack = buildPilotDinnerPack(recipes, guests, serviceTime, includeSide);
  const dessert = recipes.find((recipe) => recipe.slug === PILOT_SLUGS[1]);
  const side = includeSide ? recipes.find((recipe) => recipe.slug === PILOT_SIDE_SLUG) : null;
  if (!dessert || (includeSide && !side)) throw new RangeError('Missing source recipes');
  const phases = includeSide
    ? [...script.slice(0, 3), sidePhase, ...script.slice(3)]
    : [...script];
  return {
    guests,
    serviceTime,
    includeSide,
    pack,
    chapters: phases,
    tasksCount: phases.reduce((total, phase) => total + phase.tasks.length, 0),
    dessertMinutes: readRecipeDuration(dessert.prepTime) + readRecipeDuration(dessert.cookTime),
    sideMinutes: side ? readRecipeDuration(side.prepTime) + readRecipeDuration(side.cookTime) : null,
    status: RECEPTION_STATUS,
    safety: RECEPTION_SAFETY,
    validation: RECEPTION_VALIDATION
  };
}

export function getNotebookProgress(notebook, checkedKeys) {
  if (!notebook || !Array.isArray(notebook.chapters) || !(checkedKeys instanceof Set)) throw new TypeError('Invalid notebook');
  const keys = notebook.chapters.flatMap((c) => c.tasks.map((task) => c.id + ':' + task.id));
  const done = keys.filter((key) => checkedKeys.has(key)).length;
  return { done, total: keys.length, percentage: keys.length ? Math.round((done / keys.length) * 100) : 0 };
}
