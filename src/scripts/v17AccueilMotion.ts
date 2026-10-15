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
      // The earlier downward departure crossed the explanatory copy.
      // Exit laterally into the botanical still life, not through body text.
      xPercent: mobile ? 145 : 165, yPercent: 0, scale: .92, opacity: 0,
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


  /**
   * D17-A: one physical aromatic traverses three successive chapters.
   * A single fixed decorative DOM node, not a fresh entrance per section.
   * Disabled on mobile, in reduced motion and without JS.
   */
  const travellingAromatic = () => {
    const traveller = root.querySelector<HTMLElement>('[data-v17-aromatic-traveller]');
    const market = root.querySelector<HTMLElement>('.v17r-market');
    const mortar = root.querySelector<HTMLElement>('[data-v17-mortar-scene]');
    if (!traveller || !market || !mortar) return;
    gsap.set(traveller,{display:'block',autoAlpha:0,transformOrigin:'42% 55%'});
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const journey = gsap.timeline({
      scrollTrigger: {
        trigger: market, start:'top 80%',
        endTrigger: mortar, end:'top 20%',
        scrub:.65, invalidateOnRefresh:true,
      }
    });
    journey.fromTo(traveller,
      { x:()=>W()*.06, y:()=>H()*.65, rotation:-45,scale:.53,autoAlpha:0 },
      { x:()=>W()*.18, y:()=>H()*.54, rotation:-22,scale:.91,autoAlpha:.92,
        duration:1,ease:'none',immediateRender:false },0);
    journey.to(traveller,
      { x:()=>W()*.44,y:()=>H()*.29,rotation:5,scale:1.11,autoAlpha:1,
        duration:1.15,ease:'none' },1);
    journey.to(traveller,
      { x:()=>W()*.54,y:()=>H()*.39,rotation:41,scale:.81,autoAlpha:.92,
        duration:1.05,ease:'none' },2.15);
    journey.to(traveller,
      { x:()=>W()*.31,y:()=>H()*.54,rotation:118,scale:.28,autoAlpha:0,
        duration:1.05,ease:'none' },3.2);
  };

  /**
   * D17-A: the sweets fill the stage. The photograph blooms open under the
   * copy through a radial mask, instead of sitting in a rectangular card.
   * Copy stays legible; this scene deliberately does NOT share the generic
   * lateral heading entrance used in earlier acts.
   */
  const dessertBloom = (mobile:boolean) => {
    const stage=root.querySelector<HTMLElement>('.v17r-dessert');
    const art=stage?.querySelector<HTMLElement>('.v17r-dessert-generated');
    if(!stage || !art) return;
    gsap.fromTo(art,
      { clipPath:mobile?'circle(22% at 58% 33%)':'circle(14% at 69% 52%)',
        scale:mobile?1.08:1.18 },
      { clipPath:mobile?'circle(132% at 58% 33%)':'circle(133% at 69% 52%)',
        scale:1, ease:'none',immediateRender:false,
        scrollTrigger:{
          trigger:stage,start:'top 90%',end:'top 28%',
          scrub:mobile?.42:.68,invalidateOnRefresh:true
        }
      });
  };


  /**
   * D18 — La tablée se compose. Four independent illustrated recipe links,
   * each entering via a different physical gesture, settle on one table.
   * CSS sticky (not a forced GSAP pin) gives the visitor enough native-scroll
   * time to read, explore and select each actual recipe.
   *
   * The DOM/CSS is complete without JS and in reduced motion. No external
   * network, no duplicate plate overlays, no click interception.
   */
  const assembleTable = (mobile: boolean) => {
    const section=root.querySelector<HTMLElement>('[data-v17-table-assemble]');
    if(!section) return;
    const stage=section.querySelector<HTMLElement>('.v17r-table-stage');
    const lighting=section.querySelector<HTMLElement>('.v17r-table-light');
    const linen=section.querySelector<HTMLElement>('.v17r-table-linen');
    const dishes=[
      section.querySelector<HTMLElement>('.v17r-table-dish--amok'),
      section.querySelector<HTMLElement>('.v17r-table-dish--loklak'),
      section.querySelector<HTMLElement>('.v17r-table-dish--nombanhchok'),
      section.querySelector<HTMLElement>('.v17r-table-dish--prahok'),
    ];
    if(!stage || dishes.some(d=>!d)) return;
    section.dataset.v17TableReady='';
    const timeline=gsap.timeline({
      scrollTrigger:{
        trigger:section,
        start:'top 77%',
        end:'bottom 84%',
        scrub:mobile?.3:.52,
        invalidateOnRefresh:true
      }
    });
    if(linen) timeline.fromTo(linen,
      {xPercent:mobile?14:18,rotation:-27,opacity:.36},
      {xPercent:0,rotation:mobile?-31:-17,opacity:1,
        duration:2.1,ease:'power2.out',immediateRender:false},0);
    if(lighting)timeline.fromTo(lighting,
      {opacity:.38,xPercent:-7},
      {opacity:1,xPercent:2,duration:3.1,ease:'none',immediateRender:false},0);
    const arrivals=[
      {at:.55,from:{scale:.38,yPercent:mobile?78:110,rotation:-28,opacity:0},
        duration:.96},
      {at:1.20,from:{scale:.70,xPercent:mobile?90:145,rotation:24,opacity:0},
        duration:.83},
      {at:1.91,from:{scale:.66,xPercent:mobile?-67:-92,yPercent:mobile?90:125,
          rotation:-23,opacity:0},duration:.91},
      {at:2.68,from:{scale:.18,yPercent:mobile?55:70,rotation:-52,opacity:0},
        duration:.70}
    ] as const;
    dishes.forEach((dish,index)=>{
      if(!dish)return;
      const beat=arrivals[index];
      timeline.fromTo(dish,beat.from,
        {scale:1,xPercent:0,yPercent:0,rotation:0,opacity:1,
          duration:beat.duration,ease:index===3?'back.out(1.18)':'power3.out',
          immediateRender:false},beat.at);
    });
    // Photo composition holds fully assembled for a significant scroll span.
    timeline.to({}, {duration:1.05},3.48);
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
    // 5. The table is built plate by plate, not a single static tableau.
    assembleTable(false);
    // 6–7. Desserts and Angkor: restraint and varied composition.
    sceneMotion('.v17r-dessert-generated img', { scale: 1.075, yPercent: -1 }, { scale: 1.005, yPercent: 2 });
    sceneMotion('.v17r-finale-landscape img', { scale: 1.09, yPercent: -3 }, { scale: 1.01, yPercent: 2 });
    // D15 editorial choreography: visible arrival, reading beat, exit.
    heroDeparture(false);
    objectPerformance(false);
    chapterPerformance('.v17r-market', 1, false);
    chapterPerformance('.v17r-palette', -1, false);
    // No generic heading exit in the table: the dishes are the protagonists.
    dessertBloom(false);
    travellingAromatic();
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

    assembleTable(true);
    sceneMotion('.v17r-finale-landscape img', { scale: 1.04 }, { scale: 1.005 });
    mortarCinema(true);
    sceneHandoffs(true);
    // D15 mobile uses heading-driven movement, not offscreen scene entrances.
    heroDeparture(true);
    objectPerformance(true);
    chapterPerformance('.v17r-market', 1, true);
    chapterPerformance('.v17r-palette', -1, true);
    // No generic heading exit in the table: the dishes are the protagonists.
    dessertBloom(true);
    chapterPerformance('.v17r-finale', 1, true);
  });

  return () => mm.revert();
}
