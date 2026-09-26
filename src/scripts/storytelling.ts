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
  const cleanup: Array<() => void> = [];

  const context = gsap.context(() => {
    const hero = document.querySelector<HTMLElement>('[data-v14-hero]');
    const dishes = document.querySelector<HTMLElement>('[data-v14-dishes]');
    const flavors = document.querySelector<HTMLElement>('[data-v14-flavors]');
    const market = document.querySelector<HTMLElement>('[data-v14-market]');
    const tastes = document.querySelector<HTMLElement>('[data-v14-tastes]');
    const homeCook = document.querySelector<HTMLElement>('[data-v14-home-cook]');
    const table = document.querySelector<HTMLElement>('[data-v14-table]');

    setupDesireTabs(reducedMotion, cleanup);

    if (reducedMotion) {
      document.documentElement.classList.add('v14-reduced-motion');
      gsap.set('[data-v14-hero-card], [data-v14-dish-card], [data-v14-flavor-object], [data-v14-taste-card], [data-v14-table-plate], [data-v14-ingredient]', {
        clearProps: 'transform,opacity,visibility,filter'
      });
      gsap.set('[data-v14-market-track]', { xPercent: 0 });
      gsap.set('[data-v14-flavor-word]', { autoAlpha: 1, position: 'static' });
      ScrollTrigger.refresh();
      return;
    }

    if (hero) setupHero(hero);
    if (dishes) setupDishes(dishes);
    if (flavors) setupFlavors(flavors);
    if (market) setupMarket(market);
    if (tastes) setupTastes(tastes);
    if (homeCook) setupHomeCook(homeCook);
    if (table) setupTable(table);

    ScrollTrigger.refresh();
  });

  const onLoad = () => ScrollTrigger.refresh();
  const onResize = () => ScrollTrigger.refresh();
  window.addEventListener('load', onLoad, { once: true });
  window.addEventListener('resize', onResize);
  cleanup.push(() => window.removeEventListener('load', onLoad));
  cleanup.push(() => window.removeEventListener('resize', onResize));

  return () => {
    cleanup.forEach((fn) => fn());
    document.documentElement.classList.remove('v14-reduced-motion');
    context.revert();
  };
}

function setupHero(section: HTMLElement) {
  const stage = section.querySelector<HTMLElement>('.v14-hero-stage');
  const title = section.querySelector<HTMLElement>('.v14-hero-copy h1');
  const intro = section.querySelector<HTMLElement>('.v14-hero-copy > p:last-child');
  const backdrop = section.querySelector<HTMLElement>('.v14-hero-backdrop img');
  const cards = gsap.utils.toArray<HTMLElement>('[data-v14-hero-card]', section);
  if (!stage || !title || cards.length === 0) return;

  const plans = [
    { x: -48, y: -30, r: -14, s: 1.14 },
    { x: 52, y: -18, r: 12, s: .92 },
    { x: -38, y: 36, r: 9, s: .88 },
    { x: 44, y: 32, r: -11, s: 1.08 }
  ];

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(title, {
        yPercent: -p * 18,
        scale: 1 - p * .07,
        autoAlpha: 1 - p * .72
      });
      if (intro) {
        gsap.set(intro, {
          y: -p * 26,
          autoAlpha: 1 - p * .78
        });
      }
      if (backdrop) {
        gsap.set(backdrop, {
          scale: 1.1 - p * .04,
          yPercent: p * 2.4,
          filter: `saturate(${.88 + p * .08}) brightness(${.72 - p * .08})`
        });
      }

      cards.forEach((card, index) => {
        const plan = plans[index] ?? plans[0];
        const depth = .72 + index * .08;
        gsap.set(card, {
          xPercent: plan.x * p,
          yPercent: plan.y * p,
          rotate: plan.r * p,
          scale: 1 + (plan.s - 1) * p,
          autoAlpha: 1 - rangeProgress(p, .72 + index * .025, .98),
          filter: `blur(${Math.max(0, (p - .72) * depth * 7)}px)`
        });
      });
    }
  });
}

