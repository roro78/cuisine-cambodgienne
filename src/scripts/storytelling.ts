import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initStorytelling() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return () => {};

  const context = gsap.context(() => {
    const panels = gsap.utils.toArray<HTMLElement>('.story-panel');
    const heroTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '.story-hero',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          const index = Math.min(panels.length - 1, Math.floor(self.progress * panels.length));
          panels.forEach((panel, i) => panel.classList.toggle('is-active', i === index));
          gsap.set('.story-progress span', { scaleX: self.progress });
        }
      }
    });

    heroTimeline
      .fromTo('.story-hero-image',
        { scale: 1.02, xPercent: 0, yPercent: 0 },
        { scale: 1.22, xPercent: -3, yPercent: 2, ease: 'none', duration: 1 }
      )
      .to('.story-shade', { opacity: .68, ease: 'none', duration: .45 }, 0)
      .to('.story-hero-image', { filter: 'saturate(.78) contrast(1.06)', duration: .35 }, .35)
      .to('.story-shade', { opacity: .42, duration: .3 }, .7);

    gsap.fromTo('.market-media img',
      { scale: 1.12, yPercent: -5 },
      {
        scale: 1,
        yPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: '.market-story', start: 'top bottom', end: 'bottom top', scrub: 1 }
      }
    );

    gsap.from('.market-copy > *', {
      y: 50,
      opacity: 0,
      stagger: .12,
      scrollTrigger: { trigger: '.market-copy', start: 'top 72%', toggleActions: 'play none none reverse' }
    });

    const ingredientItems = gsap.utils.toArray<HTMLElement>('.ingredient-steps li');
    ingredientItems.forEach((item, index) => {
      gsap.fromTo(item,
        { opacity: .2, x: 20 },
        {
          opacity: 1,
          x: 0,
          scrollTrigger: {
            trigger: '.ingredient-story',
            start: `${20 + index * 17}% top`,
            end: `${36 + index * 17}% top`,
            scrub: true
          }
        }
      );
    });

    gsap.to('.ingredient-photo img', {
      scale: 1.1,
      yPercent: 4,
      ease: 'none',
      scrollTrigger: { trigger: '.ingredient-story', start: 'top top', end: 'bottom bottom', scrub: 1 }
    });

    gsap.fromTo('.feature-recipe-media img',
      { scale: 1.14 },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.feature-recipe', start: 'top bottom', end: 'bottom top', scrub: 1 }
      }
    );

    gsap.from('.feature-recipe-copy > *', {
      y: 45,
      opacity: 0,
      stagger: .1,
      scrollTrigger: { trigger: '.feature-recipe-copy', start: 'top 72%', toggleActions: 'play none none reverse' }
    });

    gsap.fromTo('.kampot-story img',
      { scale: 1.08 },
      {
        scale: 1.2,
        ease: 'none',
        scrollTrigger: { trigger: '.kampot-story', start: 'top bottom', end: 'bottom top', scrub: 1 }
      }
    );

    gsap.from('.kampot-copy > *', {
      y: 55,
      opacity: 0,
      stagger: .12,
      scrollTrigger: { trigger: '.kampot-story', start: 'top 62%', toggleActions: 'play none none reverse' }
    });
  });

  return () => context.revert();
}
