import type { Workshop } from './workshops';

export interface WorkshopNarration {
  intro: string;
  steps: string[];
}

const mortar: WorkshopNarration = {
  intro: `Bienvenue dans cet atelier consacré au mortier. Aujourd’hui, nous allons apprendre à préparer les aromates du kroeung, cette pâte parfumée utilisée dans plusieurs recettes cambodgiennes. Prenez votre temps. Ici, nous ne cherchons pas à aller vite : nous allons observer comment la citronnelle, le galanga, le curcuma, l’ail et l’échalote changent de texture et libèrent leurs parfums. Gardez une petite assiette à portée de main pour comparer le début et la fin.`,
  steps: [
    `Première étape : la découpe. La citronnelle et le galanga ont des fibres résistantes. Émincez-les le plus finement possible avant de commencer. Prenez un instant pour sentir les aromates fraîchement coupés. Si les morceaux sont trop gros, le pilon glissera dessus plutôt que de les écraser. Vous pouvez passer à la suite lorsque les morceaux sont petits et réguliers.`,
    `Nous pouvons commencer à piler. Déposez d’abord les éléments les plus fermes dans le mortier. Travaillez par petites quantités, sans chercher à frapper fort. Ajoutez ensuite progressivement les éléments les plus tendres. Regardez : les morceaux distincts se rassemblent peu à peu en une masse dense. Quand le pilon ne rebondit presque plus sur les gros fragments, nous pouvons continuer.`,
    `Troisième étape : transformons les aromates en pâte. Pilez régulièrement et ramenez les morceaux sur les côtés vers le centre. La citronnelle devient moins visible, les couleurs se mêlent et le parfum s’intensifie. N’ajoutez pas beaucoup d’eau pour accélérer le geste : nous voulons obtenir une pâte concentrée. Prenez-en une petite pincée. Si elle reste liée et souple, vous approchez de la bonne texture.`,
    `Dernière étape : comparons notre résultat. Déposez côte à côte une petite quantité de pâte prélevée à mi-parcours et un peu de la préparation finale. Observez les fibres, la couleur et la façon dont chaque portion se tient. La pâte terminée doit paraître plus fine, plus homogène et très parfumée. Bravo : vous avez maintenant un repère visuel que vous pourrez retrouver dans d’autres recettes.`
  ]
};

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
