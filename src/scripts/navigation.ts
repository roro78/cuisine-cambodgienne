export function initNavigation() {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  const menu = document.querySelector<HTMLDetailsElement>('[data-mobile-menu]');
  if (!header) return () => {};

  const overlay = header.dataset.overlay === 'true';

  const updateHeader = () => {
    const scrolled = window.scrollY > 24;
    header.classList.toggle('is-scrolled', scrolled);
    header.classList.toggle('is-overlay-top', overlay && !scrolled);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const onToggle = () => {
    const open = Boolean(menu?.open);
    document.documentElement.classList.toggle('menu-open', open);
    header.classList.toggle('is-menu-open', open);
  };

  menu?.addEventListener('toggle', onToggle);

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && menu?.open) {
      menu.open = false;
      menu.querySelector<HTMLElement>('summary')?.focus();
    }
  };
  window.addEventListener('keydown', onKeydown);

  const links = menu ? Array.from(menu.querySelectorAll<HTMLAnchorElement>('a')) : [];
  const closeMenu = () => {
    if (menu?.open) menu.open = false;
  };
  links.forEach((link) => link.addEventListener('click', closeMenu));

  return () => {
    window.removeEventListener('scroll', updateHeader);
    window.removeEventListener('keydown', onKeydown);
    menu?.removeEventListener('toggle', onToggle);
    links.forEach((link) => link.removeEventListener('click', closeMenu));
    document.documentElement.classList.remove('menu-open');
  };
}
