import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** 
 * V17 Fresh & Bold: enhancement only.
 * No pinned scenes, scroll hijacking, timed auto-play, or hidden critical content.
 * Mobile and prefers-reduced-motion use static compositions.
 */
export function initV17PreviewMotion() {
  const page = document.querySelector<HTMLElement>('.v17-preview');
  if (!page) return () => {};
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    for (const element of gsap.utils.toArray<HTMLElement>('[data-v17-reveal]', page)) {
      gsap.fromTo(element, { y: 20, opacity: .85 }, {
        y: 0, opacity: 1, duration: .65, ease: 'power2.out',
        scrollTrigger: { trigger: element, start: 'top 90%', once: true }
      });
    }
  });

  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 761px)', () => {
    const stage = page.querySelector<HTMLElement>('.v17-hero-stage');
    const heroImage = page.querySelector<HTMLImageElement>('.v17-hero-photo img');
    if (stage && heroImage) {
      gsap.fromTo(heroImage, { scale: 1.08 }, {
        scale: 1.16, ease: 'none',
        scrollTrigger: { trigger: stage, start: 'top top', end: 'bottom top', scrub: .6 }
      });
    }

    gsap.utils.toArray<HTMLElement>('[data-v17-float]', page).forEach((element, index) => {
      gsap.to(element, {
        y: index % 2 ? -22 : 17,
        ease: 'none',
        scrollTrigger: { trigger: page.querySelector('.v17-hero'), start: 'top top', end: 'bottom top', scrub: .75 }
      });
    });

    for (const image of gsap.utils.toArray<HTMLImageElement>('[data-v17-parallax]', page)) {
      const frame = image.closest<HTMLElement>('figure');
      if (!frame) continue;
      gsap.fromTo(image, { yPercent: -3, scale: 1.08 }, {
        yPercent: 3, scale: 1.08, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: .7 }
      });
    }
  });

  return () => mm.revert();
}
