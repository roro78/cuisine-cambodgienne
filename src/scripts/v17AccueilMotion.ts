import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** V17 : chorégraphie courte et éditoriale, liée au scroll natif.
 * Aucun pin, aucune interpolation du scroll de la page, aucun contenu masqué.
 * Sans JS ou avec reduced-motion : la CSS définit la composition complète.
 */
export function initV17AccueilMotion() {
  const root = document.querySelector<HTMLElement>('[data-v17r-preview]');
  if (!root) return () => {};
  const mm = gsap.matchMedia();

  mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
    const add = (selector: string, from: gsap.TweenVars, end: gsap.TweenVars) => {
      const node = root.querySelector<HTMLElement>(selector);
      if (!node) return;
      gsap.fromTo(node, from, {
        ...end, ease: 'none', overwrite: 'auto',
        scrollTrigger: {
          trigger: node.closest('section') ?? node,
          start: 'top 92%', end: 'center 50%', scrub: .75
        }
      });
    };

    // One focal idea per scene; deliberate separation between photo and copy.
    add('.v17r-market-visual img', { scale: 1.055, xPercent: -2 }, { scale: 1.005, xPercent: 0 });
    add('.v17r-palette-a', { xPercent: -18, yPercent: 8 }, { xPercent: 0, yPercent: 0 });
    add('.v17r-palette-b', { xPercent: 22, yPercent: -7 }, { xPercent: 0, yPercent: 0 });
    add('.v17r-lemongrass', { xPercent: -20 }, { xPercent: 0 });
    add('.v17r-palette-lime', { xPercent: 15, yPercent: 10 }, { xPercent: 0, yPercent: 0 });
    add('.v17r-gestures-kroeung', { xPercent: -7, scale: 1.05 }, { xPercent: 0, scale: 1 });
    add('.v17r-table-media img', { scale: 1.055 }, { scale: 1.01 });
    add('.v17r-dessert-main', { xPercent: -10 }, { xPercent: 0 });
    add('.v17r-dessert-second', { xPercent: 13 }, { xPercent: 0 });

    const hero = root.querySelector<HTMLElement>('.v17r-hero');
    const flower = root.querySelector<HTMLElement>('.v17r-hero-flower-dish');
    if (hero && flower) {
      gsap.to(flower, {
        y: -12, rotation: 20, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .75 }
      });
    }
  });

  return () => mm.revert();
}
