export function initRecipeFilters() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-recipe-filter]'));
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-recipe-card]'));
  const status = document.querySelector<HTMLElement>('[data-filter-status]');

  if (!buttons.length || !cards.length) return () => {};

  const setFilter = (filter: string) => {
    let visible = 0;

    cards.forEach((card) => {
      const difficulty = card.dataset.difficulty ?? '';
      const tags = card.dataset.tags ?? '';
      const totalMinutes = Number(card.dataset.totalMinutes ?? Number.POSITIVE_INFINITY);
      const show = filter === 'all'
        || (filter === 'rapide' && totalMinutes <= 30)
        || difficulty === filter
        || tags.includes(filter);

      card.hidden = !show;
      if (show) visible += 1;
    });

    buttons.forEach((button) => {
      const active = button.dataset.recipeFilter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (status) status.textContent = `${visible} recette${visible > 1 ? 's' : ''}`;
  };

  const handlers = buttons.map((button) => {
    const handler = () => setFilter(button.dataset.recipeFilter ?? 'all');
    button.addEventListener('click', handler);
    return { button, handler };
  });

  return () => handlers.forEach(({ button, handler }) => button.removeEventListener('click', handler));
}
