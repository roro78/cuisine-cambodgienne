/**
 * Portion selection is scoped to new cooking-workshop pages only.
 * Legacy recipe pages, recipe data, audio files and manifests remain untouched.
 */
function quantityLabel(value: number, unit: string): string {
  if (!Number.isFinite(value)) return '';
  const rounded = Math.round(value * 1000) / 1000;
  if (unit === 'g' || unit === 'ml') return String(Math.round(rounded));
  const whole = Math.floor(rounded);
  const fractions: Array<[number, string]> = [
    [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'], [0.5, '½'],
    [0.667, '⅔'], [0.75, '¾'], [0.875, '⅞']
  ];
  const part = rounded - whole;
  const fraction = fractions.find(([v]) => Math.abs(part - v) < 0.015)?.[1];
  if (fraction) return whole ? `${whole} ${fraction}` : fraction;
  return rounded.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

export function initCookingWorkshopServings(): void {
  document.querySelectorAll<HTMLElement>('[data-workshop-servings-root]').forEach((root) => {
    if (root.dataset.servingsEnhanced === 'true') return;
    const base = Number(root.dataset.baseServings);
    const input = root.querySelector<HTMLInputElement>('[data-workshop-servings-input]');
    const summary = root.querySelector<HTMLElement>('[data-workshop-servings-summary]');
    const quantities = [...root.querySelectorAll<HTMLElement>('[data-workshop-ingredient-quantity]')];
    const presets = [...root.querySelectorAll<HTMLButtonElement>('[data-workshop-serving-preset]')];
    if (!Number.isFinite(base) || base <= 0 || !input || !summary || !quantities.length) return;
    root.dataset.servingsEnhanced = 'true';

    const min = 1;
    const max = 12;
    let servings = base;
    const render = () => {
      const factor = servings / base;
      input.value = String(servings);
      summary.textContent = `${servings} personne${servings > 1 ? 's' : ''}`;
      quantities.forEach((quantity) => {
        const source = Number(quantity.dataset.baseQuantity);
        if (!Number.isFinite(source)) return;
        const adjusted = source * factor;
        const unit = quantity.dataset.unit ?? '';
        quantity.textContent = quantityLabel(adjusted, unit);
        const item = quantity.closest<HTMLElement>('[data-workshop-ingredient]');
        const label = item?.querySelector<HTMLElement>('[data-workshop-ingredient-name]');
        if (label) {
          label.textContent = (adjusted <= 1.001)
            ? (label.dataset.singularName || label.dataset.pluralName || '')
            : (label.dataset.pluralName || label.dataset.singularName || '');
        }
      });
      presets.forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.workshopServingPreset) === servings)));
    };
    const select = (value: number) => {
      if (!Number.isInteger(value) || value < min || value > max) {
        input.value = String(servings);
        return;
      }
      servings = value;
      render();
    };
    input.addEventListener('change', () => select(Number(input.value)));
    presets.forEach((button) => button.addEventListener('click', () => select(Number(button.dataset.workshopServingPreset))));
    render();
  });
}
