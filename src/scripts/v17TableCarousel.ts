/**
 * Native mobile carousel for the four recipe links of the V17 feast.
 * Scroll-snap remains functional with JavaScript disabled. These controls
 * progressively enhance touch, keyboard and direct selection without timers,
 * autoplay, GSAP pinning or taking over vertical scrolling.
 */
export function initV17TableCarousel(): void {
  const scene=document.querySelector<HTMLElement>('[data-v17-table-editorial]');
  const track=scene?.querySelector<HTMLOListElement>('[data-v17-table-carousel]');
  const controls=scene?.querySelector<HTMLElement>('[data-v17-carousel-controls]');
  const prev=controls?.querySelector<HTMLButtonElement>('[data-v17-carousel-prev]');
  const next=controls?.querySelector<HTMLButtonElement>('[data-v17-carousel-next]');
  const page=controls?.querySelector<HTMLElement>('[data-v17-carousel-page]');
  const dots=controls ? Array.from(controls.querySelectorAll<HTMLButtonElement>('[data-v17-carousel-dot]')) : [];
  const cards=track ? Array.from(track.querySelectorAll<HTMLElement>('[data-v17-table-recipe]')) : [];
  if (!scene||!track||!controls||!prev||!next||!page||cards.length!==4||dots.length!==cards.length) return;

  const mobile=window.matchMedia('(max-width: 760px)');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let current=0;
  let frame=0;

  const update=(index:number) => {
    current=Math.max(0,Math.min(cards.length-1,index));
    page.textContent=(current+1)+' / '+cards.length;
    prev.disabled=current===0;
    next.disabled=current===cards.length-1;
    dots.forEach((dot,i) => dot.setAttribute('aria-current',i===current?'true':'false'));
  };
  const nearest=():number => {
    // offsetLeft is measured relative to the same scrollable track.
    const first=cards[0].offsetLeft;
    return cards.reduce((best,card,i)=>
      Math.abs(card.offsetLeft-first-track.scrollLeft) <
      Math.abs(cards[best].offsetLeft-first-track.scrollLeft) ? i : best,0);
  };
  const goTo=(index:number) => {
    if (!mobile.matches) return;
    const target=Math.max(0,Math.min(cards.length-1,index));
    update(target);
    track.scrollTo({
      left:cards[target].offsetLeft-cards[0].offsetLeft,
      behavior:reduced.matches?'instant':'smooth',
    });
  };

  prev.addEventListener('click',()=>goTo(current-1));
  next.addEventListener('click',()=>goTo(current+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>goTo(i)));
  track.addEventListener('keydown',event=>{
    if (!mobile.matches || event.target!==track) return;
    if (event.key==='ArrowRight'||event.key==='ArrowLeft'){
      event.preventDefault();
      goTo(current+(event.key==='ArrowRight'?1:-1));
    }
    if(event.key==='Home'){event.preventDefault();goTo(0)}
    if(event.key==='End'){event.preventDefault();goTo(cards.length-1)}
  });

  track.addEventListener('scroll',()=>{
    if (frame) window.cancelAnimationFrame(frame);
    frame=window.requestAnimationFrame(()=>{
      frame=0;
      update(nearest());
    });
  },{passive:true});
  const adapt=()=>{
    track.tabIndex=mobile.matches?0:-1;
    update(mobile.matches?nearest():0);
  };
  mobile.addEventListener('change',adapt);
  window.addEventListener('resize',adapt,{passive:true});
  adapt();
  scene.dataset.v17CarouselReady='';
}
