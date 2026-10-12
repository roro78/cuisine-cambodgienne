/**
 * Kitchen mode demonstrator. Steps come from the free public recipe catalogue.
 * It deliberately does not promise a paid class, a specialist or a finished premium product.
 */
export const PILOT_GUIDE_SLUGS = Object.freeze(['amok-trey', 'chek-ktis']);
export const PILOT_GUIDE_SIDE_SLUG = 'prahok-ktis';
export const AMOK_RAW_EGG_CAUTION = 'Rectifiez le goût avec la sauce de poisson et le sucre AVANT d’incorporer les œufs crus. Ajoutez ensuite les œufs battus. Ne goûtez pas une préparation contenant des œufs ou du poisson crus.';
export const PRAHOK_RAW_PORK_CAUTION = 'Laissez le porc cuire complètement avant toute dégustation. Ajoutez le prahok progressivement, puis rectifiez l’assaisonnement uniquement lorsque toute la préparation est bien cuite. Ne goûtez jamais le porc cru ou insuffisamment cuit.';

export function buildPilotKitchenGuide(recipes, includeSide = false) {
  if (typeof includeSide !== 'boolean') throw new TypeError('Invalid optional side choice');
  const chosenSlugs = includeSide ? [...PILOT_GUIDE_SLUGS, PILOT_GUIDE_SIDE_SLUG] : PILOT_GUIDE_SLUGS;
  if (!Array.isArray(recipes) || recipes.length < chosenSlugs.length) {
    throw new RangeError('The kitchen guide must include both published preview dishes.');
  }

  return chosenSlugs.map((slug) => {
    const recipe = recipes.find((item) => item?.slug === slug);
    if (!recipe || !Array.isArray(recipe.steps) || recipe.steps.length === 0) {
      throw new RangeError('Missing kitchen steps for ' + slug);
    }
    return {
      slug,
      title: recipe.title,
      intro: recipe.intro,
      steps: recipe.steps.map((step, index) => ({
        id: slug + '-step-' + (index + 1),
        title: step.title,
        // Reinforce the safe instructions already published in the Amok and Prahok recipes (PR #25).
        text: slug === 'amok-trey' && index === 1
          ? AMOK_RAW_EGG_CAUTION
          : slug === 'prahok-ktis' && /^Ajouter le prahok/i.test(step.title)
            ? PRAHOK_RAW_PORK_CAUTION
            : step.text,
        cue: step.cue ?? null,
        mistake: step.mistake ?? null,
        duration: step.duration ?? null,
      }))
    };
  });
}

export function readGuideStep(dishes, slug, index) {
  const dish = dishes.find((item) => item.slug === slug);
  if (!dish || !Number.isInteger(index) || index < 0 || index >= dish.steps.length) {
    throw new RangeError('Unknown guide step');
  }
  return { dish, step: dish.steps[index], position: index + 1, total: dish.steps.length };
}

export function getGuideCompletedCount(dish, completedStepIds) {
  if (!dish || !Array.isArray(dish.steps) || !(completedStepIds instanceof Set)) {
    throw new TypeError('Invalid guide completion state');
  }
  return dish.steps.filter((step) => completedStepIds.has(step.id)).length;
}
