import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initGlobalMotion() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return () => {};

  const objects = gsap.utils.toArray<HTMLElement>('[data-motion-object]');
  const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  const parallax = gsap.utils.toArray<HTMLElement>('[data-parallax]');

  if (!objects.length && !reveals.length && !parallax.length) return () => {};

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

    reveals.forEach((el) => {
      const direction = el.dataset.reveal ?? 'up';
      const distance = Number(el.dataset.revealDistance ?? 42);
      const delay = Number(el.dataset.revealDelay ?? 0);

      const from = direction === 'left'
        ? { x: -distance, y: 0 }
        : direction === 'right'
          ? { x: distance, y: 0 }
          : { x: 0, y: distance };

      gsap.fromTo(el,
        { ...from, autoAlpha: 0 },
        {
          x: 0,
          y: 0,
          autoAlpha: 1,
          delay,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    parallax.forEach((el) => {
      const speed = Number(el.dataset.parallax ?? .1);
      const target = el.tagName === 'IMG' ? el : el.querySelector<HTMLElement>('img');
      if (!target) return;

      gsap.fromTo(target,
        { yPercent: speed * -45, scale: 1.06 },
        {
          yPercent: speed * 45,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    });
  });

  return () => context.revert();
}