function setupDishes(section: HTMLElement) {
  const cards = gsap.utils.toArray<HTMLElement>('[data-v14-dish-card]', section);
  const progress = section.querySelector<HTMLElement>('.v14-chapter-progress i');
  if (!cards.length) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const travel = self.progress * (cards.length - 1);
      cards.forEach((card, index) => {
        const distance = index - travel;
        const magnitude = Math.min(1.6, Math.abs(distance));
        const alpha = clamp(1.05 - magnitude * .55);
        gsap.set(card, {
          xPercent: distance * 58,
          yPercent: magnitude * 8,
          scale: 1 - magnitude * .1,
          rotate: distance * 2.2,
          autoAlpha: alpha,
          zIndex: 20 - Math.round(magnitude * 5)
        });
        card.classList.toggle('is-active', Math.abs(distance) < .48);
      });
      if (progress) gsap.set(progress, { scaleX: self.progress });
    }
  });
}

function setupFlavors(section: HTMLElement) {
  const words = gsap.utils.toArray<HTMLElement>('[data-v14-flavor-word]', section);
  const objects = gsap.utils.toArray<HTMLElement>('[data-v14-flavor-object]', section);
  if (!words.length || !objects.length) return;

  const paths = [
    { fromX: -46, fromY: 34, toX: 42, toY: -30, r: 18, scale: 1.22 },
    { fromX: 50, fromY: -22, toX: -35, toY: 28, r: -14, scale: .92 },
    { fromX: -18, fromY: -42, toX: 28, toY: 40, r: 10, scale: 1.08 },
    { fromX: 44, fromY: 38, toX: -42, toY: -24, r: 15, scale: 1.16 },
    { fromX: -36, fromY: 2, toX: 48, toY: 14, r: -18, scale: .9 }
  ];

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      const wordPosition = p * (words.length - 1);
      words.forEach((word, index) => {
        const distance = Math.abs(index - wordPosition);
        gsap.set(word, {
          autoAlpha: clamp(1 - distance * 1.35),
          yPercent: (index - wordPosition) * 24,
          scale: 1 - Math.min(1, distance) * .08
        });
        word.classList.toggle('is-active', distance < .5);
      });

      objects.forEach((object, index) => {
        const path = paths[index] ?? paths[0];
        const phase = clamp((p + index * .08) / 1.16);
        const pulse = Math.sin((phase + index * .12) * Math.PI);
        gsap.set(object, {
          xPercent: gsap.utils.interpolate(path.fromX, path.toX, phase),
          yPercent: gsap.utils.interpolate(path.fromY, path.toY, phase),
          rotate: gsap.utils.interpolate(-path.r * .5, path.r, phase),
          scale: 1 + (path.scale - 1) * pulse,
          autoAlpha: .48 + pulse * .52,
          filter: `blur(${Math.max(0, Math.abs(.5 - phase) - .33) * 5}px)`
        });
      });
    }
  });
}

function setupMarket(section: HTMLElement) {
  const track = section.querySelector<HTMLElement>('[data-v14-market-track]');
  const count = section.querySelector<HTMLElement>('[data-v14-market-count]');
  const panels = gsap.utils.toArray<HTMLElement>('.v14-market-panel', section);
  if (!track || !panels.length) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(track, { xPercent: -80 * p });
      const active = Math.min(panels.length - 1, Math.floor(p * panels.length));
      if (count) count.textContent = String(active + 1).padStart(2, '0');

      panels.forEach((panel, index) => {
        const local = clamp(p * panels.length - index, -.8, 1.8);
        const image = panel.querySelector<HTMLElement>('img');
        const front = panel.querySelector<HTMLElement>('.v14-market-depth--front');
        const back = panel.querySelector<HTMLElement>('.v14-market-depth--back');
        if (image) gsap.set(image, { scale: 1.1 - clamp(local, 0, 1) * .06, xPercent: local * -2.5 });
        if (front) gsap.set(front, { xPercent: local * -24 });
        if (back) gsap.set(back, { xPercent: local * -9 });
      });
    }
  });
}

