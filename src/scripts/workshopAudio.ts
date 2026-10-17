type NarrationPayload = { intro: string; steps: string[]; audio?: string[] };
type PlayerState = { index: number; utterance: SpeechSynthesisUtterance | null; active: boolean; paused: boolean };

export function initWorkshopAudio(): void {
  const root = document.querySelector<HTMLElement>('[data-workshop-voice]');
  const data = document.querySelector<HTMLScriptElement>('[data-workshop-narration]');
  if (!root || !data) return;
  const speechAvailable = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  if (!speechAvailable && !(data.textContent || '').includes('"audio":')) {
    const message = root?.querySelector<HTMLElement>('[data-voice-status]');
    if (message) message.textContent = 'La lecture vocale n’est pas disponible sur cet appareil. Le texte reste accessible.';
    root?.querySelectorAll<HTMLButtonElement>('[data-voice-play], [data-voice-pause], [data-voice-next]').forEach((button) => { button.disabled = true; });
    return;
  }
  let payload: NarrationPayload;
  try {
    payload = JSON.parse(data.textContent || '');
    if (typeof payload.intro !== 'string' || !Array.isArray(payload.steps) || payload.steps.some((step) => typeof step !== 'string')) throw Error('Invalid narration data');
  } catch {
    root.querySelector<HTMLElement>('[data-voice-status]')!.textContent = 'La narration n’a pas pu être chargée.';
    return;
  }

  const urls = Array.isArray(payload.audio) && payload.audio.length === payload.steps.length + 1 && payload.audio.every((url) => typeof url === 'string' && url.startsWith('/audio/workshops/') && url.endsWith('.mp3')) ? payload.audio : [];
  const media = urls.length ? new Audio() : null;
  if (media) media.preload = 'none';
  const synth = speechAvailable ? window.speechSynthesis : null;
  const buttonPlay = root.querySelector<HTMLButtonElement>('[data-voice-play]')!;
  const buttonPause = root.querySelector<HTMLButtonElement>('[data-voice-pause]')!;
  const buttonStop = root.querySelector<HTMLButtonElement>('[data-voice-stop]')!;
  const buttonNext = root.querySelector<HTMLButtonElement>('[data-voice-next]')!;
  const status = root.querySelector<HTMLElement>('[data-voice-status]')!;
  const dock = document.querySelector<HTMLElement>('[data-voice-dock]');
  const dockLabel = dock?.querySelector<HTMLElement>('[data-voice-dock-label]');
  const dockPause = dock?.querySelector<HTMLButtonElement>('[data-voice-dock-pause]');
  const dockStop = dock?.querySelector<HTMLButtonElement>('[data-voice-dock-stop]');
  const text = root.querySelector<HTMLElement>('[data-voice-transcript]')!;
  const stepButtons = document.querySelectorAll<HTMLButtonElement>('[data-voice-step]');
  const state: PlayerState = { index: -1, utterance: null, active: false, paused: false };
  const tracks = [payload.intro, ...payload.steps];

  const pickVoice = () => {
    const voices = synth?.getVoices() ?? [];
    // Only select a French voice: never claim a Khmer accent if the system has not verified it.
    return voices.find((voice) => voice.lang.toLowerCase() === 'fr-fr' && voice.localService) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith('fr')) ?? null;
  };
  const render = () => {
    const label = state.index < 0 ? 'Présentation' : `Étape ${state.index + 1}`;
    status.textContent = state.active ?
      `${label} — ${state.paused ? 'en pause' : 'lecture en cours'}` :
      `${label} — prêt à écouter (${media ? 'audio de l’atelier' : 'voix de votre appareil'})`;
    buttonPlay.textContent = state.active && !state.paused ? '↻ Recommencer' : state.paused ? '▶ Reprendre' : '▶ Écouter';
    buttonPause.disabled = !state.active || state.paused;
    buttonStop.disabled = !state.active;
    buttonNext.disabled = state.index >= tracks.length - 2;
    text.textContent = tracks[state.index + 1] ?? payload.intro;
    if (dock) dock.hidden = !state.active;
    if (dockLabel) dockLabel.textContent = `${label} — ${state.paused ? 'pause' : 'en cours'}`;
    if (dockPause) {
      dockPause.textContent = state.paused ? '▶' : 'Ⅱ';
      dockPause.setAttribute('aria-label', state.paused ? 'Reprendre la narration' : 'Mettre la narration en pause');
    }
    stepButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(state.active && Number(btn.dataset.voiceStep) === state.index));
    });
  };
  const cancel = () => {
    state.utterance = null;
    state.active = false;
    state.paused = false;
    if (media) { media.pause(); media.removeAttribute('src'); media.load(); }
    synth?.cancel();
  };
  const speak = (index: number) => {
    cancel();
    state.index = Math.max(-1, Math.min(index, tracks.length - 2));
    if (media) {
      media.src = urls[state.index + 1];
      state.active = true;
      render();
      media.play().catch(() => {
        cancel(); render();
        status.textContent = 'La piste audio ne peut pas être lue. La transcription reste disponible.';
      });
      return;
    }
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(tracks[state.index + 1]);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.91;
    utterance.pitch = 1;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    state.utterance = utterance;
    state.active = true;
    utterance.onend = () => {
      if (state.utterance !== utterance) return;
      state.active = false;
      state.paused = false;
      render();
    };
    utterance.onerror = () => {
      if (state.utterance !== utterance) return;
      state.active = false;
      state.paused = false;
      status.textContent = 'La lecture vocale a été interrompue. Vous pouvez lire la transcription.';
      buttonPause.disabled = true;
      buttonStop.disabled = true;
    };
    render();
    synth.speak(utterance);
  };
  if (media) {
    media.onended = () => { if (state.active) { state.active = false; state.paused = false; render(); } };
    media.onerror = () => { if (state.active) { cancel(); render(); status.textContent = 'Lecture audio interrompue.'; } };
  }
  const togglePause = () => {
    if (!state.active) return;
    if (state.paused) {
      if (media) media.play().then(() => { state.paused = false; render(); }).catch(() => { cancel(); render(); });
      else { synth?.resume(); state.paused = false; render(); }
    } else {
      if (media) media.pause(); else synth?.pause();
      state.paused = true; render();
    }
  };
  buttonPlay.addEventListener('click', () => { if (state.active && state.paused) togglePause(); else speak(state.index); });
  buttonPause.addEventListener('click', () => { if (state.active && !state.paused) togglePause(); });
  buttonStop.addEventListener('click', () => { cancel(); render(); });
  dockPause?.addEventListener('click', togglePause);
  dockStop?.addEventListener('click', () => { cancel(); render(); });
  buttonNext.addEventListener('click', () => { speak(state.index + 1); });
  stepButtons.forEach((btn) => btn.addEventListener('click', () => {
    const index = Number(btn.dataset.voiceStep);
    if (Number.isInteger(index) && index >= 0 && index < payload.steps.length) {
      speak(index);
    }
  }));
  document.addEventListener('visibilitychange', () => { if (!media && document.hidden && state.active && !state.paused) { synth?.pause(); state.paused = true; render(); } });
  window.addEventListener('pagehide', cancel, { once: true });
  render();
}
