import {formatQuantity,scaledQuantity,updatePortionSlots} from '../utils/recipePortions';

export function initRecipeServings() {
  const root = document.querySelector<HTMLElement>('[data-recipe-servings-root]');
  if (!root) return;

  const base = Number(root.dataset.baseServings ?? 1);
  const min = Number(root.dataset.minServings ?? 1);
  const max = Number(root.dataset.maxServings ?? 12);
  const summary = document.querySelector<HTMLElement>('[data-serving-summary]');
  const currentEls = Array.from(root.querySelectorAll<HTMLElement>('[data-serving-current]'));
  const labelEls = Array.from(root.querySelectorAll<HTMLElement>('[data-serving-label]'));
  const quantityEls = Array.from(document.querySelectorAll<HTMLElement>('[data-ingredient-quantity]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-serving-action], [data-serving-value]'));

  let current = base;

  const render = () => {
    updatePortionSlots(root.closest('main') ?? document,current);
    currentEls.forEach((el) => { el.textContent = String(current); });
    if (summary) summary.textContent = `${current} personne${current > 1 ? 's' : ''}`;
    labelEls.forEach((el) => { el.textContent = `personne${current > 1 ? 's' : ''}`; });

    quantityEls.forEach((el) => {
      const original = Number(el.dataset.baseQuantity ?? 0);
      const unit = el.dataset.unit ?? '';
      const scalable = el.dataset.scalable !== 'false';
      el.textContent = formatQuantity(scaledQuantity(original,base,current,scalable), unit);
    });

    buttons.forEach((button) => {
      if (button.dataset.servingAction === 'decrease') button.disabled = current <= min;
      if (button.dataset.servingAction === 'increase') button.disabled = current >= max;
      if (button.dataset.servingValue) {
        const active = Number(button.dataset.servingValue) === current;
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.servingAction === 'decrease') current = Math.max(min, current - 1);
      if (button.dataset.servingAction === 'increase') current = Math.min(max, current + 1);
      if (button.dataset.servingValue) current = Math.min(max, Math.max(min, Number(button.dataset.servingValue)));
      render();
    });
  });

  render();
}

export function initRecipeChecklist() {
  document.querySelectorAll<HTMLInputElement>('[data-ingredient-check]').forEach((input) => {
    input.addEventListener('change', () => {
      input.closest('li')?.classList.toggle('is-checked', input.checked);
    });
  });
}

export function initRecipeSteps() {
  const steps = Array.from(document.querySelectorAll<HTMLElement>('[data-guided-step]'));
  if (!steps.length) return;

  steps.forEach((step) => {
    const toggle = step.querySelector<HTMLButtonElement>('[data-step-toggle]');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const done = step.classList.toggle('is-done');
      toggle.setAttribute('aria-pressed', done ? 'true' : 'false');
      toggle.textContent = done ? 'Étape terminée' : 'Marquer comme faite';
    });
  });
}
