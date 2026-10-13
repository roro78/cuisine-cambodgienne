import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * V17 experimental narration: no pinned scenes, scroll hijacking or mandatory motion.
 * Text and images stay in the DOM and readable even before JS hydration.
 * The market-to-gesture and gesture-to-table bridges scrub a decorative trace only.
 */
export function initV17PreviewMotion() {
  const page = document.querySelector<HTMLElement>('.v17-preview');
  if (!page) return () => {};

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const reveals = gsap.utils.toArray<HTMLElement>('[data-v17-reveal]', page);
    reveals.forEach((element) => {
      gsap.fromTo(element,
        { y: 16, opacity: .82 },
        {
          y: 0, opacity: 1, duration: .8, ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 92%', once: true }
        }
      );
    });

    const study = page.querySelector<HTMLElement>('.v17-gesture-study');
    if (study) {
      gsap.fromTo(study.querySelectorAll('li'),
        { x: -8, opacity: .85 },
        { x: 0, opacity: 1, duration: .7, stagger: .16, ease: 'power2.out',
          scrollTrigger: { trigger: study, start: 'top 80%', once: true } }
      );
    }
  });

  // Limit scrubbed photographic motion to desktops/tablets with comfortable width.
  // Mobile and reduced-motion users see the complete image and static 100% trace.
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 761px)', () => {
    const heroImage = page.querySelector<HTMLImageElement>('.v17-hero-photo img');
    const hero = page.querySelector<HTMLElement>('.v17-hero');
    if (heroImage && hero) {
      gsap.to(heroImage, {
        scale: 1.07, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .6 }
      });
    }

    for (const image of gsap.utils.toArray<HTMLImageElement>('[data-v17-parallax]', page)) {
      const frame = image.closest<HTMLElement>('figure');
      if (!frame) continue;
      gsap.fromTo(image,
        { yPercent: -3, scale: 1.09 },
        {
          yPercent: 3, scale: 1.09, ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: .65 }
        }
      );
    }

    for (const bridge of gsap.utils.toArray<HTMLElement>('[data-v17-bridge]', page)) {
      gsap.fromTo(bridge,
        { '--v17-bridge-progress': 0 },
        {
          '--v17-bridge-progress': 1, ease: 'none',
          scrollTrigger: { trigger: bridge, start: 'top 90%', end: 'bottom 15%', scrub: .6 }
        }
      );
    }
  });

  return () => mm.revert();
}
