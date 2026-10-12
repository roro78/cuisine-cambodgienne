import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Animation opt-in du prototype V17.
 * Le contenu reste integralement visible avant l'initialisation JS et avec
 * prefers-reduced-motion. Aucune interception du scroll ni scroll-smoothing.
 */
export function initV17PreviewMotion() {
  const page = document.querySelector<HTMLElement>('.v17-preview');
  if (!page) return () => {};

  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const reveals = gsap.utils.toArray<HTMLElement>('[data-v17-reveal]', page);
    reveals.forEach((element) => {
      gsap.fromTo(element,
        { y: 16, opacity: .82 },
        {
          y: 0, opacity: 1, duration: .8, ease: 'power2.out',
          scrollTrigger: {
            trigger: element, start: 'top 92%',
            once: true
          }
        }
      );
    });

    const gestureStudy = page.querySelector<HTMLElement>('.v17-gesture-study');
    if (gestureStudy) {
      gsap.fromTo(gestureStudy.querySelectorAll('li'),
        { x: -8, opacity: .85 },
        { x: 0, opacity: 1, duration: .7, stagger: .16, ease: 'power2.out',
          scrollTrigger: { trigger: gestureStudy, start: 'top 80%', once: true } }
      );
    }

    if (window.matchMedia('(min-width: 761px)').matches) {
      const heroImage = page.querySelector<HTMLImageElement>('.v17-hero-photo img');
      if (heroImage) {
        gsap.to(heroImage, {
          scale: 1.07, ease: 'none',
          scrollTrigger: {
            trigger: page.querySelector('.v17-hero'),
            start: 'top top', end: 'bottom top', scrub: .6
          }
        });
      }
    }
  });

  return () => media.revert();
}
