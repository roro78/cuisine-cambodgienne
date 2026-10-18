type Chapter = { title: string; start: number; text: string };

type StageSelected = CustomEvent<{ index: number }>;

function timestamp(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return Math.floor(safe / 60) + ':' + String(safe % 60).padStart(2, '0');
}

export function chapterAt(seconds: number, chapters: Chapter[]): number {
  let index = 0;
  for (let i = 1; i < chapters.length; i++) {
    if (seconds + 0.02 >= chapters[i].start) index = i;
    else break;
  }
  return index;
}

export function initWorkshopChapterPlayers(): void {
  document.querySelectorAll<HTMLElement>('[data-workshop-chapter-player]').forEach((root) => {
    if (root.dataset.playerEnhanced === 'true') return;

    let chapters: Chapter[];
    try {
      chapters = JSON.parse(root.dataset.chapters || '[]');
      if (chapters.length !== 5 || chapters.some((item, i) => !Number.isFinite(item.start) || typeof item.text !== 'string' || (i > 0 && item.start <= chapters[i - 1].start))) {
        throw new Error('Chapitres incomplets');
      }
    } catch {
      const status = root.querySelector<HTMLElement>('[data-player-status]');
      if (status) status.textContent = 'Les chapitres audio sont indisponibles.';
      return;
    }

    const audio = root.querySelector<HTMLAudioElement>('[data-player-audio]');
    const playButton = root.querySelector<HTMLButtonElement>('[data-player-play]');
    const seek = root.querySelector<HTMLInputElement>('[data-player-seek]');
    const timer = root.querySelector<HTMLElement>('[data-player-time]');
    const previous = root.querySelector<HTMLButtonElement>('[data-player-previous]');
    const next = root.querySelector<HTMLButtonElement>('[data-player-next]');
    const stopButton = root.querySelector<HTMLButtonElement>('[data-player-stop]');
    const followButton = root.querySelector<HTMLButtonElement>('[data-player-follow]');
    const followState = root.querySelector<HTMLElement>('[data-follow-state]');
    const status = root.querySelector<HTMLElement>('[data-player-status]');
    const transcript = root.querySelector<HTMLElement>('[data-player-transcript]');
    const chapterButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-player-chapter]')];
    if (!audio || !playButton || !seek || !timer || !previous || !next || !stopButton || !followButton || !status || !transcript) return;

    root.dataset.playerEnhanced = 'true';
    const plannedDuration = Number(root.dataset.audioDuration) || chapters.at(-1)?.start || 0;
    let currentChapter = -1;
    let following = false;
    let automaticScrollUntil = 0;

    function duration(): number {
      return audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : plannedDuration;
    }
    function renderFollowing(): void {
      followButton!.setAttribute('aria-pressed', String(following));
      if (followState) followState.textContent = following ? 'Activé' : 'Désactivé';
    }
    function syncStage(index: number, scroll: boolean): void {
      if (index === 0) {
        if (scroll) {
          automaticScrollUntil = Date.now() + 1800;
          root.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
          });
        }
        return;
      }
      window.dispatchEvent(new CustomEvent('workshop:audio-chapter', {
        detail: { index: index - 1 }
      }));
      if (scroll) {
        const target = document.querySelector<HTMLElement>('[data-tutorial-step="' + index + '"]');
        automaticScrollUntil = Date.now() + 1800;
        target?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start'
        });
      }
    }
    function syncChapter(force = false): void {
      if (!audio) return;
      const chapter = chapterAt(audio.currentTime, chapters);
      if (!force && chapter === currentChapter) return;
      currentChapter = chapter;
      chapterButtons.forEach((button, index) => {
        if (index === chapter) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      transcript!.textContent = chapters[chapter].text;
      status!.textContent = (chapter === 0 ? 'Présentation' : 'Étape ' + chapter + ' sur 4')
        + ' — ' + chapters[chapter].title + (audio.paused ? ' · en pause' : ' · en cours');
      previous!.disabled = chapter === 0;
      next!.disabled = chapter === chapters.length - 1;
      syncStage(chapter, following);
    }
    function renderProgress(): void {
      if (!audio) return;
      const max = duration();
      if (max > 0) {
        seek!.max = String(max);
        seek!.value = String(Math.min(audio.currentTime || 0, max));
      }
      timer!.textContent = timestamp(audio.currentTime) + ' / ' + timestamp(max);
      playButton!.setAttribute('aria-label', audio.paused ? 'Écouter l’atelier' : 'Mettre la narration en pause');
      playButton!.innerHTML = audio.paused ? '▶ <span>Écouter</span>' : 'Ⅱ <span>Pause</span>';
      syncChapter();
    }
    async function start(): Promise<void> {
      if (!audio) return;
      try {
        await audio.play();
      } catch {
        status!.textContent = 'Impossible de lancer le son. Réessayez ou consultez la transcription.';
      }
      renderProgress();
    }
    function jumpTo(chapter: number, beginPlaying: boolean): void {
      if (!audio || chapter < 0 || chapter >= chapters.length) return;
      audio.currentTime = chapters[chapter].start;
      syncChapter(true);
      renderProgress();
      if (beginPlaying) void start();
    }
    function stopFollowing(): void {
      if (!following) return;
      following = false;
      renderFollowing();
      status!.textContent = 'Défilement manuel : le suivi est désactivé, mais le son continue.';
    }

    playButton.addEventListener('click', () => {
      if (audio.paused) void start();
      else audio.pause();
    });
    stopButton.addEventListener('click', () => {
      audio.pause();
      audio.currentTime = 0;
      following = false;
      renderFollowing();
      renderProgress();
      status.textContent = 'Narration arrêtée. Vous pourrez la reprendre depuis le début.';
    });
    audio.addEventListener('play', renderProgress);
    audio.addEventListener('pause', renderProgress);
    audio.addEventListener('timeupdate', renderProgress);
    audio.addEventListener('seeked', renderProgress);
    audio.addEventListener('loadedmetadata', renderProgress);
    audio.addEventListener('error', () => { status!.textContent = 'L’audio ne peut pas être chargé. La transcription reste disponible.'; });
    audio.addEventListener('ended', () => {
      renderProgress();
      status!.textContent = 'Atelier terminé. Bravo !';
    });
    seek.addEventListener('input', () => {
      const value = Number(seek.value);
      if (Number.isFinite(value)) audio.currentTime = value;
      renderProgress();
    });
    previous.addEventListener('click', () => jumpTo(Math.max(0, chapterAt(audio.currentTime, chapters) - 1), true));
    next.addEventListener('click', () => jumpTo(Math.min(chapters.length - 1, chapterAt(audio.currentTime, chapters) + 1), true));
    chapterButtons.forEach((button) => button.addEventListener('click', () => {
      const index = Number(button.dataset.playerChapter);
      if (Number.isInteger(index)) jumpTo(index, true);
    }));
    followButton.addEventListener('click', () => {
      following = !following;
      renderFollowing();
      if (following) syncStage(chapterAt(audio.currentTime, chapters), true);
      else status!.textContent = 'Défilement libre activé. Le son continue.';
    });

    // User scroll always takes priority, including on phones and keyboard navigation.
    window.addEventListener('wheel', stopFollowing, { passive: true });
    window.addEventListener('touchmove', stopFollowing, { passive: true });
    window.addEventListener('scroll', () => {
      // A mouse drag of the page scrollbar should also disable follow.
      // Ignore scroll events emitted by our own smooth scrollIntoView.
      if (following && Date.now() > automaticScrollUntil) stopFollowing();
    }, { passive: true });
    window.addEventListener('keydown', (event) => {
      if (!['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End', ' '].includes(event.key)) return;
      // Space or arrows on controls operate the control, not the page scroll.
      if (event.target instanceof Element &&
          event.target.closest('button, input, select, textarea, summary, a, [contenteditable]')) return;
      stopFollowing();
    });
    // Selecting an existing visual stage seeks to the matching audio chapter
    // without unexpectedly starting playback.
    window.addEventListener('workshop:stage-selected', (event: Event) => {
      const index = (event as StageSelected).detail?.index;
      if (!Number.isInteger(index) || index < 0 || index > 3) return;
      jumpTo(index + 1, false);
    });

    renderFollowing();
    renderProgress();
  });
}