function setupTastes(section: HTMLElement) {
  const cards = gsap.utils.toArray<HTMLElement>('[data-v14-taste-card]', section);
  if (!cards.length) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const travel = self.progress * (cards.length - 1);
      cards.forEach((card, index) => {
        const distance = index - travel;
        const abs = Math.min(1.5, Math.abs(distance));
        gsap.set(card, {
          yPercent: distance * 18,
          xPercent: distance * -4,
          scale: 1 - abs * .08,
          rotate: distance * -1.8,
          autoAlpha: clamp(1.08 - abs * .6),
          zIndex: 30 - Math.round(abs * 8)
        });
      });
    }
  });
}

function setupHomeCook(section: HTMLElement) {
  const media = section.querySelector<HTMLElement>('[data-v14-home-cook-media]');
  const image = media?.querySelector<HTMLElement>('img');
  const labels = gsap.utils.toArray<HTMLElement>('[data-v14-ingredient]', section);
  if (!media || !image) return;

  gsap.fromTo(image, { scale: 1.12, yPercent: -3 }, {
    scale: 1,
    yPercent: 3,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    }
  });

  labels.forEach((label, index) => {
    gsap.fromTo(label, {
      autoAlpha: 0,
      y: 24 + index * 7,
      scale: .94
    }, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: `top ${82 - index * 6}%`,
        end: `center ${58 - index * 4}%`,
        scrub: .7
      }
    });
  });
}

function setupTable(section: HTMLElement) {
  const surface = section.querySelector<HTMLElement>('[data-v14-table-surface]');
  const plates = gsap.utils.toArray<HTMLElement>('[data-v14-table-plate]', section);
  const copy = section.querySelector<HTMLElement>('.v14-table-copy');
  if (!surface || !plates.length) return;

  const thresholds = [0, .17, .35, .53];

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(surface, {
        scale: 1.32 - p * .24,
        rotate: -2 + p * 2,
        yPercent: 4 - p * 4
      });

      plates.forEach((plate, index) => {
        const phase = rangeProgress(p, thresholds[index], thresholds[index] + .2);
        gsap.set(plate, {
          autoAlpha: phase,
          scale: .72 + phase * .28,
          y: (1 - phase) * (28 + index * 8),
          rotate: (1 - phase) * (index % 2 === 0 ? -6 : 6)
        });
      });

      if (copy) {
        const reveal = rangeProgress(p, .62, .9);
        gsap.set(copy, {
          autoAlpha: reveal,
          y: (1 - reveal) * 28
        });
      }
    }
  });
}

function setupDesireTabs(reducedMotion: boolean, cleanup: Array<() => void>) {
  const section = document.querySelector<HTMLElement>('[data-v14-desire]');
  if (!section) return;

  const buttons = gsap.utils.toArray<HTMLButtonElement>('[data-v14-desire-tab]', section);
  const panels = gsap.utils.toArray<HTMLElement>('[data-v14-desire-panel]', section);
  if (!buttons.length || !panels.length) return;

  const activate = (key: string) => {
    buttons.forEach((button) => {
      const active = button.dataset.v14DesireTab === key;
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      const active = panel.dataset.v14DesirePanel === key;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
      if (active && !reducedMotion) {
        const figure = panel.querySelector<HTMLElement>('figure');
        const copy = panel.querySelector<HTMLElement>('div');
        if (figure) gsap.fromTo(figure, { autoAlpha: 0, xPercent: 4, scale: 1.025 }, { autoAlpha: 1, xPercent: 0, scale: 1, duration: .55, ease: 'power2.out' });
        if (copy) gsap.fromTo(copy, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .5, ease: 'power2.out' });
      }
    });
  };

  buttons.forEach((button) => {
    const onClick = () => activate(button.dataset.v14DesireTab ?? '');
    button.addEventListener('click', onClick);
    cleanup.push(() => button.removeEventListener('click', onClick));
  });
}
