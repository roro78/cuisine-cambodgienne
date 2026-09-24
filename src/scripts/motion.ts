import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initGlobalMotion() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const objects = gsap.utils.toArray<HTMLElement>('[data-motion-object]');
  const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  const parallax = gsap.utils.toArray<HTMLElement>('[data-parallax]');
  const recipeSteps = gsap.utils.toArray<HTMLElement>('[data-recipe-step]');

  if (!objects.length && !reveals.length && !parallax.length && !recipeSteps.length) return () => {};

  const context = gsap.context(() => {
    objects.forEach((el, index) => {
      const speed = Number(el.dataset.motionSpeed ?? .35);
      const drift = Number(el.dataset.motionDrift ?? 20);
      const rotate = Number(el.dataset.motionRotate ?? 5);
      const direction = el.classList.contains('motion-object--left') ? 1 : -1;

      gsap.set(el, {
        y: 0,
        x: 0,
        rotate: reduced ? 0 : -rotate * .45
      });

      if (reduced) return;

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

      const from = reduced
        ? { x: 0, y: 0 }
        : direction === 'left'
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
          duration: reduced ? .38 : 1.05,
          ease: reduced ? 'power1.out' : 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    parallax.forEach((el) => {
      if (reduced) return;
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

    recipeSteps.forEach((step) => {
      gsap.fromTo(step,
        { autoAlpha: reduced ? .68 : .36, x: reduced ? 0 : 16 },
        {
          autoAlpha: 1,
          x: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: step,
            start: 'top 72%',
            end: 'bottom 48%',
            scrub: true,
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    });

    ScrollTrigger.refresh();
  });

  return () => context.revert();
}
