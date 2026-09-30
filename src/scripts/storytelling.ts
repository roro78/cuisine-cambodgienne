import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function rangeProgress(progress: number, start: number, end: number) {
  return smoothstep((progress - start) / Math.max(.001, end - start));
}

export function initStorytelling() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const context = gsap.context(() => {
    const hero = document.querySelector<HTMLElement>('[data-v16-hero]');
    const market = document.querySelector<HTMLElement>('[data-v16-market]');
    const gesture = document.querySelector<HTMLElement>('[data-v16-gesture]');
    const table = document.querySelector<HTMLElement>('[data-v16-table]');
    const glossary = document.querySelector<HTMLElement>('[data-v16-glossary]');

    if (reducedMotion) {
      document.documentElement.classList.add('v16-reduced-motion');
      gsap.set('[data-v16-hero-line], [data-v16-market-track], [data-v16-gesture-chip], [data-v16-dish], [data-v16-glossary-word]', {
        clearProps: 'transform,opacity,visibility,filter'
      });
      ScrollTrigger.refresh();
      return;
    }

    if (hero) setupHero(hero);
    if (market) setupMarket(market);
    if (gesture) setupGesture(gesture);
    if (table) setupTable(table);
    if (glossary) setupGlossary(glossary);

    ScrollTrigger.refresh();
  });

  const onLoad = () => ScrollTrigger.refresh();
  const onResize = () => ScrollTrigger.refresh();
  window.addEventListener('load', onLoad, { once: true });
  window.addEventListener('resize', onResize);

  return () => {
    window.removeEventListener('load', onLoad);
    window.removeEventListener('resize', onResize);
    document.documentElement.classList.remove('v16-reduced-motion');
    context.revert();
  };
}

function setupHero(section: HTMLElement) {
  const image = section.querySelector<HTMLElement>('.v16-hero-image img');
  const copy = section.querySelector<HTMLElement>('.v16-hero-copy');
  const lines = gsap.utils.toArray<HTMLElement>('[data-v16-hero-line]', section);
  const chips = gsap.utils.toArray<HTMLElement>('.v16-orbit-chip', section);
  const cue = section.querySelector<HTMLElement>('.v16-scroll-cue i');

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;

      if (image) {
        gsap.set(image, {
          scale: 1.08 + p * .08,
          yPercent: p * 3.5,
          filter: `saturate(${.78 + p * .1}) brightness(${.58 - p * .08})`
        });
      }

      if (copy) {
        gsap.set(copy, {
          yPercent: -p * 9,
          autoAlpha: 1 - rangeProgress(p, .68, .96)
        });
      }

      lines.forEach((line, index) => {
        const leave = rangeProgress(p, .16 + index * .1, .62 + index * .08);
        gsap.set(line, {
          xPercent: (index % 2 === 0 ? -1 : 1) * leave * (8 + index * 2),
          yPercent: -leave * (7 + index * 3),
          scale: 1 - leave * .055,
          autoAlpha: 1 - leave * .72
        });
      });

      chips.forEach((chip, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        gsap.set(chip, {
          xPercent: direction * p * (18 + index * 5),
          yPercent: (index < 2 ? -1 : 1) * p * (18 + index * 3),
          rotate: direction * p * (3 + index),
          autoAlpha: 1 - rangeProgress(p, .62 + index * .025, .94)
        });
      });

      if (cue) gsap.set(cue, { scaleX: 1 - p });
    }
  });
}

function setupMarket(section: HTMLElement) {
  const track = section.querySelector<HTMLElement>('[data-v16-market-track]');
  const panels = gsap.utils.toArray<HTMLElement>('[data-v16-market-panel]', section);
  const count = section.querySelector<HTMLElement>('[data-v16-market-count]');
  if (!track || !panels.length) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(track, { xPercent: -(100 - 100 / panels.length) * p });

      const active = Math.min(panels.length - 1, Math.round(p * (panels.length - 1)));
      if (count) count.textContent = String(active + 1).padStart(2, '0');

      panels.forEach((panel, index) => {
        const panelProgress = p * (panels.length - 1);
        const distance = index - panelProgress;
        const image = panel.querySelector<HTMLElement>('img');
        const copy = panel.querySelector<HTMLElement>('.v16-market-panel-copy');

        if (image) {
          gsap.set(image, {
            scale: 1.08 + Math.abs(distance) * .025,
            xPercent: distance * -2.2,
            filter: `saturate(${.82 - Math.min(1, Math.abs(distance)) * .15}) brightness(${.66 - Math.min(1, Math.abs(distance)) * .08})`
          });
        }
        if (copy) {
          gsap.set(copy, {
            y: Math.abs(distance) * 24,
            autoAlpha: clamp(1.08 - Math.abs(distance) * .62)
          });
        }

        const interactive = Math.abs(distance) < .58;
        panel.inert = !interactive;
        panel.tabIndex = interactive ? 0 : -1;
      });
    }
  });
}

