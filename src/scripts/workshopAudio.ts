type NarrationPayload = { intro: string; steps: string[] };
type PlayerState = { index: number; utterance: SpeechSynthesisUtterance | null; active: boolean; paused: boolean };

export function initWorkshopAudio(): void {
  const root = document.querySelector<HTMLElement>('[data-workshop-voice]');
  const data = document.querySelector<HTMLScriptElement>('[data-workshop-narration]');
  if (!root || !data || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
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

  const synth = window.speechSynthesis;
  const buttonPlay = root.querySelector<HTMLButtonElement>('[data-voice-play]')!;
  const buttonPause = root.querySelector<HTMLButtonElement>('[data-voice-pause]')!;
  const buttonStop = root.querySelector<HTMLButtonElement>('[data-voice-stop]')!;
  const buttonNext = root.querySelector<HTMLButtonElement>('[data-voice-next]')!;
  const status = root.querySelector<HTMLElement>('[data-voice-status]')!;
  const text = root.querySelector<HTMLElement>('[data-voice-transcript]')!;
  const stepButtons = document.querySelectorAll<HTMLButtonElement>('[data-voice-step]');
  const state: PlayerState = { index: -1, utterance: null, active: false, paused: false };
  const tracks = [payload.intro, ...payload.steps];

  const pickVoice = () => {
    const voices = synth.getVoices();
    // Only select a French voice: never claim a Khmer accent if the system has not verified it.
    return voices.find((voice) => voice.lang.toLowerCase() === 'fr-fr' && voice.localService) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith('fr')) ?? null;
  };
  const render = () => {
    const label = state.index < 0 ? 'Présentation' : `Étape ${state.index + 1}`;
    status.textContent = state.active ?
      `${label} — ${state.paused ? 'en pause' : 'lecture en cours'}` :
      `${label} — prêt à écouter (voix de votre appareil)`;
    buttonPlay.textContent = state.active && !state.paused ? '↻ Recommencer' : state.paused ? '▶ Reprendre' : '▶ Écouter';
    buttonPause.disabled = !state.active || state.paused;
    buttonStop.disabled = !state.active;
    buttonNext.disabled = state.index >= tracks.length - 2;
    text.textContent = tracks[state.index + 1] ?? payload.intro;
    stepButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(Number(btn.dataset.voiceStep) === state.index));
    });
  };
  const cancel = () => {
    state.utterance = null;
    state.active = false;
    state.paused = false;
    synth.cancel();
  };
  const speak = (index: number) => {
    cancel();
    state.index = Math.max(-1, Math.min(index, tracks.length - 2));
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
  buttonPlay.addEventListener('click', () => {
    if (state.active && state.paused) { synth.resume(); state.paused = false; render(); return; }
    speak(state.index);
  });
  buttonPause.addEventListener('click', () => {
    if (state.active) { synth.pause(); state.paused = true; render(); }
  });
  buttonStop.addEventListener('click', () => { cancel(); render(); });
  buttonNext.addEventListener('click', () => { speak(state.index + 1); });
  stepButtons.forEach((btn) => btn.addEventListener('click', () => {
    const index = Number(btn.dataset.voiceStep);
    if (Number.isInteger(index) && index >= 0 && index < payload.steps.length) {
      root.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
      speak(index);
    }
  }));
  document.addEventListener('visibilitychange', () => { if (document.hidden && state.active && !state.paused) { synth.pause(); state.paused = true; render(); } });
  window.addEventListener('pagehide', cancel, { once: true });
  render();
}
