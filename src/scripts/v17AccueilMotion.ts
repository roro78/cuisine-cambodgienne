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

  mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
    // 1. Hero: quiet depth, never displacing the headline or CTA.
    sceneMotion('.v17r-hero-dish img', { scale: 1.04, yPercent: 1 }, { scale: 1.005, yPercent: -1 });
    sceneMotion('.v17r-hero-flower-dish', { yPercent: 12 }, { yPercent: -8 });
    // 2. Market: photographic parallax, no artificial scroll velocity.
    sceneMotion('.v17r-market-visual > img', { scale: 1.075, yPercent: -2 }, { scale: 1.015, yPercent: 2 });
    // A second documented fruit photograph brings depth without fabricating one scene.
    sceneMotion('.v17r-market-postcard img', { scale: 1.11 }, { scale: 1.025 });
    sceneMotion('.v17r-market-bloom', { yPercent: 14, rotation: -23 }, { yPercent: -12, rotation: -8 });
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
    sceneMotion('.v17r-gestures-main img', { scale: 1.07 }, { scale: 1.015 });
    sceneMotion('.v17r-gestures-kroeung', { yPercent: 12, xPercent: 7 }, { yPercent: 0, xPercent: 0 });
    sceneMotion('.v17r-gestures-steps', { yPercent: 3 }, { yPercent: -1 });
    // 5. Table: a single AI-generated culinary tableau creates immersive depth.
    sceneMotion('.v17r-table-amok img', { scale: 1.07, xPercent: -2 }, { scale: 1.01, xPercent: 0 });
    // 6–7. Desserts and Angkor: restraint and varied composition.
    sceneMotion('.v17r-dessert-generated img', { scale: 1.035 }, { scale: 1.005 });
    sceneMotion('.v17r-finale-landscape img', { scale: 1.065, yPercent: -2 }, { scale: 1, yPercent: 1 });
  });

  mm.add('(max-width: 760px) and (prefers-reduced-motion: no-preference)', () => {
    // Mobile: movements < 14px in practice, never hide content or block gestures.
    sceneMotion('.v17r-hero-dish img', { scale: 1.025 }, { scale: 1.005 });
    sceneMotion('.v17r-market-visual > img', { scale: 1.045, yPercent: -1 }, { scale: 1.01, yPercent: 1 });
    sceneMotion('.v17r-market-postcard img', { scale: 1.04 }, { scale: 1.015 });
    sceneMotion('.v17r-palette-a', { xPercent: -5 }, { xPercent: 0 });
    sceneMotion('.v17r-palette-b', { xPercent: 5 }, { xPercent: 0 });
    sceneMotion('.v17r-gestures-main img', { scale: 1.035 }, { scale: 1.005 });
    sceneMotion('.v17r-table-amok img', { scale: 1.035 }, { scale: 1.005 });
    sceneMotion('.v17r-finale-landscape img', { scale: 1.04 }, { scale: 1.005 });
  });

  return () => mm.revert();
}
