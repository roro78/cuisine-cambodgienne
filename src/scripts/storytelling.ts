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

    const eased = smoothstep(t);
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

  function updateCopy(progress: number) {
    const segment = 1 / 5;
    const raw = progress / segment;
    const active = Math.min(4, Math.floor(raw));
    const local = clamp(raw - active);

    copies.forEach((copy, index) => {
      if (index !== active) {
        gsap.set(copy, {
          autoAlpha: 0,
          y: reduceMotion ? 0 : (index < active ? -28 : 28),
          scale: reduceMotion ? 1 : 0.985
        });
        copy.classList.remove('is-active');
        return;
      }

      const fadeIn = smoothstep(local / 0.16);
      const fadeOut = 1 - smoothstep((local - 0.78) / 0.2);
      const opacity = active === 4 ? fadeIn : Math.min(fadeIn, fadeOut);
      const y = reduceMotion
        ? 0
        : local < 0.18
          ? (1 - fadeIn) * 26
          : -smoothstep((local - 0.8) / 0.2) * 20;

      gsap.set(copy, {
        autoAlpha: opacity,
        y,
        scale: reduceMotion ? 1 : 1 - (1 - opacity) * 0.015
      });
      copy.classList.toggle('is-active', opacity > 0.2);
    });

    if (count) count.textContent = String(active + 1).padStart(2, '0');
    if (progressFill) gsap.set(progressFill, { scaleY: progress });
  }

  function render(progress: number) {
    lastProgress = clamp(progress);
    const scaled = lastProgress * 4;
    const index = Math.min(4, Math.floor(scaled));
    const local = index === 4 ? 1 : clamp(scaled - index);

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

    gsap.fromTo('.after-film h2',
      { y: reduceMotion ? 0 : 80, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        scrollTrigger: {
          trigger: '.after-film',
          start: 'top 72%',
          end: 'top 42%',
          scrub: reduceMotion ? .35 : 1
        }
      }
    );

    if (!reduceMotion) {
      gsap.fromTo('.amok-poster img', { scale: 1.16 }, {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.amok-poster',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1
        }
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
