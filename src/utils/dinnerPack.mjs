import { PILOT_SLUGS, buildPilotShoppingList } from './dinnerPreview.mjs';
import { buildPilotServicePlan } from './dinnerTimeline.mjs';

export const DINNER_PACK_NOTICE = 'Aperçu gratuit fondé sur deux recettes publiées, et non sur une expérience payante déjà disponible.';

export function buildPilotDinnerPack(recipes, guests, serviceTime) {
  if (!Array.isArray(recipes)) throw new TypeError('Invalid pilot recipe catalogue');
  const selected = PILOT_SLUGS.map((slug) => recipes.find((recipe) => recipe?.slug === slug));
  if (selected.some((recipe) => !recipe)) throw new RangeError('A pilot dish is missing');
  const [main, dessert] = selected;

  const items = buildPilotShoppingList(selected, guests);
  const timeline = buildPilotServicePlan(main, dessert, serviceTime);
  const equipment = [...new Set(selected.flatMap((recipe) => recipe.equipment ?? []).map((item) => item.trim()).filter(Boolean))];

  return {
    guests,
    serviceTime,
    menu: selected.map(({ slug, title }) => ({ slug, title })),
    items,
    timeline,
    equipment,
    notice: DINNER_PACK_NOTICE,
  };
}

export function buildPilotDinnerPackText(pack) {
  if (!pack || !Array.isArray(pack.items) || !pack.timeline || !Array.isArray(pack.menu)) {
    throw new TypeError('Invalid dinner pack');
  }
  const ingredients = pack.items.map(({ display }) => '- [ ] ' + display);
  const times = pack.timeline.steps.map(({ time, title, description }) => '- ' + time + ' : ' + title + ' — ' + description);
  return [
    'CUISINE DU CAMBODGE — MON DINER KHMER',
    '',
    pack.notice,
    'Nombre de convives : ' + pack.guests,
    'Heure souhaitée pour le plat : ' + pack.timeline.servingTime,
    '',
    'RECETTES GRATUITES UTILISEES',
    ...pack.menu.map(({ slug, title }) => '- ' + title + ' : https://www.cuisine-du-cambodge.com/recettes/' + slug + '/'),
    '',
    'LISTE DE COURSES — ESTIMATION SELON LES FICHES RECETTES',
    ...ingredients,
    '',
    'PLANNING INDICATIF — AMOK TREY',
    ...times,
    '',
    'DESSERT — CHEK KTIS (A ORGANISER SEPAREMENT)',
    'Préparation : ' + pack.timeline.dessertPrepMinutes + ' min',
    'Cuisson : ' + pack.timeline.dessertCookMinutes + ' min',
    '',
    'MATERIEL INDIQUE DANS LES RECETTES',
    ...(pack.equipment.length ? pack.equipment.map((item) => '- ' + item) : ['- Consulter les fiches recettes']),
    'Les quantités de matériel proviennent des fiches de base. Adaptez notamment les ramequins au nombre de convives.',
    '',
    'IMPORTANT : les temps sont indicatifs et ne garantissent pas une heure exacte de service.',
    'Pour l’Amok, rectifier l’assaisonnement avant l’ajout des œufs et du poisson crus. Ne jamais goûter une préparation contenant ces ingrédients crus.',
    'Les quantités non précisées restent à doser au goût. Le menu premium complet est en préparation.',
    '',
  ].join('\n');
}
