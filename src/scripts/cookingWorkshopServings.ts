import {formatQuantity as quantityLabel,scaledQuantity,updatePortionSlots} from '../utils/recipePortions';

export function initCookingWorkshopServings(): void {
  document.querySelectorAll<HTMLElement>('[data-workshop-servings-root]').forEach((root) => {
    if (root.dataset.servingsEnhanced === 'true') return;
    const base = Number(root.dataset.baseServings);
    const input = root.querySelector<HTMLInputElement>('[data-workshop-servings-input]');
    const summary = root.querySelector<HTMLElement>('[data-workshop-servings-summary]');
    const quantities = [...root.querySelectorAll<HTMLElement>('[data-workshop-ingredient-quantity]')];
    const presets = [...root.querySelectorAll<HTMLButtonElement>('[data-workshop-serving-preset]')];
    const customToggle = root.querySelector<HTMLButtonElement>('[data-workshop-custom-toggle]');
    const customPanel = root.querySelector<HTMLElement>('[data-workshop-custom-count]');
    const closeCustom = () => {
      if (customPanel) customPanel.hidden = true;
      customToggle?.setAttribute('aria-expanded', 'false');
    };
    customToggle?.addEventListener('click', () => {
      if (!customPanel) return;
      customPanel.hidden = !customPanel.hidden;
      customToggle.setAttribute('aria-expanded', String(!customPanel.hidden));
      if (!customPanel.hidden) input?.focus();
    });
    if (!Number.isFinite(base) || base <= 0 || !input || !summary || !quantities.length) return;
    root.dataset.servingsEnhanced = 'true';

    const min = 1;
    const max = 12;
    let servings = base;
    const render = () => {
      updatePortionSlots(root.closest('main') ?? root,servings);
      input.value = String(servings);
      summary.textContent = root.dataset.workshopPortionKind === 'pot'
        ? `${servings} petit${servings > 1 ? 's' : ''} pot${servings > 1 ? 's' : ''}`
        : `${servings} personne${servings > 1 ? 's' : ''}`;
      const hero = root.closest('main')?.querySelector<HTMLElement>('[data-workshop-servings-hero]');
      const kind = root.dataset.workshopPortionKind;
      if (hero) {
        const unit = kind === 'pot' ? (servings > 1 ? 'petits pots' : 'petit pot')
          : kind === 'bol' ? (servings > 1 ? 'bols' : 'bol')
          : kind === 'assiette' ? (servings > 1 ? 'assiettes' : 'assiette')
          : (servings > 1 ? 'personnes' : 'personne');
        hero.textContent = `${servings} ${unit}`;
      }
      quantities.forEach((quantity) => {
        const source = Number(quantity.dataset.baseQuantity);
        if (!Number.isFinite(source)) return;
        const adjusted = scaledQuantity(source,base,servings,quantity.dataset.scalable !== 'false');
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
    presets.forEach((button) => button.addEventListener('click', () => {
      select(Number(button.dataset.workshopServingPreset));
      closeCustom();
    }));
    render();
  });
}
