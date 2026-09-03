import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initStorytelling() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return () => {};

  const context = gsap.context(() => {
    gsap.to('.hero-media', {
      scale: 1.1,
      yPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });

    gsap.to('.hero-copy', {
      yPercent: -22,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: '18% top', end: '80% top', scrub: 1 }
    });

    gsap.fromTo('.editorial-image',
      { yPercent: 18 },
      { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.editorial', start: 'top bottom', end: 'bottom top', scrub: 1 } }
    );

    const labels = gsap.utils.toArray<HTMLElement>('.ingredient-label');
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.ingredients',
        start: 'top top',
        end: '+=260%',
        pin: true,
        scrub: 1,
        anticipatePin: 1
      }
    });

    labels.forEach((label, index) => {
      tl.to(label, { opacity: 1, duration: .35 }, index * .45)
        .to(label, { opacity: .18, duration: .3 }, index * .45 + .4);
    });

    tl.to('.ingredients-visual', { scale: 1.18, rotation: 3, duration: 1.2 }, 0);

    gsap.from('.kampot h2', {
      yPercent: 55,
      opacity: 0,
      scrollTrigger: { trigger: '.kampot', start: 'top 75%', end: 'top 30%', scrub: 1 }
    });
  });

  return () => context.revert();
}
