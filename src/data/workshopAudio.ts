import type { Workshop } from './workshops';
import mortar from './workshop-mortier-narration.json';

export interface WorkshopNarration {
  intro: string;
  steps: string[];
}

export function workshopNarration(workshop: Workshop): WorkshopNarration {
  if (workshop.slug === 'piler-aromates-au-mortier') return mortar;
  return {
    intro: `Bienvenue dans l’atelier « ${workshop.title} ». Nous allons avancer tranquillement, geste après geste. Préparez votre matériel et gardez les repères visuels sous les yeux. Vous pouvez écouter chaque étape séparément.`,
    steps: workshop.steps.map((step, index) =>
      `Étape ${index + 1} : ${step.title}. ${step.action} ${step.observe} Votre repère : ${step.cue} Pour savoir si l’étape est réussie : ${step.success}`)
  };
}

export const mortarStepImages = [
  '/images/workshops/mortier-etape-01.webp',
  '/images/workshops/mortier-etape-02.webp',
  '/images/workshops/mortier-etape-03.webp',
  '/images/workshops/mortier-etape-04.webp'
] as const;

/** Turn on only after every WebP is verified in the GitHub tree and in the static build. */
export const mortarImagePackReady = false;
