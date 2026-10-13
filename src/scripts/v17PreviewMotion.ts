import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * V17.3 — narration progressive du marché au dessert.
 * Toutes les scènes et tous les liens restent visibles sans JavaScript.
 * Aucune scène épinglée, pas de scroll forcé, pas de lecture automatique.
 * Sur mobile et en prefers-reduced-motion, la mise en page est statique.
 */
export function initV17PreviewMotion() {
  const page = document.querySelector<HTMLElement>('.v17-preview');
  if (!page) return () => {};

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    for (const element of gsap.utils.toArray<HTMLElement>('[data-v17-reveal]', page)) {
      gsap.fromTo(element, { y: 14, opacity: .86 }, {
        y: 0, opacity: 1, duration: .7, ease: 'power2.out',
        scrollTrigger: { trigger: element, start: 'top 91%', once: true }
      });
    }
  });

  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 761px)', () => {
    const hero = page.querySelector<HTMLElement>('.v17-hero');
    const stage = page.querySelector<HTMLElement>('.v17-hero-stage');
    const heroImage = page.querySelector<HTMLImageElement>('.v17-hero-photo img');

    if (stage && heroImage) {
      gsap.fromTo(heroImage, { scale: 1.08 }, {
        scale: 1.15, ease: 'none',
        scrollTrigger: { trigger: stage, start: 'top top', end: 'bottom top', scrub: .6 }
      });
    }

    if (hero) {
      gsap.utils.toArray<HTMLElement>('[data-v17-float]', hero).forEach((element, index) => {
        gsap.to(element, {
          y: index % 2 === 0 ? 20 : -18,
          ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .65 }
        });
      });
    }

    // Each ingredient enters from a different direction, then settles
    // into the same culinary composition. Do not use a pinned scene.
    const ingredientStage = page.querySelector<HTMLElement>('[data-v17-ingredient-stage]');
    if (ingredientStage) {
      const directions: Record<string, {xPercent: number; yPercent: number; rotation: number}> = {
        left: { xPercent: -26, yPercent: 6, rotation: -4 },
        top: { xPercent: 0, yPercent: -25, rotation: 4 },
        right: { xPercent: 30, yPercent: 8, rotation: 6 }
      };
      for (const actor of gsap.utils.toArray<HTMLElement>('[data-v17-ingredient]', ingredientStage)) {
        const direction = actor.dataset.v17Ingredient;
        const initial = directions[direction ?? ''] ?? directions.top;
        gsap.fromTo(actor, { ...initial, opacity: .78 }, {
          xPercent: 0, yPercent: 0, rotation: 0, opacity: 1, ease: 'none',
          scrollTrigger: {
            trigger: ingredientStage, start: 'top 96%',
            end: 'center 51%', scrub: .8
          }
        });
      }
    }

    // The gesture sequence is an actual three-step progression, not
    // a deceptive photo sequence of unrelated kitchen techniques.
    const gesture = page.querySelector<HTMLElement>('.v17-gesture-study');
    if (gesture) {
      const steps = gsap.utils.toArray<HTMLElement>('li', gesture);
      steps.forEach((step, index) => {
        gsap.fromTo(step, { x: index % 2 === 0 ? -32 : 32, opacity: .82 }, {
          x: 0, opacity: 1, ease: 'none',
          scrollTrigger: {
            trigger: gesture, start: 'top 85%',
            end: 'bottom 38%', scrub: .6
          }
        });
      });
    }

    // Desserts create a gentle opposite-direction reveal after the hot dish.
    const sweets = page.querySelector<HTMLElement>('.v17-sweets');
    if (sweets) {
      for (const figure of gsap.utils.toArray<HTMLElement>('[data-v17-sweet]', sweets)) {
        const isLeft = figure.dataset.v17Sweet === 'left';
        gsap.fromTo(figure, {
          xPercent: isLeft ? -18 : 18, yPercent: isLeft ? 6 : -6,
          rotation: isLeft ? -2 : 2, opacity: .82
        }, {
          xPercent: 0, yPercent: 0, rotation: 0, opacity: 1, ease: 'none',
          scrollTrigger: {
            trigger: sweets, start: 'top 82%',
            end: 'center 60%', scrub: .75
          }
        });
      }
    }

    // Image parallax remains subtle and separate from any content text.
    for (const image of gsap.utils.toArray<HTMLImageElement>('[data-v17-parallax]', page)) {
      const frame = image.closest<HTMLElement>('figure');
      if (!frame) continue;
      gsap.fromTo(image, { yPercent: -3, scale: 1.08 }, {
        yPercent: 3, scale: 1.08, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: .65 }
      });
    }
  });

  return () => mm.revert();
}
