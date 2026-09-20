export interface Recipe {
  slug: string;
  title: string;
  khmerName?: string;
  intro: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  difficulty: 'Facile' | 'Intermédiaire' | 'Avancé';
  ingredients: string[];
  steps: string[];
  notes?: string[];
  tags: string[];
}

export const recipes: Recipe[] = [
  {
    slug: 'amok-trey',
    title: 'Amok Trey',
    khmerName: 'អាម៉ុកត្រី',
    intro: 'Poisson, kroeung, lait de coco et cuisson douce : un grand classique de la cuisine cambodgienne.',
    description: 'Une version accessible de l’amok de poisson, pensée pour comprendre l’équilibre entre aromates, coco et texture sans perdre l’esprit du plat.',
    servings: '4 personnes',
    prepTime: '30 min',
    cookTime: '25 min',
    difficulty: 'Intermédiaire',
    ingredients: [
      '600 g de poisson blanc ferme',
      '250 ml de lait de coco',
      '3 c. à soupe de kroeung jaune',
      '2 œufs',
      '1 c. à soupe de sauce de poisson',
      '1 c. à café de sucre de palme',
      'Feuilles de kaffir finement émincées',
      'Basilic thaï ou basilic asiatique'
    ],
    steps: [
      'Mélanger le kroeung avec le lait de coco jusqu’à obtenir une base homogène.',
      'Ajouter la sauce de poisson, le sucre puis les œufs battus.',
      'Incorporer délicatement le poisson coupé en morceaux.',
      'Répartir dans des ramequins ou paniers adaptés à la vapeur.',
      'Cuire doucement à la vapeur jusqu’à ce que la préparation soit prise mais encore moelleuse.',
      'Terminer avec les herbes fraîches et un filet de lait de coco.'
    ],
    notes: [
      'Éviter une cuisson trop forte : l’amok doit rester souple et crémeux.',
      'Le kroeung peut être préparé à l’avance et conservé au frais.'
    ],
    tags: ['poisson', 'kroeung', 'lait de coco', 'classique']
  },
  {
    slug: 'lok-lak',
    title: 'Lok Lak',
    intro: 'Bœuf sauté, poivre et citron vert : un plat rapide qui repose sur la cuisson et l’assaisonnement.',
    description: 'Le lok lak joue sur le contraste entre viande saisie, sauce courte, fraîcheur des crudités et condiment poivré-acidulé.',
    servings: '4 personnes',
    prepTime: '20 min',
    cookTime: '10 min',
    difficulty: 'Facile',
    ingredients: [
      '600 g de bœuf tendre',
      '2 c. à soupe de sauce soja',
      '1 c. à soupe de sauce d’huître',
      '1 c. à café de sucre',
      '1 gousse d’ail',
      'Poivre noir de Kampot',
      '2 citrons verts',
      'Tomate, concombre et salade pour servir'
    ],
    steps: [
      'Couper le bœuf en cubes réguliers et l’assaisonner brièvement.',
      'Préparer le condiment avec jus de citron vert et poivre fraîchement moulu.',
      'Saisir le bœuf à feu vif en petites quantités pour bien le colorer.',
      'Ajouter la sauce en fin de cuisson et enrober rapidement.',
      'Servir immédiatement avec les crudités et le condiment au poivre.'
    ],
    notes: ['La réussite dépend surtout d’une poêle très chaude et d’une cuisson courte.'],
    tags: ['bœuf', 'poivre de Kampot', 'rapide']
  },
  {
    slug: 'kroeung-jaune',
    title: 'Kroeung jaune',
    intro: 'La pâte aromatique qui structure de nombreuses préparations khmères.',
    description: 'Citronnelle, galanga, curcuma et combava forment une base aromatique fraîche à piler progressivement pour obtenir une pâte fine et parfumée.',
    servings: '1 petit pot',
    prepTime: '25 min',
    cookTime: '0 min',
    difficulty: 'Intermédiaire',
    ingredients: [
      '4 tiges de citronnelle',
      '30 g de galanga',
      '20 g de curcuma frais',
      'Zeste de combava',
      '3 gousses d’ail',
      '2 échalotes'
    ],
    steps: [
      'Émincer très finement tous les ingrédients durs.',
      'Commencer par piler la citronnelle et le galanga.',
      'Ajouter progressivement le curcuma, le combava, l’ail puis les échalotes.',
      'Continuer jusqu’à obtenir une pâte homogène et humide.',
      'Utiliser immédiatement ou conserver dans un récipient hermétique au réfrigérateur.'
    ],
    notes: ['Un mortier donne une texture plus intéressante, mais un mixeur peut dépanner en ajoutant le moins de liquide possible.'],
    tags: ['base', 'aromates', 'citronnelle', 'curcuma']
  }
];

export function getRecipe(slug: string) {
  return recipes.find((recipe) => recipe.slug === slug);
}
