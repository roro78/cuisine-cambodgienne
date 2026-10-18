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
    const mobileDock = root.querySelector<HTMLElement>('[data-player-mobile-dock]');
    const mobilePlay = root.querySelector<HTMLButtonElement>('[data-mobile-play]');
    const mobileStop = root.querySelector<HTMLButtonElement>('[data-mobile-stop]');
    const mobilePrevious = root.querySelector<HTMLButtonElement>('[data-mobile-previous]');
    const mobileNext = root.querySelector<HTMLButtonElement>('[data-mobile-next]');
    const mobileFollow = root.querySelector<HTMLButtonElement>('[data-mobile-follow]');
    const mobileSeek = root.querySelector<HTMLInputElement>('[data-mobile-seek]');
    const mobileTime = root.querySelector<HTMLElement>('[data-mobile-time]');
    const mobileChapterTitle = root.querySelector<HTMLElement>('[data-mobile-chapter-title]');
    const mobileChapterCount = root.querySelector<HTMLElement>('[data-mobile-chapter-count]');
    const mobileBackdrop = root.querySelector<HTMLElement>('[data-mobile-backdrop]');
    const mobileSheet = root.querySelector<HTMLElement>('[data-mobile-sheet]');
    const mobileToggle = root.querySelector<HTMLButtonElement>('[data-mobile-toggle]');
    const mobileToggleLabel = root.querySelector<HTMLElement>('[data-mobile-toggle-label]');
    const mobileSheetClose = root.querySelector<HTMLButtonElement>('[data-mobile-sheet-close]');
    const mobileTranscript = root.querySelector<HTMLElement>('[data-mobile-transcript]');
    const mobileChapterButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-mobile-chapter]')];

    if (!audio || !playButton || !seek || !timer || !previous || !next || !stopButton || !followButton || !status || !transcript) return;

    root.dataset.playerEnhanced = 'true';
    const plannedDuration = Number(root.dataset.audioDuration) || chapters.at(-1)?.start || 0;
    let currentChapter = -1;
    let following = false;
    let automaticScrollUntil = 0;
    let tutorialVisible = false;
    let sheetExpanded = false;
    let gestureStartY: number | null = null;
    let lastSwipeAt = 0;
    const mobileViewport = window.matchMedia('(max-width: 760px)');

    function setSheetExpanded(expanded: boolean, restoreFocus = false): void {
      if (!mobileDock || !mobileSheet || !mobileToggle || !mobileViewport.matches && expanded) return;
      sheetExpanded = expanded;
      mobileDock.dataset.dockExpanded = String(expanded);
      mobileDock.setAttribute('role', expanded ? 'dialog' : 'region');
      if (expanded) mobileDock.setAttribute('aria-modal', 'true');
      else mobileDock.removeAttribute('aria-modal');
      mobileDock.setAttribute('aria-label', expanded ? 'Navigation de la narration' : 'Mini-lecteur de l’atelier');
      mobileSheet.hidden = !expanded;
      if (mobileBackdrop) mobileBackdrop.hidden = !expanded;
      mobileToggle.setAttribute('aria-expanded', String(expanded));
      mobileToggle.setAttribute('aria-label', expanded ? 'Replier les chapitres et la transcription du lecteur' : 'Déployer les chapitres et la transcription du lecteur');
      if (mobileToggleLabel) mobileToggleLabel.textContent = expanded ? 'Glisser vers le bas · Réduire' : 'Glisser vers le haut · Chapitres & texte';
      document.documentElement.classList.toggle('workshop-sheet-open', expanded);
      if (expanded) mobileSheetClose?.focus({ preventScroll: true });
      else if (restoreFocus) mobileToggle.focus({ preventScroll: true });
    }
    function updateMobileDockVisibility(): void {
      if (!mobileDock || !audio) return;
      const visible = mobileViewport.matches && (tutorialVisible || !audio.paused);
      mobileDock.dataset.dockVisible = String(visible);
      document.documentElement.classList.toggle('workshop-dock-open', visible);
      if (!visible && sheetExpanded) setSheetExpanded(false);
    }
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver((entries) => {
        tutorialVisible = entries[0]?.isIntersecting ?? false;
        updateMobileDockVisibility();
      });
      observer.observe(root.closest('[data-workshop-tutorial]') ?? root);
    } else {
      tutorialVisible = true;
    }
    mobileViewport.addEventListener('change', updateMobileDockVisibility);
    mobileToggle?.addEventListener('click', () => {
      // Pointer swipes can emit a click on touch devices; don't undo the gesture.
      if (Date.now() - lastSwipeAt < 650) return;
      setSheetExpanded(!sheetExpanded, true);
    });
    mobileSheetClose?.addEventListener('click', () => setSheetExpanded(false, true));
    mobileBackdrop?.addEventListener('click', () => setSheetExpanded(false, true));
    const grip = root.querySelector<HTMLElement>('[data-mobile-gesture-zone]');
    const sheetHeader = root.querySelector<HTMLElement>('[data-mobile-sheet-gesture]');
    for (const zone of [grip, sheetHeader]) {
      zone?.addEventListener('pointerdown', (event: PointerEvent) => {
        if (event.target instanceof Element && event.target.closest('button:not([data-mobile-toggle])')) return;
        gestureStartY = event.clientY;
      });
      zone?.addEventListener('pointerup', (event: PointerEvent) => {
        if (gestureStartY === null) return;
        const distance = event.clientY - gestureStartY;
        gestureStartY = null;
        if (Math.abs(distance) < 38) return;
        lastSwipeAt = Date.now();
        if (distance < 0) setSheetExpanded(true);
        else setSheetExpanded(false, true);
      });
      zone?.addEventListener('pointercancel', () => { gestureStartY = null; });
    }
    mobileDock?.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!sheetExpanded) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setSheetExpanded(false, true);
        return;
      }
      // Expanded panel is a modal dialog, so keep keyboard focus in the dock.
      if (event.key !== 'Tab') return;
      const controls = [...mobileDock.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], summary')]
        .filter((element) => element.getClientRects().length > 0);
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    function duration(): number {
      return audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : plannedDuration;
    }
    function renderFollowing(): void {
      followButton!.setAttribute('aria-pressed', String(following));
      if (followState) followState.textContent = following ? 'Activé' : 'Désactivé';
      if (mobileFollow) {
        mobileFollow.setAttribute('aria-pressed', String(following));
        mobileFollow.textContent = following ? '◉ Guidage actif' : '◉ Suivre';
      }
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
      [...chapterButtons, ...mobileChapterButtons].forEach((button) => {
        const index = Number(button.dataset.playerChapter ?? button.dataset.mobileChapter);
        if (index === chapter) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      transcript!.textContent = chapters[chapter].text;
      if (mobileTranscript) mobileTranscript.textContent = chapters[chapter].text;
      if (mobileChapterTitle) mobileChapterTitle.textContent = chapters[chapter].title;
      if (mobileChapterCount) mobileChapterCount.textContent = chapter === 0 ? 'Introduction' : 'Étape ' + chapter + '/4';
      status!.textContent = (chapter === 0 ? 'Présentation' : 'Étape ' + chapter + ' sur 4')
        + ' — ' + chapters[chapter].title + (audio.paused ? ' · en pause' : ' · en cours');
      previous!.disabled = chapter === 0;
      next!.disabled = chapter === chapters.length - 1;
      if (mobilePrevious) mobilePrevious.disabled = chapter === 0;
      if (mobileNext) mobileNext.disabled = chapter === chapters.length - 1;
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
      if (mobileSeek && max > 0) {
        mobileSeek.max = String(max);
        mobileSeek.value = String(Math.min(audio.currentTime || 0, max));
      }
      if (mobileTime) mobileTime.textContent = timestamp(audio.currentTime) + ' / ' + timestamp(max);
      if (mobilePlay) {
        mobilePlay.setAttribute('aria-label', audio.paused ? 'Écouter l’atelier' : 'Mettre la narration en pause');
        mobilePlay.textContent = audio.paused ? '▶' : 'Ⅱ';
      }
      playButton!.setAttribute('aria-label', audio.paused ? 'Écouter l’atelier' : 'Mettre la narration en pause');
      playButton!.innerHTML = audio.paused ? '▶ <span>Écouter</span>' : 'Ⅱ <span>Pause</span>';
      syncChapter();
      updateMobileDockVisibility();
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

    function togglePlay(): void {
      if (audio!.paused) void start();
      else audio!.pause();
    }
    function stop(): void {
      audio!.pause();
      audio!.currentTime = 0;
      following = false;
      renderFollowing();
      renderProgress();
      status!.textContent = 'Narration arrêtée. Vous pourrez la reprendre depuis le début.';
    }
    playButton.addEventListener('click', togglePlay);
    mobilePlay?.addEventListener('click', togglePlay);
    stopButton.addEventListener('click', stop);
    mobileStop?.addEventListener('click', stop);
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
    function seekTo(value: number): void {
      if (Number.isFinite(value)) audio!.currentTime = value;
      renderProgress();
    }
    seek.addEventListener('input', () => seekTo(Number(seek.value)));
    mobileSeek?.addEventListener('input', () => seekTo(Number(mobileSeek.value)));
    const goPrevious = () => jumpTo(Math.max(0, chapterAt(audio.currentTime, chapters) - 1), true);
    const goNext = () => jumpTo(Math.min(chapters.length - 1, chapterAt(audio.currentTime, chapters) + 1), true);
    previous.addEventListener('click', goPrevious);
    next.addEventListener('click', goNext);
    mobilePrevious?.addEventListener('click', goPrevious);
    mobileNext?.addEventListener('click', goNext);
    chapterButtons.forEach((button) => button.addEventListener('click', () => {
      const index = Number(button.dataset.playerChapter);
      if (Number.isInteger(index)) jumpTo(index, true);
    }));
    mobileChapterButtons.forEach((button) => button.addEventListener('click', () => {
      const index = Number(button.dataset.mobileChapter);
      if (Number.isInteger(index)) {
        jumpTo(index, true);
        // Reveal the selected culinary gesture underneath the sheet.
        setSheetExpanded(false, true);
      }
    }));
    function toggleFollowing(): void {
      following = !following;
      renderFollowing();
      if (following) {
        setSheetExpanded(false);
        syncStage(chapterAt(audio!.currentTime, chapters), true);
      } else status!.textContent = 'Défilement libre activé. Le son continue.';
    }
    followButton.addEventListener('click', toggleFollowing);
    mobileFollow?.addEventListener('click', toggleFollowing);

    // User scroll always takes priority, including on phones and keyboard navigation.
    window.addEventListener('wheel', stopFollowing, { passive: true });
    window.addEventListener('touchmove', (event) => {
      // Touch gestures on the timeline or player do not count as manual page scrolling.
      if (event.target instanceof Element && event.target.closest('[data-workshop-chapter-player]')) return;
      stopFollowing();
    }, { passive: true });
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
    setSheetExpanded(false);
  });
}
