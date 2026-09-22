import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initStorytelling() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return () => {};

  const context = gsap.context(() => {
    const stage = document.querySelector<HTMLElement>('.cinematic-stage');
    const story = document.querySelector<HTMLElement>('.cinematic-story');
    const scenes = gsap.utils.toArray<HTMLElement>('.cinematic-scene');
    const copies = gsap.utils.toArray<HTMLElement>('.cinematic-copy');
    const counter = document.querySelector<HTMLElement>('.counter-current');

    if (!stage || !story || scenes.length < 5 || copies.length < 5) return;

    gsap.set(scenes[0], { clipPath: 'inset(0% 0% 0% 0%)', scale: 1.03, opacity: 1 });
    gsap.set(scenes[1], { clipPath: 'inset(0% 100% 0% 0%)', scale: 1.1, opacity: 1 });
    gsap.set(scenes[2], { clipPath: 'circle(0% at 68% 52%)', scale: 1.14, opacity: 1 });
    gsap.set(scenes[3], { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.1, opacity: 1 });
    gsap.set(scenes[4], { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.12, opacity: 1 });

    copies.forEach((copy, index) => {
      gsap.set(copy, index === 0 ? { autoAlpha: 1, y: 0 } : { autoAlpha: 0, y: 34 });
    });

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: story,
        start: 'top top',
        end: '+=520%',
        pin: stage,
        scrub: 1,
        anticipatePin: 1,
        onUpdate: (self) => {
          const current = Math.min(5, Math.floor(self.progress * 5) + 1);
          if (counter) counter.textContent = String(current).padStart(2, '0');
        }
      }
    });

    timeline
      .to('.cinematic-progress__fill', { scaleY: 1, duration: 5 }, 0)
      .to(scenes[0].querySelector('img'), { scale: 1.08, xPercent: -2, duration: 1 }, 0)
      .to(copies[0], { autoAlpha: 0, y: -28, duration: .28 }, .58)
      .to(scenes[1], { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: .7 }, .72)
      .fromTo(copies[1], { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: .28 }, 1.05)
      .to(scenes[1].querySelector('img'), { scale: 1.07, xPercent: 2, duration: 1 }, .95)
      .to(copies[1], { autoAlpha: 0, y: -26, duration: .25 }, 1.62)
      .to(scenes[2], { clipPath: 'circle(150% at 68% 52%)', scale: 1, duration: .72 }, 1.78)
      .fromTo(copies[2], { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: .28 }, 2.12)
      .to(scenes[2].querySelector('img'), { scale: 1.08, yPercent: 2, duration: 1 }, 2.0)
      .to(copies[2], { autoAlpha: 0, y: -26, duration: .25 }, 2.64)
      .to(scenes[3], { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: .72 }, 2.8)
      .fromTo(copies[3], { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: .28 }, 3.12)
      .to(scenes[3].querySelector('img'), { scale: 1.08, xPercent: -2, duration: 1 }, 3.0)
      .to(copies[3], { autoAlpha: 0, y: -26, duration: .25 }, 3.66)
      .to(scenes[4], { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: .72 }, 3.82)
      .fromTo(copies[4], { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: .32 }, 4.18)
      .to(scenes[4].querySelector('img'), { scale: 1.06, yPercent: -1.5, duration: .82 }, 4.18);

    gsap.fromTo('.statement-section h2', { y: 80, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1,
      scrollTrigger: { trigger: '.statement-section', start: 'top 70%', toggleActions: 'play none none reverse' }
    });

    gsap.utils.toArray<HTMLElement>('.doorway').forEach((card, index) => {
      gsap.from(card, {
        y: 70 + index * 16, opacity: 0, duration: .9,
        scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' }
      });
    });

    gsap.fromTo('.signature-visual img', { scale: 1.14 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.signature-section', start: 'top bottom', end: 'bottom top', scrub: 1 }
    });
  });

  return () => context.revert();
}
