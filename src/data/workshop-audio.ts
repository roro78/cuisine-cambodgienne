import mortier from './workshop-audio/piler-aromates-au-mortier.json';
import sauce from './workshop-audio/equilibrer-une-sauce.json';
import viande from './workshop-audio/saisir-viande-poele.json';
import herbes from './workshop-audio/fraicheur-herbes-agrumes.json';
import bouillon from './workshop-audio/bouillon-leger-savoureux.json';
import table from './workshop-audio/composer-repas-cambodgien.json';

export interface WorkshopAudioChapter {
  title: string;
  start: number;
  text: string;
}

export interface WorkshopAudioInfo {
  slug: string;
  title: string;
  voice: string;
  audio: string;
  duration: number;
  chapters: WorkshopAudioChapter[];
}

const all: WorkshopAudioInfo[] = [mortier, sauce, viande, herbes, bouillon, table];
const bySlug = new Map(all.map((item) => [item.slug, item]));

// Audio is deliberately released workshop by workshop. The files and manifests
// can be shipped ahead of time, but a player is rendered only after that workshop
// has passed its own production validation.
const releasedWorkshopAudio = new Set([
  'piler-aromates-au-mortier',
  'equilibrer-une-sauce'
]);

export function getWorkshopAudio(slug: string): WorkshopAudioInfo | undefined {
  return releasedWorkshopAudio.has(slug) ? bySlug.get(slug) : undefined;
}
