import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initGlobalMotion() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return () => {};

  const objects = gsap.utils.toArray<HTMLElement>('[data-motion-object]');
  if (!objects.length) return () => {};

  const context = gsap.context(() => {
    objects.forEach((el, index) => {
      const speed = Number(el.dataset.motionSpeed ?? .35);
      const drift = Number(el.dataset.motionDrift ?? 20);
      const rotate = Number(el.dataset.motionRotate ?? 5);
      const direction = el.classList.contains('motion-object--left') ? 1 : -1;

      gsap.set(el, {
        y: 0,
        x: 0,
        rotate: -rotate * .45
      });

      gsap.to(el, {
        y: () => window.innerHeight * (1.15 + speed * 1.8),
        x: direction * drift,
        rotate,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: .7 + index * .15,
          invalidateOnRefresh: true
        }
      });
    });
  });

  return () => context.revert();
}
