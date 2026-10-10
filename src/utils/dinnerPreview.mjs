/**
 * Preview-only dinner planner.
 * Uses the existing recipe catalogue as its sole source of quantities.
 * Does not change existing recipe portions, checkout or content.
 */
export const PILOT_SLUGS = Object.freeze(['amok-trey', 'chek-ktis']);

function normalisedKey(name, unit) {
  return name.trim().toLocaleLowerCase('fr-FR') + '\u0000' + (unit ?? '').trim().toLocaleLowerCase('fr-FR');
}

export function formatPreviewQuantity(value) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError('Invalid ingredient quantity');
  return Number(value.toFixed(2)).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

export function buildPilotShoppingList(selectedRecipes, guests) {
  if (!Number.isInteger(guests) || guests < 1 || guests > 12) {
    throw new RangeError('Expected 1 to 12 guests');
  }

  const grouped = new Map();

  for (const recipe of selectedRecipes) {
    if (!Number.isFinite(recipe.baseServings) || recipe.baseServings <= 0) {
      throw new RangeError('Invalid recipe base portions');
    }
    for (const ingredient of recipe.ingredients) {
      const name = ingredient.name.trim();
      const unit = (ingredient.unit ?? '').trim();
      const isMeasured = typeof ingredient.quantity === 'number';
      const scalable = ingredient.scalable !== false;
      const quantity = isMeasured ? ingredient.quantity * (scalable ? guests / recipe.baseServings : 1) : null;
      const key = normalisedKey(name, unit);
      const existing = grouped.get(key);
      if (existing) {
        if (quantity === null || existing.quantity === null) {
          existing.quantity = null;
        } else {
          existing.quantity += quantity;
        }
        if (!existing.dishes.includes(recipe.title)) existing.dishes.push(recipe.title);
      } else {
        grouped.set(key, { name, unit, quantity, dishes: [recipe.title] });
      }
    }
  }

  return [...grouped.values()].map((item) => ({
    ...item,
    display: item.quantity === null
      ? item.name
      : [formatPreviewQuantity(item.quantity), item.unit, item.name].filter(Boolean).join(' ')
  }));
}

export function buildShoppingListText(items, guests) {
  return [
    'Cuisine du Cambodge — Aperçu de liste de courses',
    'Pour ' + guests + ' personnes',
    'Amok Trey + Chek Ktis · menu de démonstration',
    '',
    ...items.map(({ display }) => '□ ' + display),
    '',
    'Cette liste reprend deux recettes gratuites existantes. Le menu premium est en préparation.',
  ].join('\n');
}
