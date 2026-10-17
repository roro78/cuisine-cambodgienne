type Chapter = { title: string; start: number; duration: number; text: string };
type Manifest = { slug: string; audio: string; duration: number; chapters: Chapter[] };

export function initWorkshopNarrator(): void {
  const root = document.querySelector<HTMLElement>('[data-workshop-audio]');
  if (!root || root.dataset.audioInitialized === 'true') return;
  root.dataset.audioInitialized = 'true';

  let manifest: Manifest;
  try {
    manifest = JSON.parse(root.dataset.workshopAudioManifest ?? '') as Manifest;
    if (!Array.isArray(manifest.chapters) || manifest.chapters.length < 2 ||
        !manifest.chapters.every((c) => typeof c.text === 'string' && Number.isFinite(c.start)) ||
        !manifest.audio.startsWith('/audio/workshops/')) throw Error('invalid workshop audio');
  } catch {
    const status = root.querySelector<HTMLElement>('[data-audio-status]');
    if (status) status.textContent = 'Impossible de charger les chapitres audio.';
    return;
  }

  const audio = root.querySelector<HTMLAudioElement>('[data-audio-element]')!;
  const play = root.querySelector<HTMLButtonElement>('[data-audio-toggle]')!;
  const previous = root.querySelector<HTMLButtonElement>('[data-audio-previous]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-audio-next]')!;
  const seek = root.querySelector<HTMLInputElement>('[data-audio-progress]')!;
  const time = root.querySelector<HTMLElement>('[data-audio-time]')!;
  const follow = root.querySelector<HTMLInputElement>('[data-audio-follow]')!;
  const status = root.querySelector<HTMLElement>('[data-audio-status]')!;
  const transcript = root.querySelector<HTMLElement>('[data-audio-transcript]')!;
  const chapterButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-audio-chapter]'));
  const formatTime = (seconds: number) => {
    const n = Math.max(0, Math.floor(seconds));
    return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  };
  let currentChapter = -1;

  function chapterFor(seconds: number): number {
    for (let i = manifest.chapters.length - 1; i >= 0; i--) {
      if (seconds >= manifest.chapters[i].start - .05) return i;
    }
    return 0;
  }

  function render(): void {
    const seconds = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : manifest.duration;
    seek.max = String(total);
    seek.value = String(Math.min(seconds, total));
    seek.style.setProperty('--playback-progress', `${100 * seconds / Math.max(total, .01)}%`);
    time.textContent = formatTime(seconds);
    play.innerHTML = audio.paused ? '▶ <span>Écouter</span>' : 'Ⅱ <span>Pause</span>';
    play.setAttribute('aria-label', audio.paused ? 'Lire la narration' : 'Mettre la narration en pause');
    previous.disabled = currentChapter <= 0;
    next.disabled = currentChapter >= manifest.chapters.length - 1;
  }

  function highlight(index: number): void {
    if (index < 0 || index >= manifest.chapters.length || currentChapter === index) return;
    currentChapter = index;
    const chapter = manifest.chapters[index];
    transcript.textContent = chapter.text;
    status.textContent = `Chapitre ${index + 1} sur ${manifest.chapters.length} : ${chapter.title}.`;
    chapterButtons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    window.dispatchEvent(new CustomEvent('workshop:narration-chapter', { detail: { index } }));
    if (follow.checked && index > 0) {
      const target = document.querySelector<HTMLElement>(`[data-tutorial-step="${index}"]`);
      if (target) {
        target.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }
    }
  }

  function seekChapter(index: number): void {
    if (index < 0 || index >= manifest.chapters.length) return;
    audio.currentTime = manifest.chapters[index].start;
    highlight(index);
    render();
  }

  play.addEventListener('click', async () => {
    if (!audio.paused) {
      audio.pause();
      render();
      return;
    }
    try {
      await audio.play();
      status.textContent = `Lecture en cours — ${manifest.chapters[chapterFor(audio.currentTime)].title}.`;
      highlight(chapterFor(audio.currentTime));
    } catch {
      status.textContent = 'La lecture ne démarre pas. Vérifiez le son et réessayez.';
    }
    render();
  });

  previous.addEventListener('click', () => seekChapter(Math.max(0, currentChapter - 1)));
  next.addEventListener('click', () => seekChapter(Math.min(manifest.chapters.length - 1, currentChapter + 1)));
  chapterButtons.forEach((button, i) => button.addEventListener('click', () => {
    seekChapter(i);
    if (audio.paused) audio.play().catch(() => { status.textContent = 'Impossible de lancer la narration.'; });
  }));
  seek.addEventListener('input', () => {
    audio.currentTime = Number(seek.value);
    highlight(chapterFor(audio.currentTime));
    render();
  });
  audio.addEventListener('timeupdate', () => { highlight(chapterFor(audio.currentTime)); render(); });
  audio.addEventListener('seeked', () => { highlight(chapterFor(audio.currentTime)); render(); });
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('ended', () => {
    status.textContent = 'Vous avez terminé la narration. Bravo !';
    render();
  });
  audio.addEventListener('error', () => {
    status.textContent = 'Le fichier audio est indisponible. Vous pouvez toujours suivre l’atelier à l’écrit.';
  });

  window.addEventListener('workshop:step-selected', (event: Event) => {
    const step = (event as CustomEvent<{ index: number }>).detail?.index;
    if (Number.isInteger(step) && step >= 1 && step < manifest.chapters.length) seekChapter(step);
  });

  const cancelFollowOnGesture = (event: Event) => {
    if (!follow.checked) return;
    if (event.target instanceof Element && event.target.closest('[data-workshop-audio]')) return;
    follow.checked = false;
    status.textContent = 'Défilement libre activé. La narration continue.';
  };
  window.addEventListener('wheel', cancelFollowOnGesture, { passive: true });
  window.addEventListener('touchstart', cancelFollowOnGesture, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) cancelFollowOnGesture(event);
  });

  highlight(0);
  render();
}
