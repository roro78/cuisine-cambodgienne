export function initNavigation() {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  const menu = document.querySelector<HTMLDetailsElement>('[data-mobile-menu]');
  if (!header) return () => {};

  const overlay = header.dataset.overlay === 'true';
  const summary = menu?.querySelector<HTMLElement>('summary');
  const dialog = menu?.querySelector<HTMLElement>('.mobile-menu-panel');
  const links = menu ? Array.from(menu.querySelectorAll<HTMLAnchorElement>('.mobile-menu-panel a[href]')) : [];
  const desktopQuery = window.matchMedia('(min-width: 721px)');

  // A fixed, scroll-locking drawer must also isolate the underlying page for
  // keyboard and screen-reader users. Restore any pre-existing inert state.
  const background = Array.from(document.querySelectorAll<HTMLElement>(
    'main, footer, .site-nav .brand-lockup, .site-nav .nav-links'
  ));
  const previousInert = new Map(background.map((el) => [el, el.inert]));

  const updateHeader = () => {
    const scrolled = window.scrollY > 24;
    header.classList.toggle('is-scrolled', scrolled);
    header.classList.toggle('is-overlay-top', overlay && !scrolled);
  };

  const restoreBackground = () => {
    for (const el of background) el.inert = previousInert.get(el) ?? false;
  };

  const onToggle = () => {
    const open = Boolean(menu?.open) && !desktopQuery.matches;
    if (desktopQuery.matches && menu?.open) menu.open = false;
    document.documentElement.classList.toggle('menu-open', open);
    header.classList.toggle('is-menu-open', open);
    for (const el of background) el.inert = open ? true : (previousInert.get(el) ?? false);

    if (open) {
      // Place focus inside the modal drawer instead of trapping it on a
      // disclosure summary that sits outside role=dialog.
      (links[0] ?? dialog)?.focus();
    } else if (dialog?.contains(document.activeElement)) {
      summary?.focus();
    }
  };

  const onViewportChange = () => {
    // Releasing the drawer on desktop also releases the background scroll lock.
    if (desktopQuery.matches && menu?.open) menu.open = false;
    onToggle();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (!menu?.open || desktopQuery.matches) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      menu.open = false;
      summary?.focus();
      return;
    }

    if (event.key === 'Tab' && links.length) {
      const first = links[0];
      const last = links[links.length - 1];
      // Keep keyboard focus inside the declared modal dialog. If focus
      // somehow moved outside, return to its first interactive element.
      if (!dialog?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const onOutsidePointer = (event: PointerEvent) => {
    if (!menu?.open) return;
    // The darkened backdrop is a ::before pseudo-element owned by <details>.
    // It reports the details node itself as the click target in browsers.
    if (event.target === menu || !menu.contains(event.target as Node)) menu.open = false;
  };

  const closeMenu = () => {
    if (menu?.open) menu.open = false;
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
  menu?.addEventListener('toggle', onToggle);
  desktopQuery.addEventListener('change', onViewportChange);
  window.addEventListener('keydown', onKeydown);
  document.addEventListener('pointerdown', onOutsidePointer);
  links.forEach((link) => link.addEventListener('click', closeMenu));
  onViewportChange();

  return () => {
    window.removeEventListener('scroll', updateHeader);
    window.removeEventListener('keydown', onKeydown);
    desktopQuery.removeEventListener('change', onViewportChange);
    document.removeEventListener('pointerdown', onOutsidePointer);
    menu?.removeEventListener('toggle', onToggle);
    links.forEach((link) => link.removeEventListener('click', closeMenu));
    restoreBackground();
    document.documentElement.classList.remove('menu-open');
    header.classList.remove('is-menu-open');
  };
}
