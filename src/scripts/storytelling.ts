import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type FilmImage = {
  img: HTMLImageElement;
  src: string;
  ready: boolean;
  requested: boolean;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

export function initStorytelling() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const section = document.querySelector<HTMLElement>('[data-scroll-film]');
  const stage = document.querySelector<HTMLElement>('.scroll-film-stage');
  const canvas = document.querySelector<HTMLCanvasElement>('.scroll-film-canvas');
  const fallback = document.querySelector<HTMLImageElement>('.scroll-film-fallback');
  const copies = gsap.utils.toArray<HTMLElement>('.film-copy');
  const trailObjects = gsap.utils.toArray<HTMLElement>('[data-home-culinary-object]');
  const chapterLight = document.querySelector<HTMLElement>('.film-chapter-light');
  const count = document.querySelector<HTMLElement>('.film-count');
  const progressFill = document.querySelector<HTMLElement>('.film-progress i');

  if (!section || !stage || !canvas || copies.length !== 5) return () => {};

  const sectionEl = section;
  const stageEl = stage;
  const canvasEl = canvas;

  const context2d = canvasEl.getContext('2d', { alpha: false });
  if (!context2d) return () => {};
  const ctx = context2d;

  const desktopUrls = JSON.parse(stageEl.dataset.filmImages ?? '[]') as string[];
  const mobileUrls = JSON.parse(stageEl.dataset.filmImagesMobile ?? '[]') as string[];
  const urls = window.innerWidth < 720 && mobileUrls.length === desktopUrls.length
    ? mobileUrls
    : desktopUrls;
  const images: FilmImage[] = urls.map((src, index) => {
    if (index === 0 && fallback) {
      return {
        img: fallback,
        src,
        ready: fallback.complete && fallback.naturalWidth > 0,
        requested: true
      };
    }

    const img = new Image();
    img.decoding = 'async';
    return { img, src, ready: false, requested: false };
  });

  let width = 1;
  let height = 1;
  let dpr = 1;
  let lastProgress = 0;

  function requestImage(index: number) {
    const state = images[index];
    if (!state || state.requested) return;

    state.requested = true;
    state.img.addEventListener('load', () => {
      state.ready = true;
      if (index === 0 && fallback) fallback.style.opacity = '0';
      render(lastProgress);
    }, { once: true });
    state.img.src = state.src;
  }

  if (fallback && !images[0]?.ready) {
    fallback.addEventListener('load', () => {
      const first = images[0];
      if (!first) return;
      first.ready = true;
      render(lastProgress);
      fallback.style.opacity = '0';
    }, { once: true });
  } else if (images[0]?.ready && fallback) {
    render(lastProgress);
    fallback.style.opacity = '0';
  }

  requestImage(1);

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    const dprCap = window.innerWidth < 720 ? 1.25 : 1.5;
    dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    canvasEl.width = Math.round(width * dpr);
    canvasEl.height = Math.round(height * dpr);
    canvasEl.style.width = `${width}px`;
    canvasEl.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render(lastProgress);
  }

  function drawCover(
    image: HTMLImageElement,
    zoom = 1,
    offsetX = 0,
    offsetY = 0,
    alpha = 1
  ) {
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const canvasRatio = width / height;
    let drawWidth: number;
    let drawHeight: number;

    if (imageRatio > canvasRatio) {
      drawHeight = height * zoom;
      drawWidth = drawHeight * imageRatio;
    } else {
      drawWidth = width * zoom;
      drawHeight = drawWidth / imageRatio;
    }

    const x = (width - drawWidth) / 2 + offsetX * width;
    const y = (height - drawHeight) / 2 + offsetY * height;

    ctx.globalAlpha = alpha;
    ctx.drawImage(image, x, y, drawWidth, drawHeight);
    ctx.globalAlpha = 1;
  }

  function revealNext(index: number, t: number) {
    const current = images[index];
    const next = images[Math.min(index + 1, images.length - 1)];
    if (!current?.ready) return;

    const zoomA = reduceMotion ? 1 : 1.03 + t * 0.06;
    const zoomB = reduceMotion ? 1 : 1.1 - t * 0.06;
    const driftA = reduceMotion ? 0 : (index % 2 === 0 ? -1 : 1) * t * 0.018;
    const driftB = reduceMotion ? 0 : (index % 2 === 0 ? 1 : -1) * (1 - t) * 0.018;

    ctx.fillStyle = '#0a0a08';
    ctx.fillRect(0, 0, width, height);
    drawCover(current.img, zoomA, driftA, 0, 1);

    if (!next?.ready || index === images.length - 1) return;

    const transition = clamp((t - .5) / .36);
    if (transition <= 0) return;
    const eased = smoothstep(transition);
    ctx.save();

    if (reduceMotion) {
      drawCover(next.img, 1, 0, 0, eased);
      ctx.restore();
    } else {
      if (index === 0) {
        const wipe = width * eased;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(wipe + width * 0.14, 0);
        ctx.lineTo(wipe - width * 0.08, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.clip();
      } else if (index === 1) {
        const radius = Math.hypot(width, height) * 0.72 * eased;
        ctx.beginPath();
        ctx.arc(width * 0.68, height * 0.48, radius, 0, Math.PI * 2);
        ctx.clip();
      } else if (index === 2) {
        const wipe = height * eased;
        ctx.beginPath();
        ctx.rect(0, height - wipe, width, wipe);
        ctx.clip();
      } else {
        const inset = width * 0.18 * (1 - eased);
        ctx.beginPath();
        ctx.roundRect(inset, inset * 0.45, width - inset * 2, height - inset * 0.9, Math.max(18, inset * 0.18));
        ctx.clip();
      }

      const maxBlur = window.innerWidth < 720 ? 2 : 5;
      ctx.filter = `blur(${(1 - eased) * maxBlur}px)`;
      drawCover(next.img, zoomB, driftB, 0, 1);
      ctx.filter = 'none';
      ctx.restore();
    }

    if (t > 0.7) {
      ctx.save();
      ctx.globalAlpha = clamp((t - 0.7) / 0.3) * 0.08;
      ctx.fillStyle = '#f7ead8';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  function rangeProgress(progress: number, start: number, end: number) {
    return smoothstep((progress - start) / Math.max(.001, end - start));
  }

  function updateCopyContent(copy: HTMLElement, index: number, progress: number) {
    const kicker = copy.querySelector<HTMLElement>('.film-kicker');
    const titleLines = gsap.utils.toArray<HTMLElement>('.film-title-line > span', copy);
    const body = copy.querySelector<HTMLElement>('.film-body-reveal');
    const cta = copy.querySelector<HTMLElement>('.film-cta');
    const revealStart = Math.max(0, index / 5 - .035);
    const reveal = index === 0 ? 1 : rangeProgress(progress, revealStart, revealStart + .075);

    if (reduceMotion) {
      gsap.set([kicker, ...titleLines, body, cta].filter(Boolean), {
        autoAlpha: 1,
        x: 0,
        y: 0,
        yPercent: 0
      });
      return;
    }

    if (kicker) {
      const phase = rangeProgress(reveal, 0, .35);
      gsap.set(kicker, { autoAlpha: phase, y: (1 - phase) * 10 });
    }

    titleLines.forEach((line, lineIndex) => {
      const phase = rangeProgress(reveal, lineIndex * .13, .5 + lineIndex * .13);
      gsap.set(line, {
        autoAlpha: phase,
        yPercent: (1 - phase) * 108
      });
    });

    if (body) {
      const phase = rangeProgress(reveal, .36, .82);
      gsap.set(body, { autoAlpha: phase, y: (1 - phase) * 14 });
    }

    if (cta) {
      const phase = rangeProgress(progress, .91, .97);
      gsap.set(cta, { autoAlpha: phase, y: (1 - phase) * 12 });
    }
  }

  function updateCulinaryObjects(progress: number) {
    if (trailObjects.length !== 4) return;

    if (reduceMotion) {
      const opacities = [.3, .26, .34, .38];
      const activeObject = Math.min(3, Math.floor(progress * 5) - 1);
      trailObjects.forEach((object, index) => {
        const isCurrent = index === activeObject;
        object.classList.toggle('is-reduced-current', isCurrent);
        gsap.set(object, {
          autoAlpha: isCurrent ? opacities[index] : 0,
          x: 0,
          y: 0,
          rotate: 0,
          scale: .82
        });
      });
      if (chapterLight) gsap.set(chapterLight, { autoAlpha: .2, xPercent: 0 });
      return;
    }

    trailObjects.forEach((object) => object.classList.remove('is-reduced-current'));

    const mobileFactor = window.innerWidth < 720 ? .62 : 1;
    const plans = [
      {
        start: .11, peak: .22, end: .4,
        from: { x: 22, y: -15, scale: 1.28, rotate: -16 },
        middle: { x: -4, y: 4, scale: .92, rotate: 2 },
        to: { x: -48, y: 31, scale: 1.22, rotate: 13 }
      },
      {
        start: .31, peak: .48, end: .61,
        from: { x: -17, y: 25, scale: 1.18, rotate: 12 },
        middle: { x: 39, y: -7, scale: .88, rotate: -4 },
        to: { x: 58, y: -24, scale: 1.12, rotate: -12 }
      },
      {
        start: .52, peak: .67, end: .82,
        from: { x: 18, y: -11, scale: 1.32, rotate: -12 },
        middle: { x: -9, y: 8, scale: .94, rotate: 3 },
        to: { x: -53, y: 27, scale: 1.2, rotate: 14 }
      },
      {
        start: .74, peak: .88, end: 1.3,
        from: { x: -7, y: 19, scale: .78, rotate: -4 },
        middle: { x: 2, y: -5, scale: 1, rotate: 3 },
        to: { x: 8, y: -28, scale: 1.12, rotate: -2 }
      }
    ];

    trailObjects.forEach((object, index) => {
      const plan = plans[index];
      const enter = rangeProgress(progress, plan.start, plan.peak);
      const leave = rangeProgress(progress, plan.peak, plan.end);
      const blend = (from: number, middle: number, to: number) =>
        gsap.utils.interpolate(
          gsap.utils.interpolate(from, middle, enter),
          to,
          leave
        );
      const opacity = enter * (1 - leave) * (index === 3 ? .82 : .9);

      gsap.set(object, {
        autoAlpha: opacity,
        x: `${blend(plan.from.x, plan.middle.x, plan.to.x) * mobileFactor}vw`,
        y: `${blend(plan.from.y, plan.middle.y, plan.to.y) * mobileFactor}vh`,
        scale: blend(plan.from.scale, plan.middle.scale, plan.to.scale),
        rotate: blend(plan.from.rotate, plan.middle.rotate, plan.to.rotate)
      });
    });

    if (chapterLight) {
      const amokWarmth = rangeProgress(progress, .73, .96);
      gsap.set(chapterLight, {
        autoAlpha: .12 + amokWarmth * .34,
        xPercent: gsap.utils.interpolate(-22, 16, progress),
        scale: 1 + amokWarmth * .18
      });
    }
  }

  function updateCopy(progress: number) {
    const segment = 1 / 5;
    const raw = progress / segment;
    const active = Math.min(4, Math.floor(raw));
    const local = clamp(raw - active);
    const handoff = active < 4 ? smoothstep((local - .76) / .16) : 0;

    copies.forEach((copy, index) => {
      updateCopyContent(copy, index, progress);
      if (index === active) {
        const opacity = active === 4 ? 1 : 1 - handoff;
        const y = reduceMotion ? 0 : -handoff * 18;
        gsap.set(copy, {
          autoAlpha: opacity,
          y,
          scale: reduceMotion ? 1 : 1 - handoff * .012
        });
        copy.classList.toggle('is-active', opacity > .08);
        return;
      }

      if (index === active + 1 && active < 4) {
        const opacity = handoff;
        const y = reduceMotion ? 0 : (1 - handoff) * 20;
        gsap.set(copy, {
          autoAlpha: opacity,
          y,
          scale: reduceMotion ? 1 : .988 + handoff * .012
        });
        copy.classList.toggle('is-active', opacity > .08);
        return;
      }

      gsap.set(copy, {
        autoAlpha: 0,
        y: 0,
        scale: 1
      });
      copy.classList.remove('is-active');
    });

    if (count) count.textContent = String(active + 1).padStart(2, '0');
    if (progressFill) gsap.set(progressFill, { scaleY: progress });
    updateCulinaryObjects(progress);
  }

  function render(progress: number) {
    lastProgress = clamp(progress);
    const scaled = lastProgress * 5;
    const index = Math.min(4, Math.floor(scaled));
    const local = clamp(scaled - index);

    requestImage(index);
    requestImage(Math.min(index + 1, images.length - 1));

    revealNext(index, local);
    updateCopy(lastProgress);
  }

  const context = gsap.context(() => {
    resize();

    ScrollTrigger.create({
      trigger: sectionEl,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => render(self.progress),
      onRefresh: () => resize()
    });

    if (!reduceMotion) {
      gsap.fromTo('.amok-finale-media img', { scale: 1.09 }, {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.amok-finale',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1
        }
      });

      gsap.fromTo('.amok-finale-copy', { y: 48, autoAlpha: .45 }, {
        y: -16,
        autoAlpha: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.amok-finale',
          start: 'top 82%',
          end: 'bottom 42%',
          scrub: .8
        }
      });

      gsap.utils.toArray<HTMLElement>('.amok-finale-steam i').forEach((steam, index) => {
        const directions = [-18, 13, 22];
        const rotations = [-7, 5, -3];
        gsap.fromTo(steam, {
          x: 0,
          yPercent: 18 + index * 5,
          scaleY: .72,
          rotate: rotations[index] * -1,
          autoAlpha: .08
        }, {
          x: directions[index],
          yPercent: -28 - index * 12,
          scaleY: 1.08 + index * .06,
          rotate: rotations[index],
          autoAlpha: .64 - index * .08,
          ease: 'none',
          scrollTrigger: {
            trigger: '.amok-finale',
            start: 'top 88%',
            end: 'bottom 22%',
            scrub: .7 + index * .18
          }
        });
      });
    } else {
      gsap.set('.amok-finale-media img', { scale: 1 });
      gsap.set('.amok-finale-copy', { y: 0, autoAlpha: 1 });
      gsap.set('.amok-finale-steam i', {
        x: 0,
        yPercent: 0,
        scaleY: 1,
        rotate: 0,
        autoAlpha: .28
      });
    }

    ScrollTrigger.refresh();
  });

  const onResize = () => resize();
  const onLoad = () => ScrollTrigger.refresh();
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onLoad, { once: true });

  return () => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('load', onLoad);
    context.revert();
  };
}
