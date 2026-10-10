/**
 * Kitchen mode demonstrator. Steps come from the free public recipe catalogue.
 * It deliberately does not promise a paid class, a specialist or a finished premium product.
 */
export const PILOT_GUIDE_SLUGS = Object.freeze(['amok-trey', 'chek-ktis']);
export const AMOK_RAW_EGG_CAUTION = 'Rectifiez le goût avec la sauce de poisson et le sucre AVANT d’incorporer les œufs crus. Ajoutez ensuite les œufs battus. Ne goûtez pas une préparation contenant des œufs ou du poisson crus.';

export function buildPilotKitchenGuide(recipes) {
  if (!Array.isArray(recipes) || recipes.length !== PILOT_GUIDE_SLUGS.length) {
    throw new RangeError('The kitchen guide must include both published preview dishes.');
  }

  return PILOT_GUIDE_SLUGS.map((slug) => {
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
        // Temporary safety copy. A separate editorial revision of the public recipe is needed.
        text: slug === 'amok-trey' && index === 1 ? AMOK_RAW_EGG_CAUTION : step.text,
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
