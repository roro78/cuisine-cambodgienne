function formatQuantity(value: number, unit = '') {
  if (!Number.isFinite(value)) return '';

  const rounded = Math.round(value * 100) / 100;
  const fractions: Record<string, string> = {
    '0.25': '¼',
    '0.33': '⅓',
    '0.5': '½',
    '0.67': '⅔',
    '0.75': '¾'
  };

  if (unit === 'g' || unit === 'ml') {
    return String(Math.round(rounded));
  }

  const whole = Math.floor(rounded);
  const fraction = Math.round((rounded - whole) * 100) / 100;
  const key = Object.keys(fractions).find((candidate) => Math.abs(Number(candidate) - fraction) < .03);

  if (key) {
    return whole > 0 ? `${whole} ${fractions[key]}` : fractions[key];
  }

  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

export function initRecipeServings() {
  const root = document.querySelector<HTMLElement>('[data-recipe-servings-root]');
  if (!root) return;

  const base = Number(root.dataset.baseServings ?? 1);
  const min = Number(root.dataset.minServings ?? 1);
  const max = Number(root.dataset.maxServings ?? 12);
  const currentEl = root.querySelector<HTMLElement>('[data-serving-current]');
  const labelEl = root.querySelector<HTMLElement>('[data-serving-label]');
  const quantityEls = Array.from(document.querySelectorAll<HTMLElement>('[data-ingredient-quantity]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-serving-action], [data-serving-value]'));

  let current = base;

  const render = () => {
    const factor = current / base;
    if (currentEl) currentEl.textContent = String(current);
    if (labelEl) labelEl.textContent = `personne${current > 1 ? 's' : ''}`;

    quantityEls.forEach((el) => {
      const original = Number(el.dataset.baseQuantity ?? 0);
      const unit = el.dataset.unit ?? '';
      const scalable = el.dataset.scalable !== 'false';
      el.textContent = formatQuantity(scalable ? original * factor : original, unit);
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
