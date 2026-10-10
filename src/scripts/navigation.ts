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

  const desktopQuery = window.matchMedia('(min-width: 721px)');
  const onViewportChange = () => {
    // A menu opened on mobile must not lock the desktop page after rotation/resize.
    if (desktopQuery.matches && menu?.open) menu.open = false;
  };
  desktopQuery.addEventListener('change', onViewportChange);

  const onKeydown = (event: KeyboardEvent) => {
    if (!menu?.open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      menu.open = false;
      menu.querySelector<HTMLElement>('summary')?.focus();
      return;
    }

    if (event.key === 'Tab' && !desktopQuery.matches) {
      const focusables = Array.from(menu.querySelectorAll<HTMLElement>('summary, a[href]'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      // Keep the keyboard in the drawer until it is closed.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
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
    desktopQuery.removeEventListener('change', onViewportChange);
    menu?.removeEventListener('toggle', onToggle);
    links.forEach((link) => link.removeEventListener('click', closeMenu));
    document.documentElement.classList.remove('menu-open');
  };
}