function setupGesture(section: HTMLElement) {
  const image = section.querySelector<HTMLElement>('.v16-gesture-image img');
  const copy = section.querySelector<HTMLElement>('.v16-gesture-copy');
  const chips = gsap.utils.toArray<HTMLElement>('[data-v16-gesture-chip]', section);
  if (!image) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(image, {
        scale: 1.1 - p * .08,
        xPercent: -p * 2.5,
        yPercent: -2 + p * 4,
        filter: `saturate(${.9 + p * .08}) contrast(${1 + p * .04})`
      });

      if (copy) {
        const reveal = rangeProgress(p, .08, .36);
        gsap.set(copy, {
          autoAlpha: .32 + reveal * .68,
          y: (1 - reveal) * 28
        });
      }

      chips.forEach((chip, index) => {
        const reveal = rangeProgress(p, .12 + index * .12, .32 + index * .12);
        const spread = (index % 2 === 0 ? -1 : 1) * (18 + index * 3);
        gsap.set(chip, {
          autoAlpha: reveal,
          scale: .82 + reveal * .18,
          xPercent: (1 - reveal) * spread,
          y: (1 - reveal) * (30 + index * 6),
          rotate: (1 - reveal) * (index % 2 === 0 ? -7 : 7)
        });
      });
    }
  });
}

function setupTable(section: HTMLElement) {
  const orbit = section.querySelector<HTMLElement>('.v16-table-orbit');
  const dishes = gsap.utils.toArray<HTMLElement>('[data-v16-dish]', section);
  const copy = section.querySelector<HTMLElement>('.v16-table-copy');
  const cta = copy?.querySelector<HTMLAnchorElement>('a');
  if (!orbit || !dishes.length) return;
  if (cta) cta.tabIndex = -1;

  const starts = [0, .1, .22, .34, .46];

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;

      gsap.set(orbit, {
        scale: 1.32 - p * .24,
        rotate: -3 + p * 3,
        yPercent: 4 - p * 5
      });

      dishes.forEach((dish, index) => {
        const phase = rangeProgress(p, starts[index], starts[index] + .2);
        gsap.set(dish, {
          autoAlpha: phase,
          scale: .64 + phase * .36,
          y: (1 - phase) * (42 + index * 7),
          rotate: (1 - phase) * (index % 2 === 0 ? -10 : 10)
        });
      });

      if (copy) {
        const reveal = rangeProgress(p, .58, .84);
        gsap.set(copy, {
          autoAlpha: reveal,
          y: (1 - reveal) * 34,
          scale: .96 + reveal * .04
        });
        if (cta) cta.tabIndex = reveal > .55 ? 0 : -1;
      }
    }
  });
}

function setupGlossary(section: HTMLElement) {
  const words = gsap.utils.toArray<HTMLElement>('[data-v16-glossary-word]', section);
  const copy = section.querySelector<HTMLElement>('.v16-glossary-copy');
  if (!words.length) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      const position = p * (words.length - 1);

      words.forEach((word, index) => {
        const distance = index - position;
        const abs = Math.abs(distance);
        const alpha = clamp(1.05 - abs * 1.2);
        gsap.set(word, {
          autoAlpha: alpha,
          yPercent: distance * 26,
          xPercent: distance * -3,
          scale: 1 - Math.min(1, abs) * .08,
          filter: `blur(${Math.min(5, abs * 2.5)}px)`
        });
        word.classList.toggle('is-active', abs < .5);
      });

      if (copy) {
        gsap.set(copy, {
          yPercent: -p * 6,
          autoAlpha: 1 - rangeProgress(p, .78, .98) * .75
        });
      }
    }
  });
}
