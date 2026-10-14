import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * V17 — chorégraphie éditoriale liée au scroll natif.
 * Aucun pin, aucun scroll hijacking et aucun élément essentiel masqué.
 * Le rendu complet est défini par Astro + CSS, avec ou sans JavaScript.
 */
export function initV17AccueilMotion() {
  const root = document.querySelector<HTMLElement>('[data-v17r-preview]');
  if (!root) return () => {};
  const mm = gsap.matchMedia();

  const sceneMotion = (
    selector: string,
    from: gsap.TweenVars,
    to: gsap.TweenVars,
  ) => {
    const node = root.querySelector<HTMLElement>(selector);
    if (!node) return;
    gsap.fromTo(node, from, {
      ...to,
      ease: 'none',
      overwrite: 'auto',
      scrollTrigger: {
        trigger: node.closest('section') ?? node,
        start: 'top 92%',
        end: 'bottom 25%',
        scrub: .75,
        invalidateOnRefresh: true,
      },
    });
  };

  /**
   * Each chapter resolves in three beats: heading, supporting line, invitation.
   * Only transforms and gentle opacity; essential content always stays visible.
   * No pin, no takeover of the browser's native scroll.
   */
  const copyEntrance = (
    sceneSelector: string,
    selectors: string[],
    horizontal = 0,
    distance = 25,
  ) => {
    const scene = root.querySelector<HTMLElement>(sceneSelector);
    if (!scene) return;
    const nodes = selectors
      .map((selector) => scene.querySelector<HTMLElement>(selector))
      .filter((node): node is HTMLElement => node !== null);
    if (!nodes.length) return;
    const timeline = gsap.timeline({
      scrollTrigger: {
        // On stacked mobile scenes, the heading enters long after the photo.
        // Trigger from the heading itself so motion is actually perceived.
        trigger: distance <= 11 ? nodes[0] : scene,
        start: 'top 90%',
        end: 'top 30%',
        scrub: .75,
        invalidateOnRefresh: true,
      },
    });
    nodes.forEach((node, index) => {
      timeline.fromTo(node,
        { x: horizontal, y: horizontal ? 9 : distance, opacity: .86 },
        { x: 0, y: 0, opacity: 1, duration: .8, ease: 'power2.out', immediateRender: false },
        index * .13,
      );
    });
  };

  mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
    // 1. Hero: quiet depth, never displacing the headline or CTA.
    sceneMotion('.v17r-hero-dish img', { scale: 1.09, yPercent: 2 }, { scale: 1.005, yPercent: -2 });
    // 2. Market: photographic parallax, no artificial scroll velocity.
    sceneMotion('.v17r-market-visual > img', { scale: 1.12, yPercent: -3 }, { scale: 1.025, yPercent: 3 });
    // 3. Ingredients: converging from different axes, title stays static.
    sceneMotion('.v17r-palette-a', { xPercent: -17, yPercent: 9 }, { xPercent: 0, yPercent: 0 });
    sceneMotion('.v17r-palette-b', { xPercent: 16, yPercent: -7 }, { xPercent: 0, yPercent: 0 });
    sceneMotion('.v17r-lemongrass', { xPercent: -16 }, { xPercent: 0 });
    sceneMotion('.v17r-palette-lime', { xPercent: 13, yPercent: 10 }, { xPercent: 0, yPercent: 0 });
    sceneMotion('.v17r-spice-bowls', { xPercent: 13, yPercent: 8 }, { xPercent: 0, yPercent: 0 });
    // Decorative botanical framing floats behind the static ingredient heading.
    sceneMotion('.v17r-palette-foliage-left', { xPercent: -16, yPercent: 10, rotation: -25 }, { xPercent: 0, yPercent: -3, rotation: -17 });
    sceneMotion('.v17r-palette-foliage-right', { xPercent: 13, yPercent: -10, rotation: 168 }, { xPercent: 0, yPercent: 4, rotation: 157 });
    // 4. Mortar: the hands remain real; the prepared kroeung is a second image.
    sceneMotion('.v17r-gestures-main img', { scale: 1.09, yPercent: -2 }, { scale: 1.01, yPercent: 2 });
    sceneMotion('.v17r-gestures-kroeung', { yPercent: 12, xPercent: 7 }, { yPercent: 0, xPercent: 0 });
    // 5. Table: a single AI-generated culinary tableau creates immersive depth.
    sceneMotion('.v17r-table-amok img', { scale: 1.10, xPercent: -2 }, { scale: 1.01, xPercent: 1 });
    // 6–7. Desserts and Angkor: restraint and varied composition.
    sceneMotion('.v17r-dessert-generated img', { scale: 1.075, yPercent: -1 }, { scale: 1.005, yPercent: 2 });
    sceneMotion('.v17r-finale-landscape img', { scale: 1.09, yPercent: -3 }, { scale: 1.01, yPercent: 2 });
    // Every scene has its own visual entrance; the static palette is preserved.
    copyEntrance('.v17r-market', ['.v17r-market h2', '.v17r-market-copy > p:not(.v17r-kicker)', '.v17r-market .v17r-pill'], 22);
    copyEntrance('.v17r-palette', ['.v17r-palette h2', '.v17r-palette-intro', '.v17r-palette > .v17r-pill']);
    copyEntrance('.v17r-gestures', ['.v17r-gestures h2', '.v17r-gestures-copy > p:not(.v17r-kicker)', '.v17r-gestures .v17r-pill'], 19);
    copyEntrance('.v17r-table', ['.v17r-table h2', '.v17r-table-copy > p:not(.v17r-kicker)', '.v17r-table .v17r-pill']);
    copyEntrance('.v17r-dessert', ['.v17r-dessert h2', '.v17r-dessert-copy > p:not(.v17r-kicker)', '.v17r-dessert .v17r-pill'], -19);
    copyEntrance('.v17r-finale', ['.v17r-finale h2', '.v17r-finale-copy > p:not(.v17r-kicker)', '.v17r-finale-actions'], 0, 32);
    // Organic seams move gently as chapter boundaries, without pinning.
    sceneMotion('.v17r-wave-green svg', { scaleX: 1.05, xPercent: -1 }, { scaleX: 1.05, xPercent: 1 });
    sceneMotion('.v17r-wave-cream svg', { scaleX: 1.05, xPercent: 1 }, { scaleX: 1.05, xPercent: -1 });
  });

  mm.add('(max-width: 760px) and (prefers-reduced-motion: no-preference)', () => {
    // Keep the first-screen Amok image static on mobile: it is the LCP candidate.
    // Other scenes retain their subtle native-scroll depth, while the hero stays
    // visually composed by CSS without a late compositor animation.
    // Mobile: movements < 14px in practice, never hide content or block gestures.
    sceneMotion('.v17r-market-visual > img', { scale: 1.045, yPercent: -1 }, { scale: 1.01, yPercent: 1 });
    sceneMotion('.v17r-palette-a', { xPercent: -5 }, { xPercent: 0 });
    sceneMotion('.v17r-palette-b', { xPercent: 5 }, { xPercent: 0 });
    sceneMotion('.v17r-gestures-main img', { scale: 1.035 }, { scale: 1.005 });
    sceneMotion('.v17r-table-amok img', { scale: 1.035 }, { scale: 1.005 });
    sceneMotion('.v17r-finale-landscape img', { scale: 1.04 }, { scale: 1.005 });
    // Native touch scrolling with lower motion amplitude than on desktop.
    copyEntrance('.v17r-market', ['.v17r-market h2', '.v17r-market .v17r-pill'], 0, 11);
    copyEntrance('.v17r-gestures', ['.v17r-gestures h2', '.v17r-gestures .v17r-pill'], 0, 11);
    copyEntrance('.v17r-dessert', ['.v17r-dessert h2', '.v17r-dessert .v17r-pill'], 0, 11);
    copyEntrance('.v17r-finale', ['.v17r-finale h2', '.v17r-finale-actions'], 0, 11);
  });

  return () => mm.revert();
}
