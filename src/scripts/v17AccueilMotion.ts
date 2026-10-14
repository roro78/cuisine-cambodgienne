import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * V17 — chorégraphie éditoriale liée au scroll natif.
 * Aucun pin, aucun scroll hijacking et aucun élément essentiel masqué.
 * Le rendu complet est défini par Astro + CSS, avec ou sans JavaScript.
 */
export function initV17AccueilMotion() {
  const root = document.querySelector<HTMLElement>('[data-v17r-preview]');
  if (!root) return () => {};
  const mm = gsap.matchMedia();

  const sceneMotion = (
    selector: string,
    from: gsap.TweenVars,
    to: gsap.TweenVars,
  ) => {
    const node = root.querySelector<HTMLElement>(selector);
    if (!node) return;
    gsap.fromTo(node, from, {
      ...to,
      ease: 'none',
      overwrite: 'auto',
      scrollTrigger: {
        trigger: node.closest('section') ?? node,
        start: 'top 92%',
        end: 'bottom 25%',
        scrub: .75,
        invalidateOnRefresh: true,
      },
    });
  };

  /**
   * D16 — Actual kinetic typography. D15 only moved titles 26–98 pixels,
   * which was technically measurable but artistically invisible. Here the
   * headline travels across a meaningful fraction of the viewport, settles
   * for reading, then exits with an unmistakable opposing movement.
   * All content is complete in HTML/CSS when JS is off or reduced motion.
   */
  const chapterPerformance = (
    chapterSelector: string,
    direction: -1 | 1,
    mobile: boolean,
  ) => {
    const chapter = root.querySelector<HTMLElement>(chapterSelector);
    if (!chapter) return;
    const heading = chapter.querySelector<HTMLElement>('h2');
    if (!heading) return;
    const kicker = chapter.querySelector<HTMLElement>('.v17r-kicker');
    const contentSelector: Record<string, string> = {
      '.v17r-market': '.v17r-market-copy > p:not(.v17r-kicker)',
      '.v17r-palette': '.v17r-palette-intro',
      '.v17r-table': '.v17r-table-copy > p:not(.v17r-kicker)',
      '.v17r-dessert': '.v17r-dessert-copy > p:not(.v17r-kicker)',
      '.v17r-finale': '.v17r-finale-copy > p:not(.v17r-kicker)',
    };
    const copy = chapter.querySelector<HTMLElement>(contentSelector[chapterSelector]);
    const actions = gsap.utils.toArray<HTMLElement>(
      chapterSelector === '.v17r-finale' ? '.v17r-finale-actions' : '.v17r-pill',
      chapter,
    ).filter((node) => node.closest('section') === chapter);
    const isPalette = chapterSelector === '.v17r-palette';
    const isTable = chapterSelector === '.v17r-table';
    const isFinale = chapterSelector === '.v17r-finale';
    const entrance: gsap.TweenVars = isPalette ? {
      yPercent: mobile ? -110 : -165, scale: 1.21, opacity: 0,
    } : isTable ? {
      yPercent: mobile ? 110 : 155, scale: .87, opacity: 0,
    } : isFinale ? {
      yPercent: mobile ? 115 : 170, scale: 1.22, opacity: 0,
    } : {
      xPercent: direction * (mobile ? 145 : 170), opacity: 0,
    };
    const departure: gsap.TweenVars = isPalette ? {
      yPercent: mobile ? 85 : 130, scale: .91, opacity: 0,
    } : isTable ? {
      yPercent: mobile ? -90 : -125, scale: 1.06, opacity: 0,
    } : isFinale ? {
      yPercent: mobile ? -110 : -150, scale: .80, opacity: 0,
    } : {
      xPercent: -direction * (mobile ? 140 : 165), opacity: 0,
    };
    const timeline = gsap.timeline({
      scrollTrigger: {
        // The heading travels naturally through the viewport. A stage-level
        // trigger previously completed the exit after text was invisible.
        trigger: heading,
        start: 'top 96%',
        end: 'top 8%',
        scrub: mobile ? .25 : .36,
        invalidateOnRefresh: true,
      },
    });
    // Kicker leads, headline occupies the entire stage, supporting content
    // and invitation follow, leaving a full, readable middle beat.
    if (kicker) {
      timeline.fromTo(kicker,
        { y: mobile ? -45 : -95, opacity: 0 },
        { y: 0, opacity: 1, duration: .58, ease: 'power2.out',
          immediateRender: false }, 0);
    }
    timeline.fromTo(heading, entrance,
      { xPercent: 0, yPercent: 0, scale: 1, opacity: 1,
        duration: 1.05, ease: 'power3.out', immediateRender: false }, .16);
    if (copy) timeline.fromTo(copy,
      { xPercent: direction * (mobile ? 90 : 115),
        y: mobile ? 25 : 64, opacity: 0 },
      { xPercent: 0, y: 0, opacity: 1, duration: .85,
        ease: 'power3.out', immediateRender: false }, .58);
    actions.forEach((action, index) => timeline.fromTo(action,
      { y: mobile ? 80 : 120, scale: .85, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: .73,
        ease: 'back.out(1.25)', immediateRender: false }, .90+index*.12));
    // Entry finishes around the first third of the onscreen passage,
    // then the words rest before exiting while still visibly on stage.
    timeline.to(heading, { ...departure, duration: .95,
      ease: 'power2.in' }, 2.25);
    if (copy) timeline.to(copy, {
      xPercent: -direction * (mobile ? 70 : 110),
      y: mobile ? -22 : -55,
      opacity: 0, duration: .87, ease: 'power2.in',
    }, 2.40);
    actions.forEach((action,index) => timeline.to(action, {
      y: mobile ? -70 : -110, scale: .88, opacity: 0,
      duration: .73, ease: 'power2.in',
    },2.48+index*.07));
    if (kicker) timeline.to(kicker,
      { y: mobile ? -36 : -82, opacity: 0, duration: .64 }, 2.53);
  };

  const heroDeparture = (mobile: boolean) => {
    const hero = root.querySelector<HTMLElement>('.v17r-hero');
    const headline = hero?.querySelector<HTMLElement>('h1');
    const intro = hero?.querySelector<HTMLElement>('.v17r-hero-copy > p:not(.v17r-eyebrow):not(.v17r-hero-disclosure)');
    if (!hero || !headline) return;
    const departure = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom 20%',
        scrub: mobile ? .4 : .65,
        invalidateOnRefresh: true,
      },
    });
    departure.to(headline,
      { xPercent: mobile ? -115 : -150, yPercent: -20,
        opacity: 0, ease: 'power2.in', duration: 1 }, .15);
    if (intro) departure.to(intro,
      { xPercent: mobile ? -85 : -120, opacity: 0,
        duration: .9, ease: 'power2.in' }, .24);
  };

  /**
   * Mortar film: one full-bleed continuous photographic gesture, three
   * typographic beats and an organic preparation close-up. This is not video
   * footage; it is an animated still composition driven by native scrolling.
   * Every element is fully readable and visible in no-JS/reduced motion.
   */
  const mortarCinema = (mobile: boolean) => {
    const scene = root.querySelector<HTMLElement>('[data-v17-mortar-scene]');
    if (!scene) return;
    const image = scene.querySelector<HTMLElement>('.v17r-gestures-main img');
    const closeup = scene.querySelector<HTMLElement>('.v17r-gestures-kroeung');
    const words = gsap.utils.toArray<HTMLElement>('.v17r-gesture-word', scene);
    const kicker = scene.querySelector<HTMLElement>('.v17r-kicker');
    const description = scene.querySelector<HTMLElement>('.v17r-gestures-copy > p:not(.v17r-kicker)');
    const action = scene.querySelector<HTMLElement>('.v17r-pill');
    const progress = scene.querySelector<HTMLElement>('.v17r-gestures-progress span');
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: words[0] ?? scene,
        start: 'top 96%',
        end: 'top 8%',
        scrub: mobile ? .25 : .38,
        invalidateOnRefresh: true,
      },
    });
    if (image) timeline.fromTo(image,
      { scale: mobile ? 1.045 : 1.14, xPercent: mobile ? -1 : -2 },
      { scale: 1.005, xPercent: 0, ease: 'none', duration: 2.8, immediateRender: false }, 0);
    // Alternate directions: real offstage arrival, not the D15 9–26px shift.
    words.forEach((word,index) => timeline.fromTo(word,
      { xPercent: (index===1?-1:1) * (mobile ? 155 : 190),
        yPercent: mobile ? 27 : 37, rotation: index===1?-7:7, opacity: 0 },
      { xPercent: 0, yPercent: 0, rotation: 0, opacity: 1,
        ease: 'power3.out', duration: 1.00, immediateRender: false },
      .18 + index*.37));
    for (const [node, at] of [[kicker,.20],[description,.96],[action,1.34]] as const) {
      if (node) timeline.fromTo(node,
        { xPercent: mobile ? 63 : 90, y: mobile ? 16 : 48, opacity: 0 },
        { xPercent: 0, y: 0, opacity: 1, ease: 'power3.out',
          duration: .88, immediateRender: false }, at);
    }
    if (closeup) timeline.fromTo(closeup,
      { scale: mobile ? .90 : .78, rotation: mobile ? -3 : -7, opacity: .65 },
      { scale: 1, rotation: 0, opacity: 1, ease: 'power2.out', duration: 1.45, immediateRender: false }, 1.1);
    if (progress) timeline.fromTo(progress,
      { scaleX: .08 }, { scaleX: 1, ease: 'none', duration: 2.7, immediateRender: false }, 0);
    // D15: words leave individually, as the photograph gives way to the table.
    words.forEach((word,index) => timeline.to(word, {
      xPercent: (index===1?1:-1) * (mobile ? 140 : 185),
      yPercent: mobile ? -25 : -45, rotation: index===1?8:-8,
      opacity: 0, duration: .88, ease: 'power2.in',
    }, 2.42 + index*.10));
    if (closeup) timeline.to(closeup,
      { xPercent: mobile ? 6 : 18, rotation: mobile ? 2 : 8,
        scale: .91, opacity: .55, duration: .9, ease: 'power2.in' }, 2.45);
    if (description) timeline.to(description,
      { y: mobile ? -9 : -23, opacity: .52, duration: .66, ease: 'power2.in' }, 2.67);
    if (action) timeline.to(action,
      { x: mobile ? -9 : -29, opacity: .55, duration: .58, ease: 'power2.in' }, 2.76);
  };


  /**
   * D14 — chapter-to-chapter animation, never a page transition or scroll
   * replacement. Decorative bridges and photo frames only; real content
   * remains usable at every point, without JS and with reduced motion.
   */
  const sceneHandoffs = (mobile: boolean) => {
    const scrub = mobile ? .45 : .8;
    const bridges = [
      {selector: '.v17r-handoff--aroma svg', x: mobile ? -2 : -7, scale: .76},
      {selector: '.v17r-handoff--sweet svg', x: mobile ? 2 : 6, scale: .83},
      {selector: '.v17r-handoff--journey svg', x: mobile ? -2 : -5, scale: .78},
    ];
    for (const {selector, x, scale} of bridges) {
      const sheet = root.querySelector<SVGSVGElement>(selector);
      if (!sheet) continue;
      gsap.fromTo(sheet,
        { xPercent: x, yPercent: -50, scaleY: scale },
        {
          xPercent: 0, yPercent: -50, scaleY: 1,
          ease: 'none', overwrite: 'auto',
          scrollTrigger: {
            trigger: sheet.parentElement ?? sheet,
            start: 'top 95%', end: 'top 35%',
            scrub, invalidateOnRefresh: true,
          },
        });
    }

    // Progressive photographic reveal: left at market, top at the table,
    // right for the desserts, bottom at Angkor. Underlying scene background
    // deliberately stays visible during the handoff.
    const photographs = [
      {section: '.v17r-market', frame: '.v17r-market-visual', edge: 'left', crop: mobile ? 7 : 13},
      {section: '.v17r-table', frame: '.v17r-table-media', edge: 'top', crop: mobile ? 6 : 11},
      {section: '.v17r-dessert', frame: '.v17r-dessert-art', edge: 'right', crop: mobile ? 7 : 13},
      {section: '.v17r-finale', frame: '.v17r-finale-landscape', edge: 'bottom', crop: mobile ? 6 : 12},
    ] as const;
    for (const {section, frame, edge, crop} of photographs) {
      const chapter = root.querySelector<HTMLElement>(section);
      const artwork = root.querySelector<HTMLElement>(frame);
      if (!chapter || !artwork) continue;
      const cropped = {
        left: 'inset(0% 0% 0% ' + crop + '%)',
        right: 'inset(0% ' + crop + '% 0% 0%)',
        top: 'inset(' + crop + '% 0% 0% 0%)',
        bottom: 'inset(0% 0% ' + crop + '% 0%)',
      }[edge];
      gsap.fromTo(artwork, {clipPath: cropped}, {
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'none', overwrite: 'auto',
        scrollTrigger: {
          trigger: chapter,
          start: 'top 94%', end: 'top 37%',
          scrub, invalidateOnRefresh: true,
        },
      });
    }

    // The market-to-ingredients bridge has a softer botanical approach,
    // rather than yet another cropped photograph.
    if (!mobile) {
      const palette = root.querySelector<HTMLElement>('.v17r-palette');
      const stillLife = root.querySelector<HTMLElement>('.v17r-palette-media');
      if (palette && stillLife) gsap.fromTo(stillLife, {yPercent: 4}, {
        yPercent: 0, ease: 'none', overwrite: 'auto',
        scrollTrigger: {
          trigger: palette, start: 'top 93%', end: 'top 36%',
          scrub: .7, invalidateOnRefresh: true,
        },
      });
    }
  };

  /** An ingredient, flower or seal travels in and leaves with the chapter. */
  const objectPerformance = (mobile: boolean) => {
    const objects = [
      {chapter: '.v17r-hero', item: '.v17r-hero-flower-dish', direction: 1},
      {chapter: '.v17r-palette', item: '.v17r-palette-flower', direction: -1},
      {chapter: '.v17r-palette', item: '.v17r-palette-chili', direction: 1},
      {chapter: '.v17r-table', item: '.v17r-table-flower', direction: -1},
      {chapter: '.v17r-finale', item: '.v17r-finale-stamp', direction: 1},
    ];
    for (const {chapter, item, direction} of objects) {
      const frame = root.querySelector<HTMLElement>(chapter);
      const detail = frame?.querySelector<HTMLElement>(item);
      if (!frame || !detail || getComputedStyle(detail).display === 'none') continue;
      const motion = gsap.timeline({
        scrollTrigger: {
          trigger: frame,
          start: 'top 93%', end: 'bottom 18%',
          scrub: mobile ? .55 : .85,
          invalidateOnRefresh: true,
        },
      });
      motion.fromTo(detail,
        { xPercent: direction * (mobile ? 180 : 290),
          yPercent: mobile ? 80 : 130,
          rotation: direction * (mobile ? 22 : 38), scale: .66, opacity: 0 },
        { xPercent: 0, yPercent: 0, rotation: 0, scale: 1, opacity: 1,
          duration: 1.12, ease: 'power3.out', immediateRender: false }, .18);
      motion.to(detail,
        { xPercent: -direction * (mobile ? 145 : 240),
          yPercent: mobile ? -90 : -145,
          rotation: -direction * 24, scale: .72, opacity: 0,
          duration: .88, ease: 'power2.in' }, 3.05);
    }
  };

  mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
    // 1. Hero: quiet depth, never displacing the headline or CTA.
    sceneMotion('.v17r-hero-dish img', { scale: 1.09, yPercent: 2 }, { scale: 1.005, yPercent: -2 });
    // 2. Market: photographic parallax, no artificial scroll velocity.
    sceneMotion('.v17r-market-visual > img', { scale: 1.12, yPercent: -3 }, { scale: 1.025, yPercent: 3 });
    // 3. Ingredients: converging from different axes, title stays static.
    sceneMotion('.v17r-palette-a', { xPercent: -17, yPercent: 9 }, { xPercent: 0, yPercent: 0 });
    sceneMotion('.v17r-palette-b', { xPercent: 16, yPercent: -7 }, { xPercent: 0, yPercent: 0 });
    sceneMotion('.v17r-lemongrass', { xPercent: -16 }, { xPercent: 0 });
    sceneMotion('.v17r-palette-lime', { xPercent: 13, yPercent: 10 }, { xPercent: 0, yPercent: 0 });
    sceneMotion('.v17r-spice-bowls', { xPercent: 13, yPercent: 8 }, { xPercent: 0, yPercent: 0 });
    // Decorative botanical framing floats behind the static ingredient heading.
    sceneMotion('.v17r-palette-foliage-left', { xPercent: -16, yPercent: 10, rotation: -25 }, { xPercent: 0, yPercent: -3, rotation: -17 });
    sceneMotion('.v17r-palette-foliage-right', { xPercent: 13, yPercent: -10, rotation: 168 }, { xPercent: 0, yPercent: 4, rotation: 157 });
    // 4. Mortar: the hands remain real; the prepared kroeung is a second image.

    mortarCinema(false);
    // 5. Table: a single AI-generated culinary tableau creates immersive depth.
    sceneMotion('.v17r-table-amok img', { scale: 1.10, xPercent: -2 }, { scale: 1.01, xPercent: 1 });
    // 6–7. Desserts and Angkor: restraint and varied composition.
    sceneMotion('.v17r-dessert-generated img', { scale: 1.075, yPercent: -1 }, { scale: 1.005, yPercent: 2 });
    sceneMotion('.v17r-finale-landscape img', { scale: 1.09, yPercent: -3 }, { scale: 1.01, yPercent: 2 });
    // D15 editorial choreography: visible arrival, reading beat, exit.
    heroDeparture(false);
    objectPerformance(false);
    chapterPerformance('.v17r-market', 1, false);
    chapterPerformance('.v17r-palette', -1, false);
    chapterPerformance('.v17r-table', 1, false);
    chapterPerformance('.v17r-dessert', -1, false);
    chapterPerformance('.v17r-finale', 1, false);
    sceneHandoffs(false);
    // Organic seams move gently as chapter boundaries, without pinning.
    sceneMotion('.v17r-wave-green svg', { scaleX: 1.05, xPercent: -1 }, { scaleX: 1.05, xPercent: 1 });
    sceneMotion('.v17r-wave-cream svg', { scaleX: 1.05, xPercent: 1 }, { scaleX: 1.05, xPercent: -1 });
  });

  mm.add('(max-width: 760px) and (prefers-reduced-motion: no-preference)', () => {
    // Keep the first-screen Amok image static on mobile: it is the LCP candidate.
    // Other scenes retain their subtle native-scroll depth, while the hero stays
    // visually composed by CSS without a late compositor animation.
    // Mobile: movements < 14px in practice, never hide content or block gestures.
    sceneMotion('.v17r-market-visual > img', { scale: 1.045, yPercent: -1 }, { scale: 1.01, yPercent: 1 });
    sceneMotion('.v17r-palette-a', { xPercent: -5 }, { xPercent: 0 });
    sceneMotion('.v17r-palette-b', { xPercent: 5 }, { xPercent: 0 });

    sceneMotion('.v17r-table-amok img', { scale: 1.035 }, { scale: 1.005 });
    sceneMotion('.v17r-finale-landscape img', { scale: 1.04 }, { scale: 1.005 });
    mortarCinema(true);
    sceneHandoffs(true);
    // D15 mobile uses heading-driven movement, not offscreen scene entrances.
    heroDeparture(true);
    objectPerformance(true);
    chapterPerformance('.v17r-market', 1, true);
    chapterPerformance('.v17r-palette', -1, true);
    chapterPerformance('.v17r-table', 1, true);
    chapterPerformance('.v17r-dessert', -1, true);
    chapterPerformance('.v17r-finale', 1, true);
  });

  return () => mm.revert();
}
