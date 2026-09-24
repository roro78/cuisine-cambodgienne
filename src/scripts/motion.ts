import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initGlobalMotion() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const objects = gsap.utils.toArray<HTMLElement>('[data-motion-object]');
  const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  const parallax = gsap.utils.toArray<HTMLElement>('[data-parallax]');
  const recipeSteps = gsap.utils.toArray<HTMLElement>('[data-recipe-step]');
  const desireEntries = gsap.utils.toArray<HTMLElement>('[data-desire-entry]');
  const cultureRules = gsap.utils.toArray<HTMLElement>('.culture-rule');
  const companions = gsap.utils.toArray<HTMLElement>('[data-scroll-companion]');
  const learningPaths = gsap.utils.toArray<HTMLElement>('[data-learning-path]');
  const homeTrailObjects = gsap.utils.toArray<HTMLElement>('[data-home-culinary-object]');

  if (
    !objects.length &&
    !reveals.length &&
    !parallax.length &&
    !recipeSteps.length &&
    !desireEntries.length &&
    !cultureRules.length &&
    !companions.length &&
    !learningPaths.length &&
    !homeTrailObjects.length
  ) return () => {};

  const context = gsap.context(() => {
    objects.forEach((el, index) => {
      const speed = Number(el.dataset.motionSpeed ?? .35);
      const drift = Number(el.dataset.motionDrift ?? 20);
      const rotate = Number(el.dataset.motionRotate ?? 5);
      const direction = el.classList.contains('motion-object--left') ? 1 : -1;

      gsap.set(el, { y: 0, x: 0, rotate: reduced ? 0 : -rotate * .45 });
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

      gsap.fromTo(el, { ...from, autoAlpha: 0 }, {
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
      });
    });

    parallax.forEach((el) => {
      if (reduced) return;
      const speed = Number(el.dataset.parallax ?? .1);
      const target = el.tagName === 'IMG' ? el : el.querySelector<HTMLElement>('img');
      if (!target) return;

      gsap.fromTo(target, { yPercent: speed * -45, scale: 1.06 }, {
        yPercent: speed * 45,
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    recipeSteps.forEach((step) => {
      gsap.fromTo(step, { autoAlpha: reduced ? .68 : .36, x: reduced ? 0 : 16 }, {
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
      });
    });

    desireEntries.forEach((entry, index) => {
      const copy = entry.querySelector<HTMLElement>('.desire-copy');
      const media = entry.querySelector<HTMLElement>('.desire-media');

      if (reduced) {
        if (copy) gsap.set(copy, { autoAlpha: 1, y: 0 });
        if (media) gsap.set(media, { clipPath: 'none', yPercent: 0 });
        return;
      }

      if (copy) {
        gsap.fromTo(copy, { autoAlpha: .28, y: 54 }, {
          autoAlpha: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: entry,
            start: 'top 82%',
            end: 'center 54%',
            scrub: .8
          }
        });
      }
      if (media) {
        gsap.fromTo(media, {
          clipPath: index % 2 === 0 ? 'inset(8% 0 8% 16% round 28px)' : 'inset(8% 16% 8% 0 round 28px)',
          yPercent: 7
        }, {
          clipPath: 'inset(0% 0% 0% 0% round 28px)',
          yPercent: -3,
          ease: 'none',
          scrollTrigger: {
            trigger: entry,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
          }
        });
      }
    });

    cultureRules.forEach((rule) => {
      if (reduced) {
        gsap.set(rule, { scaleX: 1, transformOrigin: 'left center' });
        return;
      }
      gsap.fromTo(rule, { scaleX: 0 }, {
        scaleX: 1,
        transformOrigin: 'left center',
        ease: 'none',
        scrollTrigger: {
          trigger: rule.closest('.culture-feature') ?? rule,
          start: 'top 78%',
          end: 'top 46%',
          scrub: .8
        }
      });
    });

    companions.forEach((el) => {
      const targetSelector = el.dataset.companionTarget ?? '.about-story';
      const target = document.querySelector<HTMLElement>(targetSelector);
      if (!target) return;

      if (reduced) {
        gsap.set(el, { y: 0, x: 0, rotate: 0, autoAlpha: .16 });
        return;
      }

      gsap.timeline({
        scrollTrigger: {
          trigger: target,
          start: 'top 72%',
          end: 'bottom 28%',
          scrub: 1.1,
          invalidateOnRefresh: true
        }
      })
        .fromTo(el, { y: 0, x: 0, rotate: -6, autoAlpha: .16 }, { y: '42vh', x: '-5vw', rotate: 3, autoAlpha: .26, ease: 'none' })
        .to(el, { y: '92vh', x: '4vw', rotate: -4, autoAlpha: .22, ease: 'none' })
        .to(el, { y: '145vh', x: '-2vw', rotate: 5, autoAlpha: 0, ease: 'none' });
    });

    homeTrailObjects.forEach((el, index) => {
      const trail = el.closest<HTMLElement>('[data-home-culinary-trail]');
      if (!trail) return;

      if (reduced) {
        gsap.set(el, { x: 0, y: 0, rotate: 0, autoAlpha: .28 });
        return;
      }

      const direction = index % 2 === 0 ? 1 : -1;
      gsap.fromTo(el, {
        x: direction * 24,
        y: -36,
        rotate: direction * -7,
        autoAlpha: .1
      }, {
        x: direction * -36,
        y: () => window.innerHeight * (.72 + index * .08),
        rotate: direction * 8,
        autoAlpha: .34,
        ease: 'none',
        scrollTrigger: {
          trigger: trail,
          start: 'top 82%',
          end: 'bottom 18%',
          scrub: .65 + index * .08,
          invalidateOnRefresh: true
        }
      });
    });

    learningPaths.forEach((path) => {
      const fill = path.querySelector<HTMLElement>('.learn-progress i');
      const steps = gsap.utils.toArray<HTMLElement>('[data-learning-step]', path);

      if (reduced) {
        if (fill) gsap.set(fill, { scaleY: 1, transformOrigin: 'top center' });
        steps.forEach((step) => gsap.set(step, { autoAlpha: 1, x: 0 }));
        return;
      }

      if (fill) {
        gsap.fromTo(fill, { scaleY: 0 }, {
          scaleY: 1,
          transformOrigin: 'top center',
          ease: 'none',
          scrollTrigger: {
            trigger: path,
            start: 'top 72%',
            end: 'bottom 52%',
            scrub: true
          }
        });
      }

      steps.forEach((step) => {
        gsap.fromTo(step, { autoAlpha: .38, x: 18 }, {
          autoAlpha: 1,
          x: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: step,
            start: 'top 72%',
            end: 'center 52%',
            scrub: .6
          }
        });
      });
    });

    ScrollTrigger.refresh();
  });

  return () => context.revert();
}
