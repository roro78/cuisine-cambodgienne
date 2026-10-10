/** Indicative planning from published recipe metadata; no food-service time guarantee. */
export const SERVICE_TIMES = Object.freeze(['19:00', '19:30', '20:00', '20:30', '21:00']);
export const PLANNING_MARGIN_MINUTES = 15;

export function readRecipeDuration(value) {
  const match = typeof value === 'string' && value.trim().match(/^(\d+)\s*min$/i);
  if (!match) throw new RangeError('Duration must use a plain number of minutes');
  const minutes = Number(match[1]);
  if (!Number.isSafeInteger(minutes) || minutes < 0 || minutes > 360) {
    throw new RangeError('Unsupported recipe duration');
  }
  return minutes;
}

function parseClock(time) {
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) {
    throw new RangeError('Invalid service time');
  }
  const [h, m] = time.split(':').map(Number);
  if (h > 23 || m > 59) throw new RangeError('Invalid service time');
  return h * 60 + m;
}

export function displayClock(minutes) {
  if (!Number.isFinite(minutes)) throw new RangeError('Invalid clock minutes');
  const normalised = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalised / 60);
  const mins = normalised % 60;
  return String(hours).padStart(2, '0') + 'h' + String(mins).padStart(2, '0');
}

export function buildPilotServicePlan(mainRecipe, dessertRecipe, servingTime, bufferMinutes = PLANNING_MARGIN_MINUTES) {
  if (!mainRecipe || !dessertRecipe) throw new TypeError('Pilot recipes are required');
  if (!SERVICE_TIMES.includes(servingTime)) throw new RangeError('Unsupported service time');
  if (!Number.isInteger(bufferMinutes) || bufferMinutes < 0 || bufferMinutes > 60) {
    throw new RangeError('Invalid planning margin');
  }
  const prep = readRecipeDuration(mainRecipe.prepTime);
  const cook = readRecipeDuration(mainRecipe.cookTime);
  const dessertPrep = readRecipeDuration(dessertRecipe.prepTime);
  const dessertCook = readRecipeDuration(dessertRecipe.cookTime);
  const servingMinutes = parseClock(servingTime);
  const start = servingMinutes - prep - cook - bufferMinutes;
  return {
    main: mainRecipe.title,
    dessert: dessertRecipe.title,
    prepMinutes: prep,
    cookMinutes: cook,
    marginMinutes: bufferMinutes,
    dessertPrepMinutes: dessertPrep,
    dessertCookMinutes: dessertCook,
    servingTime: displayClock(servingMinutes),
    steps: [
      { id: 'prep', time: displayClock(start), title: 'Commencer les préparations', description: mainRecipe.title + ' : ' + prep + ' min de préparation selon la fiche recette.' },
      { id: 'margin', time: displayClock(start + prep), title: 'Garder une marge', description: bufferMinutes + ' min prévues pour s’organiser ; cette marge est un conseil de planification, pas un temps de cuisson.' },
      { id: 'cook', time: displayClock(servingMinutes - cook), title: 'Lancer la cuisson', description: mainRecipe.title + ' : ' + cook + ' min de cuisson indiquées dans la recette. Vérifiez les repères de cuisson.' },
      { id: 'serve', time: displayClock(servingMinutes), title: 'Servir le plat', description: 'Heure souhaitée de service. Les durées varient selon le matériel et les portions.' }
    ]
  };
}
